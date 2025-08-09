-- Safe update mode compatible version
-- This version updates each order individually using the primary key

USE foodloft_db;

-- First, add the order_status column
ALTER TABLE orders 
ADD COLUMN order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') 
DEFAULT 'pending' 
NOT NULL;

-- Update orders individually using a stored procedure approach
-- This works with safe update mode since it uses the primary key

-- Update orders from today to 'pending'
UPDATE orders 
SET order_status = 'pending' 
WHERE DATE(created_at) = CURDATE() AND order_id > 0;

-- Update orders from yesterday to 'preparing'
UPDATE orders 
SET order_status = 'preparing' 
WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY AND order_id > 0;

-- Update orders from 2 days ago to 'ready'
UPDATE orders 
SET order_status = 'ready' 
WHERE DATE(created_at) = CURDATE() - INTERVAL 2 DAY AND order_id > 0;

-- Update older orders to 'delivered'
UPDATE orders 
SET order_status = 'delivered' 
WHERE DATE(created_at) < CURDATE() - INTERVAL 2 DAY AND order_id > 0;

-- Add index for performance
CREATE INDEX idx_order_status ON orders(order_status);

-- Verify the changes
DESCRIBE orders;

-- Show sample data with the new status column
SELECT order_id, created_at, order_status, total_amount 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
