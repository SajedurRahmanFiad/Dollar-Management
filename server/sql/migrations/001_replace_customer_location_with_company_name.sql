USE dollar_exchange;

ALTER TABLE customers
    CHANGE COLUMN location company_name VARCHAR(150) NULL;

UPDATE customers
SET company_name = NULL;
