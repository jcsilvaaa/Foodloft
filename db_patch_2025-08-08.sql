-- Align orders schema with application expectations
-- Adds commonly used columns if missing and backfills values where possible.

-- Note: MySQL before 8.0.29 does not support IF NOT EXISTS for ADD COLUMN.
-- This patch uses conditional logic via information_schema to be idempotent.

-- Add order_date
SET @stmt := (SELECT IF(
	EXISTS(
		SELECT 1 FROM information_schema.COLUMNS 
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_date'
	),
	'SELECT 1',
	'ALTER TABLE orders ADD COLUMN order_date DATETIME NULL'
));
PREPARE s1 FROM @stmt; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Add status
SET @stmt := (SELECT IF(
	EXISTS(
		SELECT 1 FROM information_schema.COLUMNS 
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'status'
	),
	'SELECT 1',
	"ALTER TABLE orders ADD COLUMN status ENUM('pending','preparing','delivered','cancelled') NOT NULL DEFAULT 'pending'"
));
PREPARE s2 FROM @stmt; EXECUTE s2; DEALLOCATE PREPARE s2;

-- Add total_price
SET @stmt := (SELECT IF(
	EXISTS(
		SELECT 1 FROM information_schema.COLUMNS 
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'total_price'
	),
	'SELECT 1',
	'ALTER TABLE orders ADD COLUMN total_price DECIMAL(10,2) NULL'
));
PREPARE s3 FROM @stmt; EXECUTE s3; DEALLOCATE PREPARE s3;

-- Add delivery_address
SET @stmt := (SELECT IF(
	EXISTS(
		SELECT 1 FROM information_schema.COLUMNS 
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_address'
	),
	'SELECT 1',
	'ALTER TABLE orders ADD COLUMN delivery_address VARCHAR(255) NULL'
));
PREPARE s4 FROM @stmt; EXECUTE s4; DEALLOCATE PREPARE s4;

-- Backfill order_date from created_at when NULL
UPDATE orders SET order_date = COALESCE(order_date, created_at, NOW());

-- Backfill total_price from total_amount when NULL
UPDATE orders SET total_price = COALESCE(total_price, total_amount, 0);

-- Backfill delivery_address if empty
UPDATE orders
SET delivery_address = COALESCE(delivery_address, CONCAT_WS(', ', street_address, city, state, zip, country_region))
WHERE delivery_address IS NULL OR delivery_address = '';
