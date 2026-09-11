<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Request.php';
require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../models/Deal.php';
require_once __DIR__ . '/../models/Activity.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/validator.php';

class RequestController {
    private RequestModel $requestModel;
    private CustomerModel $customerModel;
    private DealModel $dealModel;
    private ActivityModel $activityModel;

    public function __construct() {
        $this->requestModel = new RequestModel();
        $this->customerModel = new CustomerModel();
        $this->dealModel = new DealModel();
        $this->activityModel = new ActivityModel();
    }

    public function index(): void {
        $status = $_GET['status'] ?? null;
        $customerId = isset($_GET['customerId']) ? (int)$_GET['customerId'] : null;
        $search = $_GET['search'] ?? null;

        $requests = $this->requestModel->getAll($status, $customerId, $search);

        $result = array_map(function ($r) {
            $r['customerName'] = $r['customer_name'];
            $r['customerPhone'] = $r['customer_phone'];
            $r['requestedUsdAmount'] = (float)$r['requested_usd_amount'];
            $r['targetRate'] = $r['target_rate'] !== null ? (float)$r['target_rate'] : null;
            $r['convertedDealId'] = $r['converted_deal_id'] ? (string)$r['converted_deal_id'] : null;
            return $r;
        }, $requests);

        jsonSuccess($result);
    }

    public function create(): void {
        $data = getJsonInput();
        requireFields($data, ['customerName', 'customerPhone', 'requestedUsdAmount']);

        // Find or create customer
        $customerName = sanitizeString($data['customerName']);
        $customerPhone = sanitizeString($data['customerPhone']);
        $customerId = $data['customerId'] ?? null;

        if (!$customerId) {
            $existing = $this->customerModel->findByPhone($customerPhone);
            if ($existing) {
                $customerId = (int)$existing['id'];
            } else {
                $customerId = $this->customerModel->create([
                    'name' => $customerName,
                    'phone' => $customerPhone,
                ]);
            }
        }

        $requestNumber = $this->requestModel->getNextRequestNumber();

        $requestId = $this->requestModel->create([
            'request_number' => $requestNumber,
            'customer_id' => $customerId,
            'requested_usd_amount' => (float)$data['requestedUsdAmount'],
            'target_rate' => $data['targetRate'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => 'pending',
            'preferred_channel' => $data['preferredChannel'] ?? $data['preferred_channel'] ?? 'WhatsApp',
        ]);

        $this->activityModel->create([
            'customer_id' => $customerId,
            'customer_name' => $customerName,
            'event_type' => 'request_created',
            'title' => "Dollar Inquiry $requestNumber",
            'description' => "$customerName requested \${$data['requestedUsdAmount']}" .
                (isset($data['targetRate']) ? " @ ৳{$data['targetRate']}" : '') . ".",
            'amount_usd' => (float)$data['requestedUsdAmount'],
            'badge_type' => 'purple',
        ]);

        $request = $this->requestModel->getById($requestId);
        jsonSuccess($request, 'Request created');
    }

    public function convert(int $id): void {
        $request = $this->requestModel->getById($id);
        if (!$request) jsonError('Request not found', 404);

        $data = getJsonInput();
        requireFields($data, ['exchangeRate']);

        // Create deal from request
        $customer = $this->customerModel->getById((int)$request['customer_id']);
        if (!$customer) jsonError('Customer not found', 404);

        $dollarAmount = (float)$request['requested_usd_amount'];
        $exchangeRate = (float)$data['exchangeRate'];
        $expectedBdt = round($dollarAmount * $exchangeRate);
        $dealNumber = $this->dealModel->getNextDealNumber();

        $dealId = $this->dealModel->create([
            'deal_number' => $dealNumber,
            'customer_id' => (int)$request['customer_id'],
            'dollar_amount' => $dollarAmount,
            'exchange_rate' => $exchangeRate,
            'expected_bdt_amount' => $expectedBdt,
            'status' => 'draft',
            'notes' => $request['notes'] ? "Converted from {$request['request_number']}: {$request['notes']}" : null,
            'linked_request_id' => $id,
        ]);

        // Create initial timeline event
        $this->dealModel->addTimelineEvent([
            'deal_id' => $dealId,
            'event_type' => 'deal_created',
            'actor_role' => 'owner',
            'actor_name' => 'Business Owner',
            'title' => "Deal Created from Request $requestNumber",
            'description' => "Agreement for \$$dollarAmount @ ৳" . number_format($exchangeRate, 2) . " = ৳" . number_format($expectedBdt) . ".",
            'amount_usd' => $dollarAmount,
            'amount_bdt' => $expectedBdt,
            'exchange_rate' => $exchangeRate,
        ]);

        // Mark request as converted
        $this->requestModel->update($id, [
            'status' => 'converted',
            'converted_deal_id' => $dealId,
        ]);

        $this->activityModel->create([
            'deal_id' => $dealId,
            'deal_number' => $dealNumber,
            'customer_id' => (int)$request['customer_id'],
            'customer_name' => $customer['name'],
            'event_type' => 'deal_created',
            'title' => "Deal $dealNumber Created",
            'description' => "Converted from inquiry {$request['request_number']}. \$$dollarAmount @ ৳" . number_format($exchangeRate, 2) . ".",
            'amount_usd' => $dollarAmount,
            'amount_bdt' => $expectedBdt,
            'badge_type' => 'info',
        ]);

        $deal = $this->dealModel->getById($dealId);
        $deal['customerName'] = $customer['name'];
        $deal['customerPhone'] = $customer['phone'];
        $deal['timeline'] = array_map(fn($e) => [
            'id' => (string)$e['id'],
            'timestamp' => $e['created_at'],
            'type' => $e['event_type'],
            'actor' => $e['actor_role'],
            'actorName' => $e['actor_name'],
            'title' => $e['title'],
            'description' => $e['description'],
            'amountUsd' => $e['amount_usd'] !== null ? (float)$e['amount_usd'] : null,
            'amountBdt' => $e['amount_bdt'] !== null ? (float)$e['amount_bdt'] : null,
            'exchangeRate' => $e['exchange_rate'] !== null ? (float)$e['exchange_rate'] : null,
        ], $this->dealModel->getTimeline($dealId));

        jsonSuccess($deal, 'Request converted to deal');
    }

    public function reject(int $id): void {
        $request = $this->requestModel->getById($id);
        if (!$request) jsonError('Request not found', 404);

        $this->requestModel->update($id, ['status' => 'rejected']);
        jsonSuccess(null, 'Request rejected');
    }

    public function archive(int $id): void {
        $request = $this->requestModel->getById($id);
        if (!$request) jsonError('Request not found', 404);

        $this->requestModel->update($id, ['status' => 'archived']);
        jsonSuccess(null, 'Request archived');
    }
}
