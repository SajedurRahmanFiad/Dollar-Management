<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

class DealModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(?string $status = null, ?int $customerId = null, ?string $search = null, string $sort = 'newest', int $page = 1, int $limit = 50): array {
        $sql = 'SELECT d.*, c.name as customer_name, c.phone as customer_phone
                FROM deals d
                LEFT JOIN customers c ON d.customer_id = c.id';
        $conditions = [];
        $params = [];

        if ($status) {
            $conditions[] = 'd.status = ?';
            $params[] = $status;
        }
        if ($customerId) {
            $conditions[] = 'd.customer_id = ?';
            $params[] = $customerId;
        }
        if ($search) {
            $conditions[] = '(d.deal_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($conditions) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $orderBy = match($sort) {
            'usd_high' => 'd.dollar_amount DESC',
            'due_high' => 'd.due_amount DESC',
            'oldest' => 'd.created_at ASC',
            default => 'd.created_at DESC',
        };
        $sql .= " ORDER BY $orderBy";
        $sql .= ' LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = ($page - 1) * $limit;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare(
            'SELECT d.*, c.name as customer_name, c.phone as customer_phone
             FROM deals d
             LEFT JOIN customers c ON d.customer_id = c.id
             WHERE d.id = ?'
        );
        $stmt->execute([$id]);
        $deal = $stmt->fetch();
        if (!$deal) return null;

        $deal['timeline'] = $this->getTimeline($id);
        return $deal;
    }

    public function getTimeline(int $dealId): array {
        $stmt = $this->db->prepare(
            'SELECT * FROM deal_timeline_events WHERE deal_id = ? ORDER BY created_at ASC'
        );
        $stmt->execute([$dealId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO deals (deal_number, customer_id, dollar_amount, exchange_rate,
             expected_bdt_amount, paid_amount, due_amount, status, notes, linked_request_id)
             VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)'
        );
        $stmt->execute([
            $data['deal_number'],
            $data['customer_id'],
            $data['dollar_amount'],
            $data['exchange_rate'],
            $data['expected_bdt_amount'],
            $data['status'] ?? 'draft',
            $data['notes'] ?? null,
            $data['linked_request_id'] ?? null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];

        foreach ($data as $field => $value) {
            $fields[] = "$field = ?";
            $params[] = $value;
        }

        if (empty($fields)) return false;

        $params[] = $id;
        $sql = 'UPDATE deals SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function addTimelineEvent(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO deal_timeline_events
             (deal_id, event_type, actor_role, actor_name, title, description,
              amount_usd, amount_bdt, exchange_rate, proof_image_url, proof_type,
              proof_status, payment_event_id, rejection_reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['deal_id'],
            $data['event_type'],
            $data['actor_role'],
            $data['actor_name'],
            $data['title'],
            $data['description'] ?? null,
            $data['amount_usd'] ?? null,
            $data['amount_bdt'] ?? null,
            $data['exchange_rate'] ?? null,
            $data['proof_image_url'] ?? null,
            $data['proof_type'] ?? null,
            $data['proof_status'] ?? null,
            $data['payment_event_id'] ?? null,
            $data['rejection_reason'] ?? null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function getNextDealNumber(): string {
        $stmt = $this->db->query('SELECT MAX(id) as max_id FROM deals');
        $row = $stmt->fetch();
        $next = ($row['max_id'] ?? 2400) + 1;
        return "DL-$next";
    }
}
