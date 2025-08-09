-- Alternative: Add order_status column as VARCHAR (more flexible)
-- Use this if you prefer a simpler VARCHAR column instead of ENUM

USE foodloft_db;

-- Add the order_status column as VARCHAR
ALTER TABLE orders 
ADD COLUMN order_status VARCHAR(20) 
DEFAULT 'pending' 
NOT NULL;

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- Update existing orders with default statuses
UPDATE orders 
SET order_status = CASE 
    WHEN DATE(created_at) = CURDATE() THEN 'pending'
    WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN 'preparing'
    WHEN DATE(created_at) = CURDATE() - INTERVAL 2 DAY THEN 'ready'
    ELSE 'delivered'
END;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Add index for performance
CREATE INDEX idx_order_status ON orders(order_status);

-- Verify the changes
DESCRIBE orders;
SELECT order_id, created_at, order_status, total_amount FROM orders LIMIT 5;
