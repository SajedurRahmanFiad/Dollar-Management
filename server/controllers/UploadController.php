<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';

class UploadController {
    public function upload(): void {
        if (!isset($_FILES['proof'])) {
            jsonError('No file uploaded');
        }

        $file = $_FILES['proof'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            jsonError('Upload error: ' . $file['error']);
        }

        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, $allowedTypes)) {
            jsonError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG');
        }

        // Validate file size (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            jsonError('File too large. Maximum 5MB allowed.');
        }

        $uploadDir = __DIR__ . '/../uploads/proofs';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $filename = 'proof_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $filepath = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            jsonError('Failed to save file', 500);
        }

        $url = '/server/uploads/proofs/' . $filename;
        jsonSuccess(['url' => $url], 'File uploaded');
    }
}
