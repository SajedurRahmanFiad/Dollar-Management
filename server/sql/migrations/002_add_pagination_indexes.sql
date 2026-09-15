DROP PROCEDURE IF EXISTS add_index_if_missing;

DELIMITER $$

CREATE PROCEDURE add_index_if_missing(
	IN table_name_value VARCHAR(64),
	IN index_name_value VARCHAR(64),
	IN columns_value VARCHAR(255)
)
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.statistics
		WHERE table_schema = DATABASE()
		  AND table_name = table_name_value
		  AND index_name = index_name_value
	) THEN
		SET @create_index_sql = CONCAT(
			'CREATE INDEX `', index_name_value,
			'` ON `', table_name_value, '` (', columns_value, ')'
		);
		PREPARE create_index_statement FROM @create_index_sql;
		EXECUTE create_index_statement;
		DEALLOCATE PREPARE create_index_statement;
	END IF;
END$$

DELIMITER ;

CALL add_index_if_missing('customers', 'idx_customers_created_at', 'created_at, id');
CALL add_index_if_missing('customers', 'idx_customers_phone', 'phone');
CALL add_index_if_missing('customers', 'idx_customers_company_name', 'company_name');
CALL add_index_if_missing('requests', 'idx_requests_customer_status_created', 'customer_id, status, created_at, id');
CALL add_index_if_missing('requests', 'idx_requests_status_created', 'status, created_at, id');
CALL add_index_if_missing('requests', 'idx_requests_converted_deal', 'converted_deal_id');
CALL add_index_if_missing('deals', 'idx_deals_customer_status_created', 'customer_id, status, created_at, id');
CALL add_index_if_missing('deals', 'idx_deals_status_created', 'status, created_at, id');
CALL add_index_if_missing('deals', 'idx_deals_due_created', 'due_amount, created_at, id');
CALL add_index_if_missing('deal_timeline_events', 'idx_timeline_deal_created', 'deal_id, created_at, id');
CALL add_index_if_missing('activities', 'idx_activities_created', 'created_at, id');

DROP PROCEDURE IF EXISTS add_index_if_missing;