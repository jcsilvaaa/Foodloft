CREATE DATABASE IF NOT EXISTS foodloft_db;
USE foodloft_db;

-- Table: categories
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  category_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: food
DROP TABLE IF EXISTS food;
CREATE TABLE food (
  food_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  category_id INT DEFAULT NULL,
  quantity INT DEFAULT 0,
  PRIMARY KEY (food_id),
  KEY category_id (category_id),
  CONSTRAINT food_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  user_id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  address TEXT,
  contact_number VARCHAR(20) DEFAULT NULL,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  avatar VARCHAR(255),
  description TEXT,
  PRIMARY KEY (user_id),
  UNIQUE KEY username (username),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: cart
DROP TABLE IF EXISTS cart;
CREATE TABLE cart (
  cart_id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  food_id INT DEFAULT NULL,
  quantity INT DEFAULT 1,
  added_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cart_id),
  KEY user_id (user_id),
  KEY food_id (food_id),
  CONSTRAINT cart_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT cart_ibfk_2 FOREIGN KEY (food_id) REFERENCES food (food_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: orders
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  order_id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  order_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','preparing','delivered','cancelled') DEFAULT 'pending',
  total_price DECIMAL(10,2) DEFAULT NULL,
  delivery_address TEXT,
  PRIMARY KEY (order_id),
  KEY user_id (user_id),
  CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: order_items
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  order_item_id INT NOT NULL AUTO_INCREMENT,
  order_id INT DEFAULT NULL,
  food_id INT DEFAULT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) DEFAULT NULL,
  PRIMARY KEY (order_item_id),
  KEY order_id (order_id),
  KEY food_id (food_id),
  CONSTRAINT order_items_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT order_items_ibfk_2 FOREIGN KEY (food_id) REFERENCES food (food_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


