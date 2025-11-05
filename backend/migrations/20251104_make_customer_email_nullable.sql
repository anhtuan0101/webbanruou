-- Migration: allow customers.email to be NULL and remove UNIQUE constraint on email
-- Run this on your MySQL database (Workbench, CLI, phpMyAdmin)

-- 1) Drop UNIQUE index on email if exists
ALTER TABLE customers DROP INDEX IF EXISTS `email`;

-- 2) Modify column to allow NULL
ALTER TABLE customers MODIFY COLUMN `email` VARCHAR(100) NULL;

-- 3) (Optional) Add an index on email for lookup (non-unique)
-- Note: some MySQL versions do not support `IF NOT EXISTS` in CREATE INDEX.
-- Run the following simple CREATE INDEX command. If the index already exists you will get an error which can be ignored,
-- or first check existing indexes with `SHOW INDEX FROM customers;`.
CREATE INDEX idx_customers_email ON customers(email);

-- Notes:
-- - This will allow inserting customers without email (NULL).
-- - If you're using a MySQL version that does not support DROP INDEX IF EXISTS / CREATE INDEX IF NOT EXISTS,
--   run the appropriate commands in your environment or check first whether the index exists.
-- - After running, restart the backend server so new behavior applies.
