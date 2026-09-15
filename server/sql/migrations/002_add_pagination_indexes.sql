USE dollar_exchange;

CREATE INDEX idx_customers_created_at ON customers (created_at, id);
CREATE INDEX idx_customers_phone ON customers (phone);
CREATE INDEX idx_customers_company_name ON customers (company_name);
CREATE INDEX idx_requests_customer_status_created ON requests (customer_id, status, created_at, id);
CREATE INDEX idx_requests_status_created ON requests (status, created_at, id);
CREATE INDEX idx_requests_converted_deal ON requests (converted_deal_id);
CREATE INDEX idx_deals_customer_status_created ON deals (customer_id, status, created_at, id);
CREATE INDEX idx_deals_status_created ON deals (status, created_at, id);
CREATE INDEX idx_deals_due_created ON deals (due_amount, created_at, id);
CREATE INDEX idx_timeline_deal_created ON deal_timeline_events (deal_id, created_at, id);
CREATE INDEX idx_activities_created ON activities (created_at, id);