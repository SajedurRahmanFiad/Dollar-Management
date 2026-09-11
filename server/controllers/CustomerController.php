<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../models/Activity.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/validator.php';

class CustomerController {
    private CustomerModel $model;
    private ActivityModel $activityModel;

    public function __construct() {
        $this->model = new CustomerModel();
        $this->activityModel = new ActivityModel();
    }

    public function index(): void {
        $search = $_GET['search'] ?? null;
        $behavior = $_GET['behavior'] ?? null;
        $sort = $_GET['sort'] ?? 'name_asc';

        $customers = $this->model->getAll($search, $behavior, $sort);

        // Attach computed financial summary to each customer
        $result = array_map(function ($c) {
            $summary = $this->model->getFinancialSummary((int)$c['id']);
            return array_merge($c, [
                'currentDue' => $summary['currentDue'],
                'lifetimeValue' => $summary['lifetimeValue'],
                'totalDollarsPurchased' => $summary['totalDollarsPurchased'],
                'totalAmountPaid' => $summary['totalAmountPaid'],
                'totalDealsCount' => $summary['totalDealsCount'],
                'activeDealsCount' => $summary['activeDealsCount'],
                'completedDealsCount' => $summary['completedDealsCount'],
                'disputedDealsCount' => $summary['disputedDealsCount'],
                'averageDealSizeUsd' => $summary['averageDealSizeUsd'],
                'largestDealUsd' => $summary['largestDealUsd'],
                'lastActivityDate' => $summary['lastActivityDate'],
                'paymentBehavior' => $summary['paymentBehavior'],
                'oldestUnpaidDealDays' => $summary['oldestUnpaidDealDays'],
            ]);
        }, $customers);

        jsonSuccess($result);
    }

    public function show(int $id): void {
        $customer = $this->model->getById($id);
        if (!$customer) jsonError('Customer not found', 404);

        $summary = $this->model->getFinancialSummary($id);
        jsonSuccess(array_merge($customer, $summary));
    }

    public function create(): void {
        $data = getJsonInput();
        requireFields($data, ['name', 'phone']);

        $id = $this->model->create([
            'name' => sanitizeString($data['name']),
            'phone' => sanitizeString($data['phone']),
            'email' => $data['email'] ?? null,
            'location' => $data['location'] ?? null,
            'notes' => $data['notes'] ?? null,
            'preferred_channel' => $data['preferred_channel'] ?? $data['preferredChannel'] ?? 'WhatsApp',
            'avatar_color' => $data['avatar_color'] ?? 'bg-indigo-600',
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

        jsonSuccess($customer, 'Customer created');
    }

    public function update(int $id): void {
        $existing = $this->model->getById($id);
        if (!$existing) jsonError('Customer not found', 404);

        $data = getJsonInput();
        $updates = [];
        foreach (['name', 'phone', 'email', 'location', 'notes', 'preferred_channel', 'avatar_color'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }
        // Also accept camelCase from frontend
        if (array_key_exists('preferredChannel', $data)) {
            $updates['preferred_channel'] = $data['preferredChannel'];
        }

        if (!empty($updates)) {
            $this->model->update($id, $updates);
        }

        $customer = $this->model->getById($id);
        jsonSuccess($customer, 'Customer updated');
    }

    public function summary(int $id): void {
        $customer = $this->model->getById($id);
        if (!$customer) jsonError('Customer not found', 404);

        $summary = $this->model->getFinancialSummary($id);
        jsonSuccess($summary);
    }
}
