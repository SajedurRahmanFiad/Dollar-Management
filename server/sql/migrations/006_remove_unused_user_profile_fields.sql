DROP PROCEDURE IF EXISTS remove_user_column_if_exists;

DELIMITER $$

CREATE PROCEDURE remove_user_column_if_exists(IN column_name_value VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'users'
          AND column_name = column_name_value
    ) THEN
        SET @remove_user_column_sql = CONCAT(
            'ALTER TABLE `users` DROP COLUMN `', column_name_value, '`'
        );
        PREPARE remove_user_column_statement FROM @remove_user_column_sql;
        EXECUTE remove_user_column_statement;
        DEALLOCATE PREPARE remove_user_column_statement;
    END IF;
END$$

DELIMITER ;

CALL remove_user_column_if_exists('email');
CALL remove_user_column_if_exists('notes');
CALL remove_user_column_if_exists('preferred_channel');

DROP PROCEDURE IF EXISTS remove_user_column_if_exists;
