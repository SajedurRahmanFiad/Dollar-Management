<?php
declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth_helper.php';

require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/CustomerController.php';
require_once __DIR__ . '/controllers/DealController.php';
require_once __DIR__ . '/controllers/RequestController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/ActivityController.php';
require_once __DIR__ . '/controllers/UploadController.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Remove /server prefix if present (when served from PHP built-in server)
if (strpos($uri, '/server') === 0) {
    $uri = substr($uri, 7);
}

// Simple router
function route(string $method, string $pattern, callable $handler): void {
    global $uri;
    $regex = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $pattern);
    $regex = '#^' . $regex . '$#';

    if (preg_match($regex, $uri, $matches) && $_SERVER['REQUEST_METHOD'] === $method) {
        // Extract named parameters
        $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        call_user_func_array($handler, array_values($params));
        exit;
    }
}

// Catch-all for OPTIONS
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ========================
// AUTH ROUTES
// ========================
route('POST', '/api/auth/login', fn() => (new AuthController())->login());
route('GET', '/api/auth/me', fn() => (new AuthController())->me());

// ========================
// CUSTOMER ROUTES
// ========================
route('GET', '/api/customers/{id}/summary', fn($id) => (new CustomerController())->summary((int)$id));
route('GET', '/api/customers/{id}', fn($id) => (new CustomerController())->show((int)$id));
route('PUT', '/api/customers/{id}', fn($id) => (new CustomerController())->update((int)$id));
route('GET', '/api/customers', fn() => (new CustomerController())->index());
route('POST', '/api/customers', fn() => (new CustomerController())->create());

// ========================
// DEAL ROUTES
// ========================
route('POST', '/api/deals/{id}/upload-proof', fn($id) => (new DealController())->uploadProof((int)$id));
route('PUT', '/api/deals/{id}/upload-proof', fn($id) => (new DealController())->uploadProof((int)$id));
route('POST', '/api/deals/{id}/confirm-receipt', fn($id) => (new DealController())->confirmReceipt((int)$id));
route('PUT', '/api/deals/{id}/confirm-receipt', fn($id) => (new DealController())->confirmReceipt((int)$id));
route('POST', '/api/deals/{id}/dispute', fn($id) => (new DealController())->dispute((int)$id));
route('PUT', '/api/deals/{id}/dispute', fn($id) => (new DealController())->dispute((int)$id));
route('POST', '/api/deals/{id}/cancel', fn($id) => (new DealController())->cancel((int)$id));
route('PUT', '/api/deals/{id}/cancel', fn($id) => (new DealController())->cancel((int)$id));
route('POST', '/api/deals/{id}/payments', fn($id) => (new DealController())->submitPayment((int)$id));
route('PUT', '/api/deals/{id}/payments/{eventId}/approve', fn($id, $eventId) => (new DealController())->approvePayment((int)$id, (int)$eventId));
route('PUT', '/api/deals/{id}/payments/{eventId}/decline', fn($id, $eventId) => (new DealController())->declinePayment((int)$id, (int)$eventId));
route('GET', '/api/deals/{id}', fn($id) => (new DealController())->show((int)$id));
route('GET', '/api/deals', fn() => (new DealController())->index());
route('POST', '/api/deals', fn() => (new DealController())->create());

// ========================
// REQUEST ROUTES
// ========================
route('PUT', '/api/requests/{id}/convert', fn($id) => (new RequestController())->convert((int)$id));
route('PUT', '/api/requests/{id}/reject', fn($id) => (new RequestController())->reject((int)$id));
route('PUT', '/api/requests/{id}/archive', fn($id) => (new RequestController())->archive((int)$id));
route('GET', '/api/requests/{id}', fn($id) => jsonError('Not implemented', 501));
route('GET', '/api/requests', fn() => (new RequestController())->index());
route('POST', '/api/requests', fn() => (new RequestController())->create());

// ========================
// DASHBOARD ROUTES
// ========================
route('GET', '/api/dashboard/stats', fn() => (new DashboardController())->stats());
route('GET', '/api/dashboard/pending', fn() => (new DashboardController())->pending());

// ========================
// ACTIVITY ROUTES
// ========================
route('GET', '/api/activities', fn() => (new ActivityController())->index());

// ========================
// UPLOAD ROUTES
// ========================
route('POST', '/api/upload/proof', fn() => (new UploadController())->upload());

// ========================
// SERVE STATIC PROOF FILES
// ========================
if (preg_match('#^/server/uploads/proofs/(.+)$#', $uri, $m)) {
    $file = __DIR__ . '/uploads/proofs/' . $m[1];
    if (file_exists($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $mime = match($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            default => 'application/octet-stream',
        };
        header("Content-Type: $mime");
        header('Cache-Control: public, max-age=86400');
        readfile($file);
        exit;
    }
    http_response_code(404);
    exit;
}

// 404
jsonError('Route not found', 404);
