SET @rename_customer_location = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'customers'
              AND column_name = 'location'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'customers'
              AND column_name = 'company_name'
        ),
        'ALTER TABLE customers CHANGE COLUMN location company_name VARCHAR(150) NULL',
        'SELECT 1'
    )
);

PREPARE rename_customer_location FROM @rename_customer_location;
EXECUTE rename_customer_location;
DEALLOCATE PREPARE rename_customer_location;
