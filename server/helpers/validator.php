<?php
declare(strict_types=1);

function requireFields(array $data, array $fields): void {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
            jsonError("Missing required field: $field");
        }
        if (is_string($data[$field])) {
            $data[$field] = trim($data[$field]);
        }
    }
}

function validatePhone(string $phone): bool {
    return preg_match('/^[\d\+\-\s\(\)]{7,20}$/', $phone) === 1;
}

function sanitizeString(?string $value): ?string {
    if ($value === null) return null;
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}
