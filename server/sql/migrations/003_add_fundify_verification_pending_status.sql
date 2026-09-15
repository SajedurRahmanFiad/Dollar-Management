ALTER TABLE deals
  MODIFY status ENUM(
    'draft',
    'dollar_sent_pending',
    'awaiting_confirmation',
    'fundify_verification_pending',
    'active_due',
    'partially_paid',
    'completed',
    'disputed',
    'cancelled'
  ) NOT NULL DEFAULT 'draft';