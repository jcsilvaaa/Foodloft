USE foodloft_db;

-- Insert test categories
INSERT INTO categories (name) VALUES 
('Chinese Food'),
('Filipino Food'),
('Desserts');

-- Insert test food items
INSERT INTO food (name, description, price, image, category_id, quantity) VALUES
('Kikiam', 'A savory Chinese-inspired street food made of seasoned ground meat wrapped in bean curd skin.', 100.00, 'Kikiam.jpg', 1, 50),
('Chinese Meatballs', 'Juicy and tender meatballs infused with garlic, soy sauce, and Chinese spices.', 300.00, 'CMB.jpg', 1, 50),
('Dumpling', 'Soft dough filled with minced meat and vegetables, steamed to perfection.', 200.00, 'Dumpling.jpg', 1, 50);

-- Insert test users (make sure admin exists)
INSERT INTO users (username, password, email, full_name, address, contact_number, role) VALUES
('admin', '12345', 'ct@gmail.com', 'Admin User', '123 Admin St', '09123456789', 'admin'),
('testcustomer', 'password123', 'customer@test.com', 'Test Customer', '456 Customer Ave', '09876543210', 'customer');

-- Insert test orders
INSERT INTO orders (user_id, order_date, status, total_price, first_name, last_name, country_region, street_address, city, state, zip, phone_number, email_address, payment_method) VALUES
(2, NOW(), 'pending', 300.00, 'John', 'Doe', 'Philippines', '123 Test Street', 'Manila', 'NCR', '1000', '09123456789', 'john@test.com', 'cash'),
(2, DATE_SUB(NOW(), INTERVAL 1 DAY), 'preparing', 500.00, 'Jane', 'Smith', 'Philippines', '456 Another Street', 'Quezon City', 'NCR', '1100', '09987654321', 'jane@test.com', 'gcash'),
(2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'delivered', 200.00, 'Bob', 'Johnson', 'Philippines', '789 Third Street', 'Makati', 'NCR', '1200', '09111222333', 'bob@test.com', 'card');

-- Insert test order items
INSERT INTO order_items (order_id, food_id, quantity, price) VALUES
(1, 1, 2, 100.00),
(1, 2, 1, 300.00),
(2, 3, 1, 200.00),
(2, 1, 3, 100.00),
(3, 3, 1, 200.00);
