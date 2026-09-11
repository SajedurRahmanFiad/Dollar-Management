<?php
declare(strict_types=1);

define('JWT_SECRET', 'dems_jwt_secret_key_2026_change_in_production');

function generateToken(int $userId, string $role, ?int $customerId = null): string {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'role' => $role,
        'customer_id' => $customerId,
        'iat' => time(),
        'exp' => time() + 86400 * 7, // 7 days
    ]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$signature";
}

function verifyToken(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $signature] = $parts;
    $expectedSig = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));

    if (!hash_equals($expectedSig, $signature)) return null;

    $data = json_decode(base64_decode($payload), true);
    if (!$data || !isset($data['exp']) || $data['exp'] < time()) return null;

    return $data;
}

function getAuthUser(): array {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
        jsonError('Authorization token required', 401);
    }

    $user = verifyToken($matches[1]);
    if (!$user) {
        jsonError('Invalid or expired token', 401);
    }

    return $user;
}

function requireOwner(): array {
    $user = getAuthUser();
    if ($user['role'] !== 'owner') {
        jsonError('Owner access required', 403);
    }
    return $user;
}

function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT);
}

function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}
