<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../models/Activity.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../helpers/auth_helper.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/validator.php';

class CustomerController {
    private CustomerModel $model;
    private ActivityModel $activityModel;
    private UserModel $userModel;

    public function __construct() {
        $this->model = new CustomerModel();
        $this->activityModel = new ActivityModel();
        $this->userModel = new UserModel();
    }

    public function index(): void {
        $search = $_GET['search'] ?? null;
        $behavior = $_GET['behavior'] ?? null;
        $sort = $_GET['sort'] ?? 'name_asc';

        $customers = $this->model->getAllWithFinancialSummaries($search, $sort);

        $result = array_map(function ($c) {
            $currentDue = (float)$c['summary_current_due'];
            $totalDealsCount = (int)$c['summary_total_deals_count'];
            $oldestUnpaidDealDays = (int)$c['summary_oldest_unpaid_deal_days'];
            $paymentBehavior = 'New Customer';
            if ($totalDealsCount > 1 && $oldestUnpaidDealDays >= 7) {
                $paymentBehavior = 'Has Overdue Dues';
            } elseif ($totalDealsCount > 1 && $currentDue > 0) {
                $paymentBehavior = 'Moderate';
            } elseif ($totalDealsCount > 1 && $currentDue <= 0) {
                $paymentBehavior = 'Prompt & Reliable';
            }

            $summary = [
                'currentDue' => $currentDue,
                'lifetimeValue' => (float)$c['summary_lifetime_value'],
                'totalDollarsPurchased' => (float)$c['summary_total_dollars_purchased'],
                'totalAmountPaid' => (float)$c['summary_total_amount_paid'],
                'totalDealsCount' => $totalDealsCount,
                'activeDealsCount' => (int)$c['summary_active_deals_count'],
                'completedDealsCount' => (int)$c['summary_completed_deals_count'],
                'disputedDealsCount' => (int)$c['summary_disputed_deals_count'],
                'averageDealSizeUsd' => (float)$c['summary_average_deal_size_usd'],
                'largestDealUsd' => (float)$c['summary_largest_deal_usd'],
                'lastActivityDate' => $c['summary_last_activity_date'],
                'paymentBehavior' => $paymentBehavior,
                'oldestUnpaidDealDays' => $oldestUnpaidDealDays,
            ];
            return array_merge(mapCustomer($c), $summary);
        }, $customers);

        jsonSuccess($result);
    }

    public function show(int $id): void {
        $customer = $this->model->getById($id);
        if (!$customer) jsonError('Customer not found', 404);

        $summary = $this->model->getFinancialSummary($id);
        jsonSuccess(array_merge(mapCustomer($customer), $summary));
    }

    public function create(): void {
        $data = getJsonInput();
        requireFields($data, ['name', 'phone', 'password']);

        $id = $this->model->create([
            'name' => sanitizeString($data['name']),
            'phone' => sanitizeString($data['phone']),
            'email' => $data['email'] ?? null,
            'company_name' => $data['company_name'] ?? $data['companyName'] ?? null,
            'notes' => $data['notes'] ?? null,
            'preferred_channel' => $data['preferred_channel'] ?? $data['preferredChannel'] ?? 'WhatsApp',
            'avatar_color' => $data['avatar_color'] ?? 'bg-indigo-600',
        ]);
        $this->userModel->create([
            'role' => 'customer',
            'customer_id' => $id,
            'username' => sanitizeString($data['phone']),
            'password_hash' => hashPassword((string)$data['password']),
        ]);

        $customer = $this->model->getById($id);

        $this->activityModel->create([
            'customer_id' => $id,
            'customer_name' => $customer['name'],
            'event_type' => 'customer_added',
            'title' => 'New Customer Profile Added',
            'description' => "Created profile for {$customer['name']} ({$customer['phone']}).",
            'badge_type' => 'info',
        ]);

        jsonSuccess(mapCustomer($customer), 'Customer created');
    }

    public function update(int $id): void {
        $existing = $this->model->getById($id);
        if (!$existing) jsonError('Customer not found', 404);

        $data = getJsonInput();
        $updates = [];
        foreach (['name', 'phone', 'email', 'company_name', 'notes', 'preferred_channel', 'avatar_color'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }
        // Also accept camelCase from frontend
        if (array_key_exists('preferredChannel', $data)) {
            $updates['preferred_channel'] = $data['preferredChannel'];
        }
        if (array_key_exists('companyName', $data)) {
            $updates['company_name'] = $data['companyName'];
        }

        if (isset($data['password']) && trim((string)$data['password']) !== '') {
            $this->userModel->updatePasswordByCustomerId($id, (string)$data['password']);
        }

        if (!empty($updates)) {
            $this->model->update($id, $updates);
        }

        $customer = $this->model->getById($id);
        jsonSuccess(mapCustomer($customer), 'Customer updated');
    }

    public function summary(int $id): void {
        $customer = $this->model->getById($id);
        if (!$customer) jsonError('Customer not found', 404);

        $summary = $this->model->getFinancialSummary($id);
        jsonSuccess($summary);
    }
}
