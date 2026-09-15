UPDATE deals d
SET d.status = 'fundify_verification_pending'
WHERE d.status IN ('active_due', 'partially_paid')
  AND EXISTS (
    SELECT 1
    FROM deal_timeline_events e
    WHERE e.deal_id = d.id
      AND e.event_type = 'payment_proof_submitted'
      AND e.proof_status = 'pending'
  );