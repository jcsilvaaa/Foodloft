-- Fix for order_status ENUM values
-- This script shows current ENUM values and provides options to fix the issue

USE foodloft_db;

-- First, let's see the current structure of the orders table
DESCRIBE orders;

-- Show the exact ENUM definition
SHOW COLUMNS FROM orders LIKE 'order_status';

-- Option 1: Add 'completed' to the existing ENUM values
-- ALTER TABLE orders MODIFY COLUMN order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'completed') DEFAULT 'pending' NOT NULL;

-- Option 2: Use the correct existing value instead
-- Use 'delivered' instead of 'completed':
-- UPDATE orders SET order_status = 'delivered' WHERE order_id = 1;
-- UPDATE orders SET order_status = 'preparing' WHERE order_id = 2;

-- Option 3: Change ENUM to include 'completed' and replace 'delivered'
-- ALTER TABLE orders MODIFY COLUMN order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL;
