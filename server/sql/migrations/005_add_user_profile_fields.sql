DROP PROCEDURE IF EXISTS add_user_column_if_missing;

DELIMITER $$

CREATE PROCEDURE add_user_column_if_missing(
    IN column_name_value VARCHAR(64),
    IN definition_value VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'users'
          AND column_name = column_name_value
    ) THEN
        SET @add_user_column_sql = CONCAT(
            'ALTER TABLE `users` ADD COLUMN `',
            column_name_value, '` ', definition_value
        );
        PREPARE add_user_column_statement FROM @add_user_column_sql;
        EXECUTE add_user_column_statement;
        DEALLOCATE PREPARE add_user_column_statement;
    END IF;
END$$

DELIMITER ;

CALL add_user_column_if_missing('display_name', 'VARCHAR(100) NULL AFTER username');
CALL add_user_column_if_missing('phone', 'VARCHAR(20) NULL AFTER display_name');
CALL add_user_column_if_missing('email', 'VARCHAR(100) NULL AFTER phone');
CALL add_user_column_if_missing('company_name', 'VARCHAR(150) NULL AFTER email');
CALL add_user_column_if_missing('notes', 'TEXT NULL AFTER company_name');
CALL add_user_column_if_missing('preferred_channel', "VARCHAR(20) DEFAULT 'WhatsApp' AFTER notes");

DROP PROCEDURE IF EXISTS add_user_column_if_missing;

UPDATE users
SET phone = username
WHERE phone IS NULL;
