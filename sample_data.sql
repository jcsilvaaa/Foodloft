USE foodloft_db;

-- Insert category
INSERT INTO categories (name) VALUES ('Chinese Food');

-- Get the category_id for Chinese Food (usually it will be 1 if empty before)
-- Insert food items
INSERT INTO food (name, description, price, image, category_id, is_available)
VALUES
('Kikiam', 'A savory Chinese-inspired street food made of seasoned ground meat wrapped in bean curd skin.', 100.00, 'images/kikiam.jpg', 1, 1),
('Chinese Meatballs', 'Juicy and tender meatballs infused with garlic, soy sauce, and Chinese spices, perfect with rice or noodles.', 300.00, 'images/chinese_meatballs.jpg', 1, 1),
('Dumpling', 'Soft dough filled with minced meat and vegetables, steamed to perfection for that authentic bite.', 200.00, 'images/dumpling.jpg', 1, 1);
