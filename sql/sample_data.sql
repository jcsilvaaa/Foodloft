USE foodloft_db;

-- Insert sample categories
INSERT INTO categories (name) VALUES 
('Chinese Food');

-- Insert the 3 main food items only
INSERT INTO food (name, description, price, image, category_id, quantity)
VALUES
('Kikiam', 'A savory Chinese-inspired street food made of seasoned ground meat wrapped in bean curd skin.', 100.00, 'images/kikiam.jpg', 1, 50),
('Chinese Meatballs', 'Juicy and tender meatballs infused with garlic, soy sauce, and Chinese spices, perfect with rice or noodles.', 300.00, 'images/chinese_meatballs.jpg', 1, 50),
('Dumpling', 'Soft dough filled with minced meat and vegetables, steamed to perfection for that authentic bite.', 200.00, 'images/dumpling.jpg', 1, 50);

-- Insert sample users (admin and customers)
INSERT INTO users (username, password, email, full_name, address, contact_number, role, avatar, description)
VALUES
-- Admin users
('foodloft_admin', 'admin123', 'admin@foodloft.com', 'FoodLoft Admin', '123 Admin Street, Makati City, Metro Manila', '09123456780', 'admin', 'images/admin.png', 'Main administrator of FoodLoft system'),
('manager_user', 'manager123', 'manager@foodloft.com', 'Sarah Chen', '456 Management Ave, BGC, Taguig City', '09234567890', 'admin', 'images/manager.png', 'Restaurant manager and secondary admin'),

-- Customer users
('foodloft_customer', 'customer123', 'customer@foodloft.com', 'John Dela Cruz', '456 Customer Avenue, Quezon City, Metro Manila', '09123456781', 'customer', 'images/customer.png', 'Regular customer account'),
('maria_santos', 'maria123', 'maria.santos@gmail.com', 'Maria Santos', '789 Rizal Street, Pasig City, Metro Manila', '09345678901', 'customer', 'images/maria.png', 'Frequent food enthusiast and reviewer'),
('alex_garcia', 'alex2024', 'alex.garcia@yahoo.com', 'Alexander Garcia', '321 Bonifacio Avenue, Mandaluyong City, Metro Manila', '09456789012', 'customer', 'images/alex.png', 'Office worker who loves ordering lunch'),
('jenny_lim', 'jenny456', 'jenny.lim@outlook.com', 'Jennifer Lim', '654 Ortigas Street, Pasig City, Metro Manila', '09567890123', 'customer', 'images/jenny.png', 'Food blogger and social media influencer');

-- Insert sample cart items for active customers (only using main 3 food items)
INSERT INTO cart (user_id, food_id, quantity, added_at)
VALUES
-- John's current cart (user_id = 2)
(2, 1, 2, NOW() - INTERVAL 30 MINUTE),  -- 2 Kikiam
(2, 3, 1, NOW() - INTERVAL 25 MINUTE),  -- 1 Dumpling

-- Maria's current cart (user_id = 23)
(23, 2, 1, NOW() - INTERVAL 45 MINUTE),  -- 1 Chinese Meatballs
(23, 1, 3, NOW() - INTERVAL 40 MINUTE),  -- 3 Kikiam

-- Alex's current cart (user_id = 24)
(24, 3, 2, NOW() - INTERVAL 15 MINUTE),  -- 2 Dumpling
(24, 2, 1, NOW() - INTERVAL 10 MINUTE);  -- 1 Chinese Meatballs

-- Insert sample orders with different statuses (only using main 3 food items)
INSERT INTO orders (user_id, first_name, last_name, company_name, country_region, street_address, city, state, zip, phone_number, email_address, additional_info, payment_method, total_amount, order_status, created_at)
VALUES
-- Recent orders (last week)
(2, 'John', 'Dela Cruz', NULL, 'Philippines', '456 Customer Avenue', 'Quezon City', 'Metro Manila', '1100', '09123456781', 'customer@foodloft.com', 'Please deliver to the guard at the lobby', 'Credit Card', 600.00, 'delivered', NOW() - INTERVAL 1 DAY),
(23, 'Maria', 'Santos', 'Tech Solutions Inc.', 'Philippines', '789 Rizal Street', 'Pasig City', 'Metro Manila', '1600', '09345678901', 'maria.santos@gmail.com', 'Office delivery, 15th floor', 'GCash', 500.00, 'completed', NOW() - INTERVAL 2 DAY),
(24, 'Alexander', 'Garcia', NULL, 'Philippines', '321 Bonifacio Avenue', 'Mandaluyong City', 'Metro Manila', '1550', '09456789012', 'alex.garcia@yahoo.com', 'Ring doorbell twice', 'PayMaya', 700.00, 'delivered', NOW() - INTERVAL 3 DAY),
(25, 'Jennifer', 'Lim', 'Food Blog Media', 'Philippines', '654 Ortigas Street', 'Pasig City', 'Metro Manila', '1600', '09567890123', 'jenny.lim@outlook.com', 'For food review content, please ensure presentation', 'Bank Transfer', 800.00, 'completed', NOW() - INTERVAL 4 DAY),

-- This week's orders - various statuses
(2, 'John', 'Dela Cruz', NULL, 'Philippines', '456 Customer Avenue', 'Quezon City', 'Metro Manila', '1100', '09123456781', 'customer@foodloft.com', 'Family dinner order', 'Credit Card', 900.00, 'preparing', NOW() - INTERVAL 2 HOUR),
(23, 'Maria', 'Santos', NULL, 'Philippines', '789 Rizal Street', 'Pasig City', 'Metro Manila', '1600', '09345678901', 'maria.santos@gmail.com', 'Student dorm, building B', 'GCash', 300.00, 'confirmed', NOW() - INTERVAL 4 HOUR),
(24, 'Alexander', 'Garcia', 'DevCorp Solutions', 'Philippines', '321 Bonifacio Avenue', 'Mandaluyong City', 'Metro Manila', '1550', '09456789012', 'alex.garcia@yahoo.com', 'Office lunch order for team', 'PayMaya', 1200.00, 'ready', NOW() - INTERVAL 1 HOUR),
(25, 'Jennifer', 'Lim', NULL, 'Philippines', '654 Ortigas Street', 'Pasig City', 'Metro Manila', '1600', '09567890123', 'jenny.lim@outlook.com', 'Healthy meal prep order', 'Credit Card', 400.00, 'pending', NOW() - INTERVAL 30 MINUTE),

-- Older orders (last month) for sales history
(2, 'John', 'Dela Cruz', NULL, 'Philippines', '456 Customer Avenue', 'Quezon City', 'Metro Manila', '1100', '09123456781', 'customer@foodloft.com', 'Weekend family meal', 'Credit Card', 800.00, 'completed', NOW() - INTERVAL 7 DAY),
(23, 'Maria', 'Santos', NULL, 'Philippines', '789 Rizal Street', 'Pasig City', 'Metro Manila', '1600', '09345678901', 'maria.santos@gmail.com', 'Birthday celebration order', 'GCash', 1000.00, 'completed', NOW() - INTERVAL 10 DAY),
(24, 'Alexander', 'Garcia', NULL, 'Philippines', '321 Bonifacio Avenue', 'Mandaluyong City', 'Metro Manila', '1550', '09456789012', 'alex.garcia@yahoo.com', NULL, 'PayMaya', 500.00, 'completed', NOW() - INTERVAL 15 DAY),
(25, 'Jennifer', 'Lim', NULL, 'Philippines', '654 Ortigas Street', 'Pasig City', 'Metro Manila', '1600', '09567890123', 'jenny.lim@outlook.com', 'Content creation order', 'Bank Transfer', 600.00, 'completed', NOW() - INTERVAL 20 DAY),

-- Some cancelled orders for testing
(2, 'John', 'Dela Cruz', NULL, 'Philippines', '456 Customer Avenue', 'Quezon City', 'Metro Manila', '1100', '09123456781', 'customer@foodloft.com', 'Changed mind about order', 'Credit Card', 200.00, 'cancelled', NOW() - INTERVAL 5 DAY),
(23, 'Maria', 'Santos', NULL, 'Philippines', '789 Rizal Street', 'Pasig City', 'Metro Manila', '1600', '09345678901', 'maria.santos@gmail.com', 'Meeting got cancelled', 'GCash', 300.00, 'cancelled', NOW() - INTERVAL 8 DAY);

-- Insert order items for all the orders above (only using main 3 food items)
INSERT INTO order_items (order_id, food_id, quantity, price)
VALUES
-- Order 1 items (John's delivered order - 600.00 total)
(1, 1, 3, 100.00),  -- 3 Kikiam
(1, 2, 1, 300.00),  -- 1 Chinese Meatballs

-- Order 2 items (Maria's completed order - 500.00 total)
(2, 1, 2, 100.00),  -- 2 Kikiam
(2, 2, 1, 300.00),  -- 1 Chinese Meatballs

-- Order 3 items (Alex's delivered order - 700.00 total)
(3, 1, 2, 100.00),  -- 2 Kikiam
(3, 3, 1, 200.00),  -- 1 Dumpling
(3, 2, 1, 300.00),  -- 1 Chinese Meatballs

-- Order 4 items (Jenny's completed order - 800.00 total)
(4, 1, 3, 100.00),  -- 3 Kikiam
(4, 3, 1, 200.00),  -- 1 Dumpling
(4, 2, 1, 300.00),  -- 1 Chinese Meatballs

-- Order 5 items (John's preparing order - 900.00 total)
(5, 2, 2, 300.00),  -- 2 Chinese Meatballs
(5, 1, 3, 100.00),  -- 3 Kikiam

-- Order 6 items (Maria's confirmed order - 300.00 total)
(6, 2, 1, 300.00),  -- 1 Chinese Meatballs

-- Order 7 items (Alex's ready order - 1200.00 total)
(7, 2, 3, 300.00),  -- 3 Chinese Meatballs
(7, 1, 3, 100.00),  -- 3 Kikiam

-- Order 8 items (Jenny's pending order - 400.00 total)
(8, 3, 2, 200.00),  -- 2 Dumpling

-- Order 9 items (John's older completed order - 800.00 total)
(9, 1, 2, 100.00),  -- 2 Kikiam
(9, 2, 2, 300.00),  -- 2 Chinese Meatballs

-- Order 10 items (Maria's older completed order - 1000.00 total)
(10, 1, 4, 100.00), -- 4 Kikiam
(10, 3, 3, 200.00), -- 3 Dumpling

-- Order 11 items (Alex's older completed order - 500.00 total)
(11, 1, 2, 100.00), -- 2 Kikiam
(11, 2, 1, 300.00), -- 1 Chinese Meatballs

-- Order 12 items (Jenny's older completed order - 600.00 total)
(12, 3, 3, 200.00), -- 3 Dumpling

-- Order 13 items (John's cancelled order - 200.00 total)
(13, 3, 1, 200.00), -- 1 Dumpling

-- Order 14 items (Maria's cancelled order - 300.00 total)
(14, 2, 1, 300.00); -- 1 Chinese Meatballs
