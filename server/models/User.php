<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

class UserModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findByUsername(string $username): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        return $stmt->fetch() ?: null;
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO users (role, customer_id, username, password_hash) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['role'],
            $data['customer_id'] ?? null,
            $data['username'],
            $data['password_hash'],
        ]);
        return (int)$this->db->lastInsertId();
    }
}
