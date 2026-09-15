<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';

class UploadController {
    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private const WEBP_QUALITY = 80;
    private const THUMB_MAX_WIDTH = 400;

    public function upload(): void {
        if (!isset($_FILES['proof'])) {
            jsonError('No file uploaded');
        }

        $file = $_FILES['proof'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            jsonError('Upload error: ' . $file['error']);
        }

        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, $allowedTypes)) {
            jsonError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
        }

        // Validate file size
        if ($file['size'] > self::MAX_FILE_SIZE) {
            jsonError('File too large. Maximum 5MB allowed.');
        }

        // Get deal_id from POST data (optional, for organizing into folders)
        $dealId = $_POST['dealId'] ?? null;

        // Create upload directory
        $baseDir = __DIR__ . '/../uploads/proofs';
        if ($dealId) {
            $uploadDir = $baseDir . '/' . preg_replace('/[^0-9]/', '', (string)$dealId);
        } else {
            $uploadDir = $baseDir;
        }

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $timestamp = time();
        $randomHex = bin2hex(random_bytes(8));
        $baseFilename = "proof_{$timestamp}_{$randomHex}";

        // Load source image
        $src = $this->loadImage($file['tmp_name'], $mimeType);
        if (!$src) {
            jsonError('Failed to process image', 500);
        }

        // Save as compressed webp
        $webpFilename = $baseFilename . '.webp';
        $webpPath = $uploadDir . '/' . $webpFilename;

        if (!imagewebp($src, $webpPath, self::WEBP_QUALITY)) {
            imagedestroy($src);
            jsonError('Failed to save image as WebP', 500);
        }

        // Generate thumbnail
        $thumbFilename = $baseFilename . '_thumb.webp';
        $thumbPath = $uploadDir . '/' . $thumbFilename;
        $this->createThumbnail($src, $thumbPath);

        imagedestroy($src);

        // Build URL path
        $urlPrefix = '/server/uploads/proofs';
        if ($dealId) {
            $urlPrefix .= '/' . preg_replace('/[^0-9]/', '', (string)$dealId);
        }

        $url = $urlPrefix . '/' . $webpFilename;
        $thumbUrl = $urlPrefix . '/' . $thumbFilename;

        jsonSuccess([
            'url' => $url,
            'thumbnailUrl' => $thumbUrl,
        ], 'File uploaded');
    }

    /**
     * Load an image file into a GD resource based on MIME type.
     */
    private function loadImage(string $path, string $mimeType): ?GdImage {
        return match($mimeType) {
            'image/jpeg' => imagecreatefromjpeg($path),
            'image/png' => $this->loadPng($path),
            'image/gif' => imagecreatefromgif($path),
            'image/webp' => imagecreatefromwebp($path),
            default => null,
        };
    }

    /**
     * Load PNG with alpha transparency preserved.
     */
    private function loadPng(string $path): ?GdImage {
        $src = imagecreatefrompng($path);
        if ($src) {
            imagealphablending($src, false);
            imagesavealpha($src, true);
        }
        return $src;
    }

    /**
     * Create a thumbnail from a source GD image.
     */
    private function createThumbnail(GdImage $src, string $destPath): void {
        $srcWidth = imagesx($src);
        $srcHeight = imagesy($src);

        if ($srcWidth <= self::THUMB_MAX_WIDTH) {
            // Source is already small enough, just save as webp
            imagewebp($src, $destPath, self::WEBP_QUALITY);
            return;
        }

        $thumbWidth = self::THUMB_MAX_WIDTH;
        $thumbHeight = (int)round($srcHeight * ($thumbWidth / $srcWidth));

        $thumb = imagecreatetruecolor($thumbWidth, $thumbHeight);
        imagealphablending($thumb, false);
        imagesavealpha($thumb, true);

        imagecopyresampled(
            $thumb, $src,
            0, 0, 0, 0,
            $thumbWidth, $thumbHeight,
            $srcWidth, $srcHeight
        );

        imagewebp($thumb, $destPath, self::WEBP_QUALITY);
        imagedestroy($thumb);
    }
}
