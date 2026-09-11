<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

class RequestModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(?string $status = null, ?int $customerId = null, ?string $search = null): array {
        $sql = 'SELECT r.*, c.name as customer_name, c.phone as customer_phone
                FROM requests r
                LEFT JOIN customers c ON r.customer_id = c.id';
        $conditions = [];
        $params = [];

        if ($status) {
            $conditions[] = 'r.status = ?';
            $params[] = $status;
        }
        if ($customerId) {
            $conditions[] = 'r.customer_id = ?';
            $params[] = $customerId;
        }
        if ($search) {
            $conditions[] = '(r.request_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($conditions) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= ' ORDER BY r.created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM requests WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO requests (request_number, customer_id, requested_usd_amount, target_rate, notes, status, preferred_channel)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['request_number'],
            $data['customer_id'],
            $data['requested_usd_amount'],
            $data['target_rate'] ?? null,
            $data['notes'] ?? null,
            $data['status'] ?? 'pending',
            $data['preferred_channel'] ?? 'WhatsApp',
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
        $sql = 'UPDATE requests SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    public function getNextRequestNumber(): string {
        $stmt = $this->db->query('SELECT MAX(id) as max_id FROM requests');
        $row = $stmt->fetch();
        $next = ($row['max_id'] ?? 107) + 1;
        return "REQ-$next";
    }
}
