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
            $conditions[] = '(name LIKE ? OR phone LIKE ? OR location LIKE ?)';
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

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM customers WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO customers (name, phone, email, location, notes, preferred_channel, avatar_color)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['name'],
            $data['phone'],
            $data['email'] ?? null,
            $data['location'] ?? null,
            $data['notes'] ?? null,
            $data['preferred_channel'] ?? 'WhatsApp',
            $data['avatar_color'] ?? 'bg-indigo-600',
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];

        foreach (['name', 'phone', 'email', 'location', 'notes', 'preferred_channel', 'avatar_color'] as $field) {
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

            if (in_array($status, ['active_due', 'partially_paid', 'awaiting_confirmation'])) {
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
            if (in_array($status, ['active_due', 'partially_paid']) && $due > 0) {
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
