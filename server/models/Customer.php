<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

class CustomerModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(?string $search = null, ?string $behavior = null, string $sort = 'name_asc'): array {
        $sql = 'SELECT * FROM customers';
        $conditions = [];
        $params = [];

        if ($search) {
            $conditions[] = '(name LIKE ? OR phone LIKE ? OR company_name LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($conditions) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getAllWithFinancialSummaries(?string $search = null, string $sort = 'name_asc'): array {
        $sql = 'SELECT c.*,
                    COALESCE(s.current_due, 0) AS summary_current_due,
                    COALESCE(s.lifetime_value, 0) AS summary_lifetime_value,
                    COALESCE(s.total_dollars_purchased, 0) AS summary_total_dollars_purchased,
                    COALESCE(s.total_amount_paid, 0) AS summary_total_amount_paid,
                    COALESCE(s.total_deals_count, 0) AS summary_total_deals_count,
                    COALESCE(s.active_deals_count, 0) AS summary_active_deals_count,
                    COALESCE(s.completed_deals_count, 0) AS summary_completed_deals_count,
                    COALESCE(s.disputed_deals_count, 0) AS summary_disputed_deals_count,
                    COALESCE(s.average_deal_size_usd, 0) AS summary_average_deal_size_usd,
                    COALESCE(s.largest_deal_usd, 0) AS summary_largest_deal_usd,
                    s.last_activity_date AS summary_last_activity_date,
                    COALESCE(s.oldest_unpaid_deal_days, 0) AS summary_oldest_unpaid_deal_days
                FROM customers c
                LEFT JOIN (
                    SELECT customer_id,
                        SUM(due_amount) AS current_due,
                        SUM(CASE WHEN status IN (\'active_due\', \'partially_paid\', \'fundify_verification_pending\', \'awaiting_confirmation\', \'completed\') THEN expected_bdt_amount ELSE 0 END) AS lifetime_value,
                        SUM(dollar_amount) AS total_dollars_purchased,
                        SUM(paid_amount) AS total_amount_paid,
                        COUNT(*) AS total_deals_count,
                        SUM(status IN (\'active_due\', \'partially_paid\', \'fundify_verification_pending\', \'awaiting_confirmation\')) AS active_deals_count,
                        SUM(status = \'completed\') AS completed_deals_count,
                        SUM(status = \'disputed\') AS disputed_deals_count,
                        AVG(dollar_amount) AS average_deal_size_usd,
                        MAX(dollar_amount) AS largest_deal_usd,
                        MAX(COALESCE(completed_at, created_at)) AS last_activity_date,
                        MAX(CASE WHEN status IN (\'active_due\', \'partially_paid\', \'fundify_verification_pending\') AND due_amount > 0
                            THEN DATEDIFF(CURRENT_TIMESTAMP, COALESCE(confirmed_at, created_at)) ELSE 0 END) AS oldest_unpaid_deal_days
                    FROM deals
                    GROUP BY customer_id
                ) s ON s.customer_id = c.id';
        $conditions = [];
        $params = [];

        if ($search) {
            $conditions[] = '(c.name LIKE ? OR c.phone LIKE ? OR c.company_name LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($conditions) $sql .= ' WHERE ' . implode(' AND ', $conditions);
        $sql .= ' ORDER BY ' . ($sort === 'name_asc' ? 'c.name ASC' : 'c.created_at DESC');

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM customers WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO customers (name, phone, email, company_name, notes, preferred_channel, avatar_color)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['name'],
            $data['phone'],
            $data['email'] ?? null,
            $data['company_name'] ?? null,
            $data['notes'] ?? null,
            $data['preferred_channel'] ?? 'WhatsApp',
            $data['avatar_color'] ?? 'bg-indigo-600',
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];

        foreach (['name', 'phone', 'email', 'company_name', 'notes', 'preferred_channel', 'avatar_color'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $params[] = $id;
        $sql = 'UPDATE customers SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function findByPhone(string $phone): ?array {
        $stmt = $this->db->prepare('SELECT * FROM customers WHERE phone = ?');
        $stmt->execute([$phone]);
        return $stmt->fetch() ?: null;
    }

    public function getFinancialSummary(int $customerId): array {
        $stmt = $this->db->prepare('SELECT * FROM deals WHERE customer_id = ?');
        $stmt->execute([$customerId]);
        $deals = $stmt->fetchAll();

        $summary = [
            'currentDue' => 0,
            'lifetimeValue' => 0,
            'totalDollarsPurchased' => 0,
            'totalAmountPaid' => 0,
            'totalDealsCount' => count($deals),
            'activeDealsCount' => 0,
            'completedDealsCount' => 0,
            'disputedDealsCount' => 0,
            'averageDealSizeUsd' => 0,
            'largestDealUsd' => 0,
            'lastActivityDate' => null,
            'paymentBehavior' => 'New Customer',
            'oldestUnpaidDealDays' => 0,
        ];

        if (empty($deals)) return $summary;

        $totalUsd = 0;
        $oldestUnpaidDays = 0;

        foreach ($deals as $deal) {
            $status = $deal['status'];
            $due = (float)$deal['due_amount'];
            $paid = (float)$deal['paid_amount'];
            $expected = (float)$deal['expected_bdt_amount'];
            $usd = (float)$deal['dollar_amount'];

            $summary['currentDue'] += $due;
            $summary['totalAmountPaid'] += $paid;
            $summary['totalDollarsPurchased'] += $usd;
            $totalUsd += $usd;

            if (in_array($status, ['active_due', 'partially_paid', 'fundify_verification_pending', 'awaiting_confirmation'])) {
                $summary['activeDealsCount']++;
                $summary['lifetimeValue'] += $expected;
            }
            if ($status === 'completed') {
                $summary['completedDealsCount']++;
                $summary['lifetimeValue'] += $expected;
            }
            if ($status === 'disputed') {
                $summary['disputedDealsCount']++;
            }

            if ($usd > $summary['largestDealUsd']) {
                $summary['largestDealUsd'] = $usd;
            }

            // Calculate oldest unpaid deal days
            if (in_array($status, ['active_due', 'partially_paid', 'fundify_verification_pending']) && $due > 0) {
                $created = strtotime($deal['confirmed_at'] ?: $deal['created_at']);
                $days = (int)((time() - $created) / 86400);
                if ($days > $oldestUnpaidDays) {
                    $oldestUnpaidDays = $days;
                }
            }

            // Last activity
            $dealDate = $deal['completed_at'] ?: $deal['created_at'];
            if (!$summary['lastActivityDate'] || $dealDate > $summary['lastActivityDate']) {
                $summary['lastActivityDate'] = $dealDate;
            }
        }

        $summary['averageDealSizeUsd'] = $totalUsd / count($deals);
        $summary['oldestUnpaidDealDays'] = $oldestUnpaidDays;

        // Payment behavior
        if ($summary['totalDealsCount'] <= 1) {
            $summary['paymentBehavior'] = 'New Customer';
        } elseif ($oldestUnpaidDays >= 7) {
            $summary['paymentBehavior'] = 'Has Overdue Dues';
        } elseif ($summary['currentDue'] > 0) {
            $summary['paymentBehavior'] = 'Moderate';
        } else {
            $summary['paymentBehavior'] = 'Prompt & Reliable';
        }

        return $summary;
    }
}
