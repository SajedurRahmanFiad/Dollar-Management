<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

class ActivityModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(int $limit = 20, int $offset = 0): array {
        $stmt = $this->db->prepare(
            'SELECT * FROM activities ORDER BY created_at DESC LIMIT ? OFFSET ?'
        );
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO activities (deal_id, deal_number, customer_id, customer_name, event_type, title, description, amount_usd, amount_bdt, badge_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['deal_id'] ?? null,
            $data['deal_number'] ?? null,
            $data['customer_id'] ?? null,
            $data['customer_name'],
            $data['event_type'],
            $data['title'],
            $data['description'] ?? null,
            $data['amount_usd'] ?? null,
            $data['amount_bdt'] ?? null,
            $data['badge_type'],
        ]);
        return (int)$this->db->lastInsertId();
    }
}
