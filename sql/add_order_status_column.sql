-- Add order_status column to orders table
-- This script adds a status column with predefined status values

USE foodloft_db;

-- Add the order_status column with ENUM type for better data integrity
ALTER TABLE orders 
ADD COLUMN order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') 
DEFAULT 'pending' 
NOT NULL;

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- Update existing orders to have a default status based on their creation date
-- Orders from today = 'pending'
-- Orders from yesterday = 'preparing' 
-- Older orders = 'delivered'
UPDATE orders 
SET order_status = CASE 
    WHEN DATE(created_at) = CURDATE() THEN 'pending'
    WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN 'preparing'
    WHEN DATE(created_at) = CURDATE() - INTERVAL 2 DAY THEN 'ready'
    ELSE 'delivered'
END;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Add an index on the status column for better query performance
CREATE INDEX idx_order_status ON orders(order_status);

-- Display the updated table structure
DESCRIBE orders;

-- Show sample data with the new status column
SELECT order_id, created_at, order_status, total_amount 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
