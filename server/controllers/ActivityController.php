<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Activity.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/mappers.php';

class ActivityController {
    private ActivityModel $model;

    public function __construct() {
        $this->model = new ActivityModel();
    }

    public function index(): void {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $activities = $this->model->getAll($limit, $offset);
        jsonSuccess(array_map('mapActivity', $activities));
    }
}
