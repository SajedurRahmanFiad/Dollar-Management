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
        setcookie('dems_token', $token, [
            'expires' => time() + 86400 * 7,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        jsonSuccess([
            'token' => $token,
            'user' => $this->profileResponse((int)$user['id']),
        ], 'Login successful');
    }

    public function logout(): void {
        setcookie('dems_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        jsonSuccess(null, 'Logged out');
    }

    public function updatePassword(): void {
        $authUser = getAuthUser();
        $data = getJsonInput();
        requireFields($data, ['password']);
        if (strlen((string)$data['password']) < 6) {
            jsonError('Password must be at least 6 characters', 422);
        }

        $this->userModel->updatePasswordById((int)$authUser['user_id'], (string)$data['password']);
        jsonSuccess(null, 'Password updated');
    }

    public function updateProfile(): void {
        $authUser = getAuthUser();
        $data = getJsonInput();
        requireFields($data, ['name', 'phone']);

        $name = sanitizeString((string)$data['name']);
        $phone = sanitizeString((string)$data['phone']);
        if ($name === '' || $phone === '') {
            jsonError('Name and phone number are required', 422);
        }
        if ($this->userModel->findByUsernameExceptId($phone, (int)$authUser['user_id'])) {
            jsonError('That phone number is already in use', 409);
        }

        $profile = [
            'name' => $name,
            'phone' => $phone,
            'company_name' => $data['companyName'] ?? $data['company_name'] ?? null,
        ];

        $user = $this->userModel->getById((int)$authUser['user_id']);
        if (!$user) jsonError('User not found', 404);

        if ($user['customer_id']) {
            $this->customerModel->update((int)$user['customer_id'], $profile);
            $this->userModel->updateUsernameById((int)$user['id'], $phone);
        } else {
            $this->userModel->updateProfileById((int)$user['id'], [
                'display_name' => $name,
                'phone' => $phone,
                'company_name' => $profile['company_name'],
            ]);
        }

        jsonSuccess($this->profileResponse((int)$user['id']), 'Profile updated');
    }

    public function me(): void {
        $authUser = getAuthUser();
        jsonSuccess($this->profileResponse((int)$authUser['user_id']));
    }

    private function profileResponse(int $userId): array {
        $user = $this->userModel->getById($userId);
        if (!$user) jsonError('User not found', 404);

        $customer = $user['customer_id']
            ? $this->customerModel->getById((int)$user['customer_id'])
            : null;
        $phone = $customer['phone'] ?? ($user['phone'] ?? $user['username']);

        return [
            'id' => (int)$user['id'],
            'role' => $user['role'],
            'username' => $phone,
            'phone' => $phone,
            'customerId' => $user['customer_id'] ? (int)$user['customer_id'] : null,
            'name' => $customer['name'] ?? ($user['display_name'] ?? 'Admin'),
            'companyName' => $customer['company_name'] ?? ($user['company_name'] ?? null),
        ];
    }
}
