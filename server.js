const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// ✅ Multer configuration for avatar & food uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ✅ Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '_Sideswipe21',
  database: 'foodloft_db'
});

db.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL database.');
  }
});


// ============================
// ✅ AUTH ROUTES
// ============================

// ✅ Register new user
app.post('/register', upload.single('avatar'), (req, res) => {
  const { full_name, username, email, password, address, contact_number, description } = req.body;
  const avatar = req.file ? `/uploads/${req.file.filename}` : null;

  // Validate required fields
  if (!full_name || !username || !email || !password || !address || !contact_number) {
    return res.status(400).json({ message: 'All required fields must be filled' });
  }

  const sql = `
    INSERT INTO users (full_name, username, email, password, avatar, address, contact_number, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    full_name,
    username,
    email,
    password,
    avatar,
    address,
    contact_number,
    description || ''
  ], (err) => {
    if (err) {
      console.error('❌ Registration Error:', err);
      return res.status(500).json({ message: 'Registration failed' });
    }
    res.json({ message: '✅ Registration successful!' });
  });
});

// ✅ Login user
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const sql = 'SELECT user_id, username, email FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('❌ Login Error:', err);
      return res.status(500).json({ message: 'Login failed' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    res.json({ message: '✅ Login successful', user });
  });
});


// ============================
// ✅ MENU ROUTES
// ============================

// ✅ Get all food items
app.get('/menu', (req, res) => {
  const sql = 'SELECT * FROM food';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch menu' });
    res.json(results);
  });
});

// ✅ Add new food item (Admin)
app.post('/admin/menu', upload.single('image'), (req, res) => {
  const { name, description, price, category_id, quantity } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !price || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = 'INSERT INTO food (name, description, price, image, category_id, quantity) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [name, description || '', price, image, category_id || 1, quantity], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to add food item' });
    res.json({ message: 'Food item added successfully' });
  });
});


// ============================
// ✅ CART ROUTES
// ============================

// ✅ Add to cart and deduct stock
app.post('/cart', (req, res) => {
  const { user_id, food_id, quantity } = req.body;

  if (!user_id || !food_id || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.query('SELECT quantity FROM food WHERE food_id = ?', [food_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length === 0) return res.status(404).json({ error: 'Food item not found' });

    const stock = results[0].quantity;
    if (stock < quantity) return res.status(400).json({ error: 'Not enough stock' });

    const checkSql = 'SELECT * FROM cart WHERE user_id = ? AND food_id = ?';
    db.query(checkSql, [user_id, food_id], (err, cartResults) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (cartResults.length > 0) {
        const updateSql = 'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND food_id = ?';
        db.query(updateSql, [quantity, user_id, food_id], (err) => {
          if (err) return res.status(500).json({ error: 'Failed to update cart' });

          db.query('UPDATE food SET quantity = quantity - ? WHERE food_id = ?', [quantity, food_id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update stock' });
            return res.json({ message: 'Cart updated successfully' });
          });
        });
      } else {
        const insertSql = 'INSERT INTO cart (user_id, food_id, quantity) VALUES (?, ?, ?)';
        db.query(insertSql, [user_id, food_id, quantity], (err) => {
          if (err) return res.status(500).json({ error: 'Failed to add to cart' });

          db.query('UPDATE food SET quantity = quantity - ? WHERE food_id = ?', [quantity, food_id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update stock' });
            return res.json({ message: 'Added to cart successfully' });
          });
        });
      }
    });
  });
});

// ✅ Get cart items
app.get('/cart/:userId', (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT c.cart_id, f.name, f.price, c.quantity, f.food_id
    FROM cart c
    JOIN food f ON c.food_id = f.food_id
    WHERE c.user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching cart:', err);
      return res.status(500).json({ error: 'Failed to fetch cart' });
    }
    res.json(results);
  });
});

// ✅ Remove item from cart
app.delete('/cart/:cartId', (req, res) => {
  const { cartId } = req.params;

  db.query('SELECT food_id, quantity FROM cart WHERE cart_id = ?', [cartId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Cart item not found' });

    const foodId = results[0].food_id;
    const quantity = results[0].quantity;

    db.query('DELETE FROM cart WHERE cart_id = ?', [cartId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to remove item' });

      db.query('UPDATE food SET quantity = quantity + ? WHERE food_id = ?', [quantity, foodId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to restore stock' });
        return res.json({ message: 'Item removed successfully' });
      });
    });
  });
});

// Checkout

app.post('/checkout', (req, res) => {
  const {
    user_id,
    first_name,
    last_name,
    company_name,
    country_region,
    street_address,
    city,
    state,
    zip,
    phone_number,
    email_address,
    additional_info,
    payment_method,
    cartItems, // array of items: { food_id, quantity, price }
    total_amount
  } = req.body;

  if (!user_id || !first_name || !last_name || !country_region || !street_address || !city || !state || !zip || !phone_number || !email_address || !payment_method || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: 'Please fill out all required fields and include cart items.' });
  }

  const orderQuery = `
    INSERT INTO orders (
      user_id, first_name, last_name, company_name, country_region, street_address,
      city, state, zip, phone_number, email_address, additional_info, payment_method, total_amount, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const orderValues = [
    user_id, first_name, last_name, company_name, country_region, street_address,
    city, state, zip, phone_number, email_address, additional_info, payment_method, total_amount,
    new Date() // `created_at`
  ];

  db.query(orderQuery, orderValues, (orderErr, orderResult) => {
    if (orderErr) {
      console.error('Order insert failed:', orderErr);
      return res.status(500).json({ message: 'Failed to place order', error: orderErr.message });
    }

    const order_id = orderResult.insertId;

    const itemValues = cartItems.map(item => [order_id, item.food_id, item.quantity, item.price]);
    const itemQuery = `
      INSERT INTO order_items (order_id, food_id, quantity, price)
      VALUES ?
    `;

    db.query(itemQuery, [itemValues], (itemsErr) => {
      if (itemsErr) {
        console.error('Order items insert failed:', itemsErr);
        return res.status(500).json({ message: 'Failed to save order items' });
      }

    });

    
    const clearCartQuery = 'DELETE FROM cart WHERE user_id = ?';
    db.query(clearCartQuery, [user_id], (clearErr) => {
      if (clearErr) {
        console.error('Failed to clear cart:', clearErr);
        return res.status(500).json({ message: 'Order placed, but failed to clear cart.' });
      }

      return res.status(200).json({ message: '✅ Order placed successfully!' });
    });
  });
});

// Reviews 

app.post('/reviews', (req, res) => {
  const { user_id, user_name, branch, rating, review_text } = req.body;

  if (!user_id || !user_name || !branch || !rating || !review_text) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO reviews (user_id, user_name, branch, rating, review_text)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, user_name, branch, rating, review_text], (err, result) => {
    if (err) {
      console.error('Failed to insert review:', err);
      return res.status(500).json({ message: 'Failed to save review', error: err });
    }
    res.status(200).json({ message: '✅ Review submitted successfully!' });
  });
});


app.get('/reviews/:branch', (req, res) => {
  const { branch } = req.params;

  const sql = `
    SELECT user_name, rating, review_text, created_at
    FROM reviews
    WHERE branch = ?
    ORDER BY review_id DESC
  `;

  db.query(sql, [branch], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ message: 'Failed to fetch reviews' });
    }
    res.status(200).json(results);
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// === UPDATE PROFILE (with file upload + address & contact number) ===
app.post('/update-profile/:id', upload.single('avatar'), (req, res) => {
  const userId = req.params.id;

  const {
    email,
    username,
    full_name,
    description,
    address,
    contact_number
  } = req.body;

  const avatar = req.file ? `/uploads/${req.file.filename}` : null;

  db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentUser = results[0];

    const updatedUser = {
      ...currentUser,
      email: email || currentUser.email,
      username: username || currentUser.username,
      full_name: full_name || currentUser.full_name,
      description: description || currentUser.description,
      address: address || currentUser.address,
      contact_number: contact_number || currentUser.contact_number,
      avatar: avatar || currentUser.avatar
    };

    const sql = `
      UPDATE users
      SET email = ?, username = ?, full_name = ?, description = ?, address = ?, contact_number = ?, avatar = ?
      WHERE user_id = ?
    `;

    db.query(sql, [
      updatedUser.email,
      updatedUser.username,
      updatedUser.full_name,
      updatedUser.description,
      updatedUser.address,
      updatedUser.contact_number,
      updatedUser.avatar,
      userId
    ], (err, result) => {
      if (err) {
        console.error("❌ DB Update Error:", err);
        return res.status(500).json({ message: 'Profile update failed.' });
      }

      res.status(200).json({ message: '✅ Profile updated successfully!', updatedUser });
    });
  });
});

// ======= CHANGE PASSWORD ROUTE =======
app.put('/change-password/:id', (req, res) => {
  const userId = req.params.id;
  const { oldPassword, newPassword } = req.body;

  // Step 1: Fetch user from DB
  db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      console.error("❌ DB error:", err);
      return res.status(500).json({ message: "Database error." });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = results[0];

    // Step 2: Check old password (plain text comparison)
    // ⚠️ NOTE: In production, passwords must be hashed and compared securely!
    if (oldPassword !== user.password) {
      return res.status(401).json({ message: "Old password is incorrect." });
    }

    // Step 3: Update password
    db.query('UPDATE users SET password = ? WHERE user_id = ?', [newPassword, userId], (err) => {
      if (err) {
        console.error("❌ Update error:", err);
        return res.status(500).json({ message: "Failed to change password." });
      }
      res.json({ message: "✅ Password updated successfully!" });
    });
  });
});

// === ORDER HISTORY ROUTE ===
// Get orders for a user
app.get("/orders", (req, res) => {
  const userId = req.query.user_id;
  const status = req.query.status;
  const fromDate = req.query.from_date;
  const toDate = req.query.to_date;

  let sql = `
    SELECT o.order_id, o.order_date, o.status, o.total_price, o.delivery_address,
           f.food_id as food_id, f.name, f.price, f.image, oi.quantity
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN food f ON oi.food_id = f.food_id
    WHERE o.user_id = ?
  `;

  const params = [userId];

  // Add status filter if specified
  if (status && status !== "all") {
    sql += " AND o.status = ?";
    params.push(status);
  }

  // Add date range filter if specified
  if (fromDate && toDate) {
    sql += " AND o.order_date BETWEEN ? AND ?";
    params.push(fromDate, toDate + " 23:59:59"); // Include entire end day
  }

  sql += " ORDER BY o.order_date DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const orders = {};
    results.forEach((row) => {
      if (!orders[row.order_id]) {
        orders[row.order_id] = {
          order_id: row.order_id,
          order_date: row.order_date,
          status: row.status,
          total_price: parseFloat(row.total_price), // Convert to number
          delivery_address: row.delivery_address,
          items: [],
        };
      }
      orders[row.order_id].items.push({
        food_id: row.food_id,
        name: row.name,
        price: parseFloat(row.price), // Convert to number
        image: row.image,
        quantity: parseInt(row.quantity), // Convert to number
      });
    });

    res.json(Object.values(orders));
  });
});

// Cancel order endpoint
app.delete("/orders/:order_id", (req, res) => {
  const orderId = req.params.order_id;
  const userId = req.query.user_id; // Get from query parameter or JWT in production

  // First verify the order belongs to the user
  const verifySql = "SELECT user_id FROM orders WHERE order_id = ?";
  db.query(verifySql, [orderId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (results[0].user_id !== parseInt(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to cancel this order" });
    }

    // Only allow cancellation if order is preparing
    if (results[0].status !== "preparing") {
      return res
        .status(400)
        .json({ error: "Only preparing orders can be cancelled" });
    }

    // Update order status to cancelled
    const updateSql =
      'UPDATE orders SET status = "cancelled" WHERE order_id = ?';
    db.query(updateSql, [orderId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true, message: "Order cancelled successfully" });
    });
  });
});

// === ADMIN ORDER MANAGEMENT ENDPOINTS ===
// Get all categories
app.get("/admin/categories", (req, res) => {
  const sql = "SELECT category_id, name FROM categories ORDER BY name";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching categories:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

// Get all menu items with filters
app.get("/admin/menu", (req, res) => {
  const { category_id, is_available, price_range, search } = req.query;

  let sql = `
    SELECT 
      f.food_id,
      f.name,
      f.description,
      f.price,
      f.image,
      f.category_id,
      f.is_available,
      c.name as category_name
    FROM food f
    LEFT JOIN categories c ON f.category_id = c.category_id
    WHERE 1=1
  `;

  const params = [];

  // Add filters
  if (category_id && category_id !== "") {
    sql += " AND f.category_id = ?";
    params.push(category_id);
  }

  if (is_available !== undefined && is_available !== "") {
    sql += " AND f.is_available = ?";
    params.push(is_available);
  }

  if (search && search !== "") {
    sql += " AND (f.name LIKE ? OR f.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (price_range && price_range !== "") {
    if (price_range === "1000+") {
      sql += " AND f.price >= 1000";
    } else {
      const [min, max] = price_range.split("-");
      sql += " AND f.price BETWEEN ? AND ?";
      params.push(parseFloat(min), parseFloat(max));
    }
  }

  sql += " ORDER BY f.name";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching menu items:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

// Get single menu item
app.get("/admin/menu/:food_id", (req, res) => {
  const foodId = req.params.food_id;

  const sql = `
    SELECT 
      f.food_id,
      f.name,
      f.description,
      f.price,
      f.image,
      f.category_id,
      f.is_available,
      c.name as category_name
    FROM food f
    LEFT JOIN categories c ON f.category_id = c.category_id
    WHERE f.food_id = ?
  `;

  db.query(sql, [foodId], (err, results) => {
    if (err) {
      console.error("Error fetching menu item:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(results[0]);
  });
});

// Add new menu item
app.post("/admin/menu", upload.single("image"), (req, res) => {
  const { name, description, price, category_id, is_available } = req.body;
  const image = req.file ? req.file.filename : null;

  // Validate required fields
  if (!name || !price || !category_id) {
    return res
      .status(400)
      .json({ error: "Name, price, and category are required" });
  }

  const sql = `
    INSERT INTO food (name, description, price, image, category_id, is_available) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const params = [
    name,
    description || null,
    parseFloat(price),
    image,
    parseInt(category_id),
    parseInt(is_available) || 1,
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error adding menu item:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      food_id: result.insertId,
    });
  });
});

// Update menu item
app.put("/admin/menu/:food_id", upload.single("image"), (req, res) => {
  const foodId = req.params.food_id;
  const { name, description, price, category_id, is_available } = req.body;
  const newImage = req.file ? req.file.filename : null;

  // First get current item to preserve existing data
  const getCurrentSql = "SELECT * FROM food WHERE food_id = ?";

  db.query(getCurrentSql, [foodId], (err, results) => {
    if (err) {
      console.error("Error fetching current menu item:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const currentItem = results[0];

    // Use new values if provided, otherwise keep current values
    const updatedName = name !== undefined ? name : currentItem.name;
    const updatedDescription =
      description !== undefined ? description : currentItem.description;
    const updatedPrice =
      price !== undefined ? parseFloat(price) : currentItem.price;
    const updatedCategoryId =
      category_id !== undefined
        ? parseInt(category_id)
        : currentItem.category_id;
    const updatedIsAvailable =
      is_available !== undefined
        ? parseInt(is_available)
        : currentItem.is_available;
    const updatedImage = newImage || currentItem.image;

    // Validate required fields only if they're being updated
    if (name !== undefined && !name) {
      return res.status(400).json({ error: "Name cannot be empty" });
    }
    if (price !== undefined && (isNaN(updatedPrice) || updatedPrice < 0)) {
      return res.status(400).json({ error: "Invalid price" });
    }
    if (
      category_id !== undefined &&
      (!category_id || isNaN(updatedCategoryId))
    ) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const updateSql = `
      UPDATE food 
      SET name = ?, description = ?, price = ?, image = ?, category_id = ?, is_available = ?
      WHERE food_id = ?
    `;

    const params = [
      updatedName,
      updatedDescription,
      updatedPrice,
      updatedImage,
      updatedCategoryId,
      updatedIsAvailable,
      foodId,
    ];

    db.query(updateSql, params, (err, result) => {
      if (err) {
        console.error("Error updating menu item:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      res.json({
        success: true,
        message: "Menu item updated successfully",
        food_id: foodId,
        updated_fields: {
          name: updatedName,
          description: updatedDescription,
          price: updatedPrice,
          category_id: updatedCategoryId,
          is_available: updatedIsAvailable,
          image: updatedImage,
        },
      });
    });
  });
});

// Update menu item availability
app.put("/admin/menu/:food_id/availability", (req, res) => {
  const foodId = req.params.food_id;
  const { is_available } = req.body;

  if (is_available === undefined) {
    return res.status(400).json({ error: "is_available field is required" });
  }

  const sql = "UPDATE food SET is_available = ? WHERE food_id = ?";

  db.query(sql, [parseInt(is_available), foodId], (err, result) => {
    if (err) {
      console.error("Error updating menu item availability:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json({
      success: true,
      message: "Menu item availability updated successfully",
      food_id: foodId,
      is_available: parseInt(is_available),
    });
  });
});

// Delete menu item
app.delete("/admin/menu/:food_id", (req, res) => {
  const foodId = req.params.food_id;

  // First check if item exists and get image filename for cleanup
  const checkSql = "SELECT image FROM food WHERE food_id = ?";

  db.query(checkSql, [foodId], (err, results) => {
    if (err) {
      console.error("Error checking menu item:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const imageFile = results[0].image;

    // Delete from database
    const deleteSql = "DELETE FROM food WHERE food_id = ?";

    db.query(deleteSql, [foodId], (err, result) => {
      if (err) {
        console.error("Error deleting menu item:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Optionally delete image file from uploads folder
      if (imageFile) {
        const fs = require("fs");
        const imagePath = path.join(__dirname, "uploads", imageFile);
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Error deleting image file:", err);
        });
      }

      res.json({
        success: true,
        message: "Menu item deleted successfully",
      });
    });
  });
});

// Update multiple menu price items at once
app.put("/admin/menu/bulk-update", (req, res) => {
  const { items } = req.body; // Array of {food_id, price}

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Items array is required" });
  }

  // Validate each item
  for (const item of items) {
    if (!item.food_id || !item.price || isNaN(parseFloat(item.price))) {
      return res
        .status(400)
        .json({ error: "Each item must have food_id and valid price" });
    }
  }

  // Start transaction for bulk update
  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Prepare bulk update queries
    const updatePromises = items.map((item) => {
      return new Promise((resolve, reject) => {
        const sql = "UPDATE food SET price = ? WHERE food_id = ?";
        db.query(sql, [parseFloat(item.price), item.food_id], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });

    // Execute all updates
    Promise.all(updatePromises)
      .then((results) => {
        // Check if all updates were successful
        const totalAffected = results.reduce(
          (sum, result) => sum + result.affectedRows,
          0
        );

        if (totalAffected !== items.length) {
          return db.rollback(() => {
            res.status(400).json({
              error: `Only ${totalAffected} out of ${items.length} items were updated`,
            });
          });
        }

        // Commit transaction
        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Commit error:", err);
              res.status(500).json({ error: "Database error" });
            });
          }

          res.json({
            success: true,
            message: `Successfully updated prices for ${items.length} items`,
            updated_count: totalAffected,
          });
        });
      })
      .catch((error) => {
        db.rollback(() => {
          console.error("Bulk update error:", error);
          res.status(500).json({ error: "Failed to update prices" });
        });
      });
  });
});

// Get menu statistics for admin dashboard
app.get("/admin/menu-stats", (req, res) => {
  const sql = `
    SELECT 
      COALESCE(COUNT(*), 0) as total_items,
      COALESCE(SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END), 0) as available_items,
      COALESCE(SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END), 0) as unavailable_items
    FROM food
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching menu stats:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const stats = results[0] || {};
    res.json({
      total_items: parseInt(stats.total_items) || 0,
      available_items: parseInt(stats.available_items) || 0,
      unavailable_items: parseInt(stats.unavailable_items) || 0,
      average_price: 0,
      highest_price: 0,
      lowest_price: 0,
    });
  });
});

// Category management endpoints
// Add new category
app.post("/admin/categories", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  const sql = "INSERT INTO categories (name) VALUES (?)";

  db.query(sql, [name], (err, result) => {
    if (err) {
      console.error("Error adding category:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      category_id: result.insertId,
    });
  });
});

// Update category
app.put("/admin/categories/:category_id", (req, res) => {
  const categoryId = req.params.category_id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  const sql = "UPDATE categories SET name = ? WHERE category_id = ?";

  db.query(sql, [name, categoryId], (err, result) => {
    if (err) {
      console.error("Error updating category:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
    });
  });
});

// Delete category
app.delete("/admin/categories/:category_id", (req, res) => {
  const categoryId = req.params.category_id;

  // First check if category has associated food items
  const checkSql = "SELECT COUNT(*) as count FROM food WHERE category_id = ?";

  db.query(checkSql, [categoryId], (err, results) => {
    if (err) {
      console.error("Error checking category usage:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results[0].count > 0) {
      return res.status(400).json({
        error: "Cannot delete category that has associated menu items",
      });
    }

    // Delete category
    const deleteSql = "DELETE FROM categories WHERE category_id = ?";

    db.query(deleteSql, [categoryId], (err, result) => {
      if (err) {
        console.error("Error deleting category:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    });
  });
});
// Get all orders for admin dashboard with filters
app.get("/admin/orders", (req, res) => {
  const { status, date, customer, order_id } = req.query;

  let sql = `
    SELECT 
      o.order_id,
      o.user_id,
      o.order_date,
      o.status,
      o.total_price,
      o.delivery_address,
      u.username as customer_name,
      u.email as customer_email,
      COUNT(oi.order_item_id) as item_count
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE 1=1
  `;

  const params = [];

  // Add filters
  if (status && status !== "") {
    sql += " AND o.status = ?";
    params.push(status);
  }

  if (date && date !== "") {
    sql += " AND DATE(o.order_date) = ?";
    params.push(date);
  }

  if (customer && customer !== "") {
    sql += " AND (u.username LIKE ? OR u.email LIKE ?)";
    params.push(`%${customer}%`, `%${customer}%`);
  }

  if (order_id && order_id !== "") {
    sql += " AND o.order_id = ?";
    params.push(order_id);
  }

  sql += " GROUP BY o.order_id ORDER BY o.order_date DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching admin orders:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

// Get detailed order information for admin
app.get("/admin/orders/:order_id", (req, res) => {
  const orderId = req.params.order_id;

  // First get order basic info
  const orderSql = `
    SELECT 
      o.order_id,
      o.user_id,
      o.order_date,
      o.status,
      o.total_price,
      o.delivery_address,
      u.username as customer_name,
      u.email as customer_email,
      u.full_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = ?
  `;

  db.query(orderSql, [orderId], (err, orderResults) => {
    if (err) {
      console.error("Error fetching order details:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (orderResults.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResults[0];

    // Get order items with food details
    const itemsSql = `
      SELECT 
        oi.order_item_id,
        oi.quantity,
        oi.price,
        f.food_id,
        f.name,
        f.description,
        f.image
      FROM order_items oi
      JOIN food f ON oi.food_id = f.food_id
      WHERE oi.order_id = ?
    `;

    db.query(itemsSql, [orderId], (err, itemsResults) => {
      if (err) {
        console.error("Error fetching order items:", err);
        return res.status(500).json({ error: "Database error" });
      }

      order.items = itemsResults;
      res.json(order);
    });
  });
});

// Update order status
app.put("/admin/orders/:order_id/status", (req, res) => {
  const orderId = req.params.order_id;
  const { status } = req.body;

  // Validate status
  const validStatuses = ["pending", "preparing", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const sql = "UPDATE orders SET status = ? WHERE order_id = ?";

  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      console.error("Error updating order status:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order_id: orderId,
      new_status: status,
    });
  });
});

// Get order statistics for admin dashboard
app.get("/admin/orders/stats/today", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const sql = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
      COALESCE(SUM(total_price), 0) as total_revenue,
      COALESCE(AVG(total_price), 0) as average_order_value,
      COUNT(DISTINCT user_id) as unique_customers
    FROM orders 
    WHERE DATE(order_date) = ?
  `;

  db.query(sql, [today], (err, results) => {
    if (err) {
      console.error("Error fetching order stats:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const stats = results[0];

    // Add calculated metrics
    stats.completion_rate =
      stats.total_orders > 0
        ? ((stats.delivered_orders / stats.total_orders) * 100).toFixed(1)
        : 0;

    res.json(stats);
  });
});

// Delete order (admin only)
app.delete("/admin/orders/:order_id", (req, res) => {
  const orderId = req.params.order_id;

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Delete order items first
    db.query("DELETE FROM order_items WHERE order_id = ?", [orderId], (err) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error deleting order items:", err);
          res.status(500).json({ error: "Database error" });
        });
      }

      // Delete order
      db.query(
        "DELETE FROM orders WHERE order_id = ?",
        [orderId],
        (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error deleting order:", err);
              res.status(500).json({ error: "Database error" });
            });
          }

          if (result.affectedRows === 0) {
            return db.rollback(() => {
              res.status(404).json({ error: "Order not found" });
            });
          }

          // Commit transaction
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Commit error:", err);
                res.status(500).json({ error: "Database error" });
              });
            }

            res.json({
              success: true,
              message: "Order deleted successfully",
            });
          });
        }
      );
    });
  });
});

// Get total user count for dashboard
app.get("/admin/users/customers-count", (req, res) => {
  const sql = `
    SELECT 
      SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers
    FROM users
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching customer count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ customers: results[0].customers || 0 });
  });
});

// Get popular dishes based on order frequency
app.get("/admin/dishes/popular", (req, res) => {
  const limit = req.query.limit || 5;
  const days = req.query.days || 30; // Default to last 30 days

  const sql = `
    SELECT 
      f.food_id,
      f.name,
      f.image,
      f.price,
      SUM(oi.quantity) as total_ordered,
      COUNT(DISTINCT oi.order_id) as order_count,
      SUM(oi.quantity * oi.price) as total_revenue
    FROM food f
    JOIN order_items oi ON f.food_id = oi.food_id
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND o.status IN ('delivered', 'preparing')
    GROUP BY f.food_id, f.name, f.image, f.price
    ORDER BY total_ordered DESC
    LIMIT ?
  `;

  db.query(sql, [days, parseInt(limit)], (err, results) => {
    if (err) {
      console.error("Error fetching popular dishes:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

// Get recent orders for admin dashboard
app.get("/admin/orders/recent", (req, res) => {
  const limit = req.query.limit || 10;

  const sql = `
    SELECT 
      o.order_id,
      o.user_id,
      o.order_date,
      o.status,
      o.total_price,
      o.delivery_address,
      u.username as customer_name,
      u.email as customer_email,
      COUNT(oi.order_item_id) as item_count
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    GROUP BY o.order_id, o.user_id, o.order_date, o.status, o.total_price, 
             o.delivery_address, u.username, u.email
    ORDER BY o.order_date DESC
    LIMIT ?
  `;

  db.query(sql, [parseInt(limit)], (err, results) => {
    if (err) {
      console.error("Error fetching recent orders:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

// Single endpoint to get all dashboard data at once
app.get("/admin/dashboard/summary", (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  // Get all dashboard data in parallel
  const queries = {
    todayStats: `
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_price), 0) as total_revenue,
        COUNT(DISTINCT user_id) as unique_customers,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders
      FROM orders 
      WHERE DATE(order_date) = ?
    `,
    menuStats: `
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available_items
      FROM food
    `,
    userCount: `SELECT COUNT(*) as total_users FROM users`,
    recentOrders: `
      SELECT 
        o.order_id, o.order_date, o.status, o.total_price,
        u.username as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC
      LIMIT 5
    `,
  };

  // Execute all queries
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queries.todayStats, [today], (err, results) => {
        if (err) reject(err);
        else resolve({ todayStats: results[0] });
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.menuStats, (err, results) => {
        if (err) reject(err);
        else resolve({ menuStats: results[0] });
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.userCount, (err, results) => {
        if (err) reject(err);
        else resolve({ userCount: results[0].total_users });
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.recentOrders, (err, results) => {
        if (err) reject(err);
        else resolve({ recentOrders: results });
      });
    }),
  ])
    .then((results) => {
      // Combine all results
      const summary = {
        todayStats: results[0].todayStats,
        menuStats: results[1].menuStats,
        userCount: results[2].userCount,
        recentOrders: results[3].recentOrders,
      };

      res.json(summary);
    })
    .catch((error) => {
      console.error("Error fetching dashboard summary:", error);
      res.status(500).json({ error: "Database error" });
    });
});

