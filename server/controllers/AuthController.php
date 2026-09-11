<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../helpers/auth_helper.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/validator.php';

class AuthController {
    private UserModel $userModel;
    private CustomerModel $customerModel;

    public function __construct() {
        $this->userModel = new UserModel();
        $this->customerModel = new CustomerModel();
    }

    public function login(): void {
        $data = getJsonInput();
        requireFields($data, ['username', 'password']);

        $user = $this->userModel->findByUsername($data['username']);
        if (!$user || !verifyPassword($data['password'], $user['password_hash'])) {
            jsonError('Invalid username or password', 401);
        }

        $token = generateToken((int)$user['id'], $user['role'], $user['customer_id'] ? (int)$user['customer_id'] : null);

        $customer = null;
        if ($user['customer_id']) {
            $customer = $this->customerModel->getById((int)$user['customer_id']);
        }

        jsonSuccess([
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                'role' => $user['role'],
                'username' => $user['username'],
                'customerId' => $user['customer_id'] ? (int)$user['customer_id'] : null,
                'name' => $customer ? $customer['name'] : 'Admin',
            ],
        ], 'Login successful');
    }

    public function me(): void {
        $authUser = getAuthUser();

        $user = $this->userModel->getById($authUser['user_id']);
        if (!$user) {
            jsonError('User not found', 404);
        }

        $customer = null;
        if ($user['customer_id']) {
            $customer = $this->customerModel->getById((int)$user['customer_id']);
        }

        jsonSuccess([
            'id' => (int)$user['id'],
            'role' => $user['role'],
            'username' => $user['username'],
            'customerId' => $user['customer_id'] ? (int)$user['customer_id'] : null,
            'name' => $customer ? $customer['name'] : 'Admin',
        ]);
    }
}
