<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/auth_helper.php';

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

    public function findByUsernameExceptId(string $username, int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = ? AND id <> ?');
        $stmt->execute([$username, $id]);
        return $stmt->fetch() ?: null;
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function updatePasswordByCustomerId(int $customerId, string $passwordHash): void {
        $stmt = $this->db->prepare('UPDATE users SET password_hash = ? WHERE customer_id = ?');
        $stmt->execute([hashPassword($passwordHash), $customerId]);
    }

    public function updatePasswordById(int $id, string $password): void {
        $stmt = $this->db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([hashPassword($password), $id]);
    }

    public function updateUsernameById(int $id, string $username): void {
        $stmt = $this->db->prepare('UPDATE users SET username = ?, phone = ? WHERE id = ?');
        $stmt->execute([$username, $username, $id]);
    }

    public function updateProfileById(int $id, array $data): void {
        $fields = [];
        $params = [];
        foreach (['display_name', 'phone', 'company_name'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        if (array_key_exists('phone', $data)) {
            $fields[] = 'username = ?';
            $params[] = $data['phone'];
        }
        if (empty($fields)) return;
        $params[] = $id;
        $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);
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
