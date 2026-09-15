<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Deal.php';
require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../models/Request.php';
require_once __DIR__ . '/../models/Activity.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/validator.php';

class DealController {
    private DealModel $dealModel;
    private CustomerModel $customerModel;
    private RequestModel $requestModel;
    private ActivityModel $activityModel;

    public function __construct() {
        $this->dealModel = new DealModel();
        $this->customerModel = new CustomerModel();
        $this->requestModel = new RequestModel();
        $this->activityModel = new ActivityModel();
    }

    public function index(): void {
        $status = $_GET['status'] ?? null;
        $customerId = isset($_GET['customerId']) ? (int)$_GET['customerId'] : null;
        $search = $_GET['search'] ?? null;
        $sort = $_GET['sort'] ?? 'newest';
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

        $deals = $this->dealModel->getAll($status, $customerId, $search, $sort, $page, $limit);

        $timelines = $this->dealModel->getTimelinesForDeals(
            array_map(static fn(array $deal): int => (int)$deal['id'], $deals)
        );
        $result = array_map(static function (array $deal) use ($timelines): array {
            $deal['timeline'] = $timelines[(string)$deal['id']] ?? [];
            return mapDeal($deal);
        }, $deals);

        jsonSuccess($result);
    }

    public function show(int $id): void {
        $deal = $this->dealModel->getById($id);
        if (!$deal) jsonError('Deal not found', 404);

        $deal['timeline'] = $this->dealModel->getTimeline($id);
        jsonSuccess(mapDeal($deal));
    }

    public function create(): void {
        $data = getJsonInput();
        requireFields($data, ['customerId', 'dollarAmount', 'exchangeRate']);

        $customer = $this->customerModel->getById((int)$data['customerId']);
        if (!$customer) jsonError('Customer not found', 404);

        $dollarAmount = (float)$data['dollarAmount'];
        $exchangeRate = (float)$data['exchangeRate'];
        $expectedBdt = round($dollarAmount * $exchangeRate);
        $dealNumber = $this->dealModel->getNextDealNumber();

        $dealId = $this->dealModel->create([
            'deal_number' => $dealNumber,
            'customer_id' => (int)$data['customerId'],
            'dollar_amount' => $dollarAmount,
            'exchange_rate' => $exchangeRate,
            'expected_bdt_amount' => $expectedBdt,
            'status' => 'draft',
            'notes' => $data['notes'] ?? null,
            'linked_request_id' => isset($data['linkedRequestId']) ? (int)$data['linkedRequestId'] : null,
        ]);

        // Create initial timeline event
        $this->dealModel->addTimelineEvent([
            'deal_id' => $dealId,
            'event_type' => 'deal_created',
            'actor_role' => 'owner',
            'actor_name' => 'Ahmed Sourov',
            'title' => isset($data['linkedRequestId'])
                ? "Deal Created from Request ($dealNumber)"
                : "Deal Created ($dealNumber)",
            'description' => "Agreement registered for \$$dollarAmount @ ৳" . number_format($exchangeRate, 2) . ". Expected payment: ৳" . number_format($expectedBdt) . ".",
            'amount_usd' => $dollarAmount,
            'amount_bdt' => $expectedBdt,
            'exchange_rate' => $exchangeRate,
        ]);

        // Mark linked request as converted
        if (!empty($data['linkedRequestId'])) {
            $this->requestModel->update((int)$data['linkedRequestId'], [
                'status' => 'converted',
                'converted_deal_id' => $dealId,
            ]);
        }

        // Log activity
        $this->activityModel->create([
            'deal_id' => $dealId,
            'deal_number' => $dealNumber,
            'customer_id' => (int)$data['customerId'],
            'customer_name' => $customer['name'],
            'event_type' => 'deal_created',
            'title' => "Deal $dealNumber Created",
            'description' => "Agreed on \$$dollarAmount @ ৳" . number_format($exchangeRate, 2) . " with {$customer['name']}.",
            'amount_usd' => $dollarAmount,
            'amount_bdt' => $expectedBdt,
            'badge_type' => 'info',
        ]);

        $deal = $this->dealModel->getById($dealId);
        $deal['timeline'] = $this->dealModel->getTimeline($dealId);

        jsonSuccess(mapDeal($deal), 'Deal created');
    }

    public function uploadProof(int $id): void {
        $deal = $this->dealModel->getById($id);
        if (!$deal) jsonError('Deal not found', 404);

        $data = getJsonInput();
        $proofUrl = $data['proofImageUrl'] ?? $data['proof_image_url'] ?? null;
        $note = $data['note'] ?? null;

        $now = date('Y-m-d H:i:s');

        $this->dealModel->addTimelineEvent([
            'deal_id' => $id,
            'event_type' => 'dollar_proof_uploaded',
            'actor_role' => 'owner',
            'actor_name' => 'Ahmed Sourov',
            'title' => 'Dollar Transfer Proof Sent',
            'description' => $note ?: "Sent \${$deal['dollar_amount']} to your wallet. Waiting for your confirmation.",
            'amount_usd' => $deal['dollar_amount'],
            'proof_image_url' => $proofUrl,
            'proof_type' => 'usd_sent',
        ]);

        $this->dealModel->update($id, [
            'status' => 'awaiting_confirmation',
            'dollar_proof_url' => $proofUrl,
            'dollar_proof_uploaded_at' => $now,
        ]);

        $this->activityModel->create([
            'deal_id' => $id,
            'deal_number' => $deal['deal_number'],
            'customer_id' => $deal['customer_id'],
            'customer_name' => $deal['customer_name'],
            'event_type' => 'dollar_proof_uploaded',
            'title' => "Dollar Proof Sent ({$deal['deal_number']})",
            'description' => "Owner dispatched \${$deal['dollar_amount']} proof. Awaiting confirmation.",
            'amount_usd' => $deal['dollar_amount'],
            'badge_type' => 'info',
        ]);

        $updated = $this->dealModel->getById($id);
        $updated['timeline'] = $this->dealModel->getTimeline($id);
        jsonSuccess(mapDeal($updated), 'Dollar proof uploaded');
    }

    public function confirmReceipt(int $id): void {
        $deal = $this->dealModel->getById($id);
        if (!$deal) jsonError('Deal not found', 404);

        $now = date('Y-m-d H:i:s');
        $currentDue = (float)$deal['expected_bdt_amount'] - (float)$deal['paid_amount'];
        $newStatus = (float)$deal['paid_amount'] > 0 ? 'partially_paid' : 'active_due';

        $this->dealModel->update($id, [
            'status' => $newStatus,
            'due_amount' => $currentDue,
            'confirmed_at' => $now,
        ]);

        $this->activityModel->create([
            'deal_id' => $id,
            'deal_number' => $deal['deal_number'],
            'customer_id' => $deal['customer_id'],
            'customer_name' => $deal['customer_name'],
            'event_type' => 'receipt_confirmed',
            'title' => "Dollar Receipt Confirmed ({$deal['deal_number']})",
            'description' => "{$deal['customer_name']} confirmed receipt of \${$deal['dollar_amount']}. ৳" . number_format($currentDue) . " is now active due.",
            'amount_bdt' => $currentDue,
            'badge_type' => 'success',
        ]);

        $updated = $this->dealModel->getById($id);
        $updated['timeline'] = $this->dealModel->getTimeline($id);
        jsonSuccess(mapDeal($updated), 'Receipt confirmed');
    }

    public function dispute(int $id): void {
        $deal = $this->dealModel->getById($id);
        if (!$deal) jsonError('Deal not found', 404);

        $data = getJsonInput();
        $reason = $data['reason'] ?? 'No reason provided';

        $this->dealModel->addTimelineEvent([
            'deal_id' => $id,
            'event_type' => 'receipt_disputed',
            'actor_role' => 'customer',
            'actor_name' => $deal['customer_name'],
            'title' => 'Dollar Receipt Disputed',
            'description' => "Customer reported an issue: \"$reason\"",
            'amount_usd' => $deal['dollar_amount'],
        ]);

        $this->dealModel->update($id, ['status' => 'disputed']);

        $this->activityModel->create([
            'deal_id' => $id,
            'deal_number' => $deal['deal_number'],
            'customer_id' => $deal['customer_id'],
            'customer_name' => $deal['customer_name'],
            'event_type' => 'receipt_disputed',
            'title' => "Dispute Raised on {$deal['deal_number']}",
            'description' => "{$deal['customer_name']} flagged: \"$reason\"",
            'amount_usd' => $deal['dollar_amount'],
            'badge_type' => 'danger',
        ]);

        $updated = $this->dealModel->getById($id);
        $updated['timeline'] = $this->dealModel->getTimeline($id);
        jsonSuccess(mapDeal($updated), 'Dispute raised');
    }

    public function cancel(int $id): void {
        $deal = $this->dealModel->getById($id);
        if (!$deal) jsonError('Deal not found', 404);

        $data = getJsonInput();
        $reason = $data['reason'] ?? 'Cancelled by owner';

        $this->dealModel->addTimelineEvent([
            'deal_id' => $id,
            'event_type' => 'deal_cancelled',
            'actor_role' => 'owner',
            'actor_name' => 'Ahmed Sourov',
            'title' => 'Deal Cancelled',
            'description' => "Deal cancelled: \"$reason\"",
        ]);

        $this->dealModel->update($id, [
            'status' => 'cancelled',
            'due_amount' => 0,
        ]);

        $updated = $this->dealModel->getById($id);
        $updated['timeline'] = $this->dealModel->getTimeline($id);
        jsonSuccess(mapDeal($updated), 'Deal cancelled');
    }

    public function submitPayment(int $dealId): void {
        $deal = $this->dealModel->getById($dealId);
        if (!$deal) jsonError('Deal not found', 404);

        $data = getJsonInput();
        requireFields($data, ['amountBdt']);

        $amountBdt = (float)$data['amountBdt'];
        $proofUrl = $data['proofImageUrl'] ?? $data['proof_image_url'] ?? null;
        $note = $data['note'] ?? null;
        $paymentEventId = 'pay-' . time() . '-' . substr(md5((string)mt_rand()), 0, 4);
        $now = date('Y-m-d H:i:s');

        $this->dealModel->addTimelineEvent([
            'deal_id' => $dealId,
            'event_type' => 'payment_proof_submitted',
            'actor_role' => 'customer',
            'actor_name' => $deal['customer_name'],
            'title' => 'Payment Proof Submitted (৳' . number_format($amountBdt) . ')',
            'description' => $note ?: null,
            'amount_bdt' => $amountBdt,
            'proof_image_url' => $proofUrl,
            'proof_type' => 'bdt_paid',
            'proof_status' => 'pending',
            'payment_event_id' => $paymentEventId,
        ]);

        $this->activityModel->create([
            'deal_id' => $dealId,
            'deal_number' => $deal['deal_number'],
            'customer_id' => $deal['customer_id'],
            'customer_name' => $deal['customer_name'],
            'event_type' => 'payment_proof_submitted',
            'title' => 'Payment Proof Submitted (৳' . number_format($amountBdt) . ')',
            'description' => "{$deal['customer_name']} submitted payment screenshot for deal {$deal['deal_number']}.",
            'amount_bdt' => $amountBdt,
            'badge_type' => 'warning',
        ]);

        $this->dealModel->update($dealId, [
            'status' => 'fundify_verification_pending',
        ]);

        $updated = $this->dealModel->getById($dealId);
        $updated['timeline'] = $this->dealModel->getTimeline($dealId);
        jsonSuccess(mapDeal($updated), 'Payment proof submitted');
    }

    public function approvePayment(int $dealId, int $eventId): void {
        $deal = $this->dealModel->getById($dealId);
        if (!$deal) jsonError('Deal not found', 404);

        // Find the payment event
        $timeline = $this->dealModel->getTimeline($dealId);
        $targetEvent = null;
        foreach ($timeline as $evt) {
            if ((int)$evt['id'] === $eventId) {
                $targetEvent = $evt;
                break;
            }
        }
        if (!$targetEvent) jsonError('Payment event not found', 404);

        $amountToApprove = (float)$targetEvent['amount_bdt'];
        if ($amountToApprove <= 0) jsonError('Invalid payment amount', 400);

        $now = date('Y-m-d H:i:s');
        $newPaidAmount = (float)$deal['paid_amount'] + $amountToApprove;
        $newDueAmount = max(0, (float)$deal['expected_bdt_amount'] - $newPaidAmount);
        $isCompleted = $newDueAmount <= 0;

        // Update original event status to approved
        Database::getConnection()->prepare('UPDATE deal_timeline_events SET proof_status = ? WHERE id = ?')
            ->execute(['approved', $eventId]);

        $newStatus = $isCompleted ? 'completed' : 'partially_paid';
        $updateData = [
            'paid_amount' => $newPaidAmount,
            'due_amount' => $newDueAmount,
            'status' => $newStatus,
        ];
        if ($isCompleted) {
            $updateData['completed_at'] = $now;
        }

        $this->dealModel->update($dealId, $updateData);

        if ($isCompleted) {
            $this->dealModel->addTimelineEvent([
                'deal_id' => $dealId,
                'event_type' => 'deal_completed',
                'actor_role' => 'system',
                'actor_name' => 'System',
                'title' => 'Deal Fully Completed',
                'description' => "Outstanding balance reached ৳0. All obligations fulfilled. Deal {$deal['deal_number']} closed.",
                'amount_bdt' => $deal['expected_bdt_amount'],
            ]);
        }

        $this->activityModel->create([
            'deal_id' => $dealId,
            'deal_number' => $deal['deal_number'],
            'customer_id' => $deal['customer_id'],
            'customer_name' => $deal['customer_name'],
            'event_type' => $isCompleted ? 'deal_completed' : 'payment_approved',
            'title' => $isCompleted
                ? "Deal {$deal['deal_number']} Completed!"
                : "Payment Approved (৳" . number_format($amountToApprove) . ")",
            'description' => $isCompleted
                ? "Final payment of ৳" . number_format($amountToApprove) . " verified. Balance cleared for {$deal['customer_name']}."
                : "Approved ৳" . number_format($amountToApprove) . " for deal {$deal['deal_number']}. Remaining: ৳" . number_format($newDueAmount) . ".",
            'amount_bdt' => $amountToApprove,
            'badge_type' => 'success',
        ]);

        $updated = $this->dealModel->getById($dealId);
        $updated['timeline'] = $this->dealModel->getTimeline($dealId);
        jsonSuccess(mapDeal($updated), 'Payment approved');
    }

    public function declinePayment(int $dealId, int $eventId): void {
        $deal = $this->dealModel->getById($dealId);
        if (!$deal) jsonError('Deal not found', 404);

        $timeline = $this->dealModel->getTimeline($dealId);
        $targetEvent = null;
        foreach ($timeline as $evt) {
            if ((int)$evt['id'] === $eventId) {
                $targetEvent = $evt;
                break;
            }
        }
        if (!$targetEvent) jsonError('Payment event not found', 404);

        $data = getJsonInput();
        $reason = $data['reason'] ?? 'No reason provided';
        $amountDeclined = (float)$targetEvent['amount_bdt'];

        // Update original event status to rejected
        Database::getConnection()->prepare('UPDATE deal_timeline_events SET proof_status = ?, rejection_reason = ? WHERE id = ?')
            ->execute(['rejected', $reason, $eventId]);

        $hasPendingProof = false;
        foreach ($timeline as $evt) {
            if ((int)$evt['id'] !== $eventId && $evt['event_type'] === 'payment_proof_submitted' && $evt['proof_status'] === 'pending') {
                $hasPendingProof = true;
                break;
            }
        }
        $restoredStatus = $hasPendingProof
            ? 'fundify_verification_pending'
            : ((float)$deal['paid_amount'] > 0 ? 'partially_paid' : 'active_due');
        $this->dealModel->update($dealId, ['status' => $restoredStatus]);

        $this->dealModel->addTimelineEvent([
            'deal_id' => $dealId,
            'event_type' => 'payment_declined',
            'actor_role' => 'owner',
            'actor_name' => 'Ahmed Sourov',
            'title' => 'Payment Declined (৳' . number_format($amountDeclined) . ')',
            'description' => "Payment rejected by owner: \"$reason\". No deduction made.",
            'amount_bdt' => $amountDeclined,
            'rejection_reason' => $reason,
            'payment_event_id' => $targetEvent['payment_event_id'],
        ]);

        $this->activityModel->create([
            'deal_id' => $dealId,
            'deal_number' => $deal['deal_number'],
            'customer_id' => $deal['customer_id'],
            'customer_name' => $deal['customer_name'],
            'event_type' => 'payment_declined',
            'title' => "Payment Rejected ({$deal['deal_number']})",
            'description' => "Owner rejected ৳" . number_format($amountDeclined) . " proof: \"$reason\".",
            'amount_bdt' => $amountDeclined,
            'badge_type' => 'danger',
        ]);

        $updated = $this->dealModel->getById($dealId);
        $updated['timeline'] = $this->dealModel->getTimeline($dealId);
        jsonSuccess(mapDeal($updated), 'Payment declined');
    }

}
