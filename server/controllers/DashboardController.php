<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

class DashboardController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function stats(): void {
        // Total outstanding due
        $stmt = $this->db->query("SELECT COALESCE(SUM(due_amount), 0) as total FROM deals WHERE status IN ('active_due', 'partially_paid')");
        $totalOutstandingDue = (float)$stmt->fetch()['total'];

        // Total USD volume (active + completed)
        $stmt = $this->db->query("SELECT COALESCE(SUM(dollar_amount), 0) as total FROM deals WHERE status NOT IN ('draft', 'cancelled')");
        $totalUsdVolume = (float)$stmt->fetch()['total'];

        // Total BDT settled (completed deals)
        $stmt = $this->db->query("SELECT COALESCE(SUM(paid_amount), 0) as total FROM deals WHERE status = 'completed'");
        $totalBdtSettled = (float)$stmt->fetch()['total'];

        // Pending actions count
        $stmt = $this->db->query("SELECT COUNT(*) as cnt FROM deal_timeline_events WHERE proof_status = 'pending'");
        $pendingPayments = (int)$stmt->fetch()['cnt'];

        $stmt = $this->db->query("SELECT COUNT(*) as cnt FROM requests WHERE status = 'pending'");
        $pendingRequests = (int)$stmt->fetch()['cnt'];

        $pendingActions = $pendingPayments + $pendingRequests;

        jsonSuccess([
            'totalOutstandingDue' => $totalOutstandingDue,
            'totalUsdVolume' => $totalUsdVolume,
            'totalBdtSettled' => $totalBdtSettled,
            'pendingActions' => $pendingActions,
        ]);
    }

    public function pending(): void {
        // Payment proofs awaiting verification
        $stmt = $this->db->prepare(
            "SELECT d.*, c.name as customer_name, c.phone as customer_phone
             FROM deal_timeline_events e
             JOIN deals d ON e.deal_id = d.id
             LEFT JOIN customers c ON d.customer_id = c.id
             WHERE e.event_type = 'payment_proof_submitted' AND e.proof_status = 'pending'
             GROUP BY d.id
             ORDER BY e.created_at DESC"
        );
        $stmt->execute();
        $pendingPayments = $stmt->fetchAll();

        foreach ($pendingPayments as &$deal) {
            $deal['timeline'] = $this->getTimeline((int)$deal['id']);
            $deal['customerName'] = $deal['customer_name'];
            $deal['customerPhone'] = $deal['customer_phone'];
        }

        // Pending requests
        $stmt = $this->db->prepare(
            "SELECT r.*, c.name as customer_name, c.phone as customer_phone
             FROM requests r
             LEFT JOIN customers c ON r.customer_id = c.id
             WHERE r.status = 'pending'
             ORDER BY r.created_at DESC"
        );
        $stmt->execute();
        $pendingRequests = $stmt->fetchAll();

        foreach ($pendingRequests as &$req) {
            $req['customerName'] = $req['customer_name'];
            $req['customerPhone'] = $req['customer_phone'];
            $req['requestedUsdAmount'] = (float)$req['requested_usd_amount'];
            $req['targetRate'] = $req['target_rate'] !== null ? (float)$req['target_rate'] : null;
        }

        jsonSuccess([
            'pendingPayments' => $pendingPayments,
            'pendingRequests' => $pendingRequests,
        ]);
    }

    private function getTimeline(int $dealId): array {
        $stmt = $this->db->prepare(
            'SELECT * FROM deal_timeline_events WHERE deal_id = ? ORDER BY created_at ASC'
        );
        $stmt->execute([$dealId]);
        $events = $stmt->fetchAll();

        return array_map(function ($e) {
            return [
                'id' => (string)$e['id'],
                'timestamp' => $e['created_at'],
                'type' => $e['event_type'],
                'actor' => $e['actor_role'],
                'actorName' => $e['actor_name'],
                'title' => $e['title'],
                'description' => $e['description'],
                'amountUsd' => $e['amount_usd'] !== null ? (float)$e['amount_usd'] : null,
                'amountBdt' => $e['amount_bdt'] !== null ? (float)$e['amount_bdt'] : null,
                'exchangeRate' => $e['exchange_rate'] !== null ? (float)$e['exchange_rate'] : null,
                'proofImageUrl' => $e['proof_image_url'],
                'proofType' => $e['proof_type'],
                'proofStatus' => $e['proof_status'],
                'paymentEventId' => $e['payment_event_id'],
                'rejectionReason' => $e['rejection_reason'],
            ];
        }, $events);
    }
}
