<?php
declare(strict_types=1);

function mapDeal(array $row): array {
    return [
        'id' => (string)$row['id'],
        'dealNumber' => $row['deal_number'],
        'customerId' => (string)$row['customer_id'],
        'customerName' => $row['customer_name'] ?? $row['name'] ?? '',
        'customerPhone' => $row['customer_phone'] ?? $row['phone'] ?? '',
        'dollarAmount' => (float)$row['dollar_amount'],
        'exchangeRate' => (float)$row['exchange_rate'],
        'expectedBdtAmount' => (float)$row['expected_bdt_amount'],
        'paidAmount' => (float)$row['paid_amount'],
        'dueAmount' => (float)$row['due_amount'],
        'status' => $row['status'],
        'createdAt' => $row['created_at'],
        'confirmedAt' => $row['confirmed_at'] ?? null,
        'completedAt' => $row['completed_at'] ?? null,
        'linkedRequestId' => $row['linked_request_id'] ? (string)$row['linked_request_id'] : null,
        'notes' => $row['notes'] ?? null,
        'dollarProofUrl' => $row['dollar_proof_url'] ?? null,
        'dollarProofUploadedAt' => $row['dollar_proof_uploaded_at'] ?? null,
        'timeline' => isset($row['timeline']) ? array_map('mapTimelineEvent', $row['timeline']) : [],
    ];
}

function mapTimelineEvent(array $row): array {
    return [
        'id' => (string)$row['id'],
        'timestamp' => $row['created_at'],
        'type' => $row['event_type'],
        'actor' => $row['actor_role'],
        'actorName' => $row['actor_name'],
        'title' => $row['title'],
        'description' => $row['description'] ?? null,
        'amountUsd' => $row['amount_usd'] !== null ? (float)$row['amount_usd'] : null,
        'amountBdt' => $row['amount_bdt'] !== null ? (float)$row['amount_bdt'] : null,
        'exchangeRate' => $row['exchange_rate'] !== null ? (float)$row['exchange_rate'] : null,
        'proofImageUrl' => $row['proof_image_url'] ?? null,
        'proofType' => $row['proof_type'] ?? null,
        'proofStatus' => $row['proof_status'] ?? null,
        'paymentEventId' => $row['payment_event_id'] ?? null,
        'rejectionReason' => $row['rejection_reason'] ?? null,
    ];
}

function mapCustomer(array $row): array {
    return [
        'id' => (string)$row['id'],
        'name' => $row['name'],
        'phone' => $row['phone'],
        'email' => $row['email'] ?? null,
        'companyName' => $row['company_name'] ?? null,
        'notes' => $row['notes'] ?? null,
        'createdAt' => $row['created_at'],
        'avatarColor' => $row['avatar_color'] ?? 'bg-indigo-600',
        'preferredChannel' => $row['preferred_channel'] ?? 'WhatsApp',
    ];
}

function mapRequest(array $row): array {
    return [
        'id' => (string)$row['id'],
        'requestNumber' => $row['request_number'],
        'customerId' => (string)$row['customer_id'],
        'customerName' => $row['customer_name'] ?? $row['name'] ?? '',
        'customerPhone' => $row['customer_phone'] ?? $row['phone'] ?? '',
        'requestedUsdAmount' => (float)$row['requested_usd_amount'],
        'targetRate' => $row['target_rate'] !== null ? (float)$row['target_rate'] : null,
        'notes' => $row['notes'] ?? null,
        'status' => $row['status'],
        'createdAt' => $row['created_at'],
        'convertedDealId' => $row['converted_deal_id'] ? (string)$row['converted_deal_id'] : null,
        'preferredChannel' => $row['preferred_channel'] ?? null,
    ];
}

function mapActivity(array $row): array {
    return [
        'id' => (string)$row['id'],
        'timestamp' => $row['created_at'],
        'dealId' => $row['deal_id'] ? (string)$row['deal_id'] : null,
        'dealNumber' => $row['deal_number'] ?? null,
        'customerId' => $row['customer_id'] ? (string)$row['customer_id'] : null,
        'customerName' => $row['customer_name'],
        'type' => $row['event_type'],
        'title' => $row['title'],
        'description' => $row['description'] ?? '',
        'amountUsd' => $row['amount_usd'] !== null ? (float)$row['amount_usd'] : null,
        'amountBdt' => $row['amount_bdt'] !== null ? (float)$row['amount_bdt'] : null,
        'badgeType' => $row['badge_type'],
    ];
}
