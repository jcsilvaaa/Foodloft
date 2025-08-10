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
app.use(express.static(path.join(__dirname)));
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
  password: '',
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
// ✅ ROOT ROUTE
// ============================

// ✅ Serve homepage at root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Homepage.html'));
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

// ✅ Login Route with role-based redirect
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  } 

  const sql = 'SELECT user_id, username, email, role FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('❌ Login Error:', err);
      return res.status(500).json({ message: 'Login failed' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    // Redirect based on role
    let redirectTo = '';
    if (user.role === 'admin') {
      redirectTo = '/admin.html';
    } else if (user.role === 'customer') {
      redirectTo = '/homepage.html';
    } else {
      return res.status(403).json({ message: 'Unknown user role' });
    }

    res.json({
      message: '✅ Login successful',
      user,
      redirectTo
    });
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
      city, state, zip, phone_number, email_address, additional_info, payment_method, total_amount, order_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const orderValues = [
    user_id, first_name, last_name, company_name, country_region, street_address,
    city, state, zip, phone_number, email_address, additional_info, payment_method, total_amount, 'pending',
    new Date() // `created_at`
  ];

  db.query(orderQuery, orderValues, (orderErr, orderResult) => {
    if (orderErr) {
      console.error('Order insert failed:', orderErr);
      return res.status(500).json({ message: 'Failed to place order', error: orderErr.message });
    }

    const order_id = orderResult.insertId;

    // Validate cart items before inserting
    const validCartItems = cartItems.filter(item => 
      item.food_id && 
      !isNaN(parseInt(item.food_id)) && 
      parseInt(item.food_id) > 0 &&
      item.quantity && 
      !isNaN(parseInt(item.quantity)) && 
      parseInt(item.quantity) > 0 &&
      item.price && 
      !isNaN(parseFloat(item.price)) && 
      parseFloat(item.price) > 0
    );

    if (validCartItems.length === 0) {
      return res.status(400).json({ message: 'No valid items in cart' });
    }

    const itemValues = validCartItems.map(item => [order_id, parseInt(item.food_id), parseInt(item.quantity), parseFloat(item.price)]);
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

// ============================
// ✅ ADMIN ORDER MANAGEMENT ROUTES
// ============================

// Test endpoint to check database structure
app.get('/api/db-test', (req, res) => {
  // Check if order_items table exists first
  db.query('SHOW TABLES', (err, tables) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    const tableNames = tables.map(t => t[Object.keys(t)[0]]);
    
    if (!tableNames.includes('order_items')) {
      return res.json({
        message: 'order_items table does not exist',
        available_tables: tableNames,
        orders_columns: 'Will check orders table structure...'
      });
    }
    
    // If order_items exists, get its structure
    Promise.all([
      new Promise((resolve, reject) => {
        db.query('SHOW COLUMNS FROM orders', (err, results) => {
          if (err) reject(err);
          else resolve({ table: 'orders', columns: results });
        });
      }),
      new Promise((resolve, reject) => {
        db.query('SHOW COLUMNS FROM order_items', (err, results) => {
          if (err) reject(err);
          else resolve({ table: 'order_items', columns: results });
        });
      })
    ])
    .then(results => {
      res.json({
        available_tables: tableNames,
        table_structures: results
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Database error', details: err.message });
    });
  });
});

// Get all orders (for order history) - using actual order_status column
app.get('/api/orders', (req, res) => {
  const sql = `
    SELECT 
      o.order_id,
      o.user_id,
      o.created_at as order_date,
      o.order_status as status,
      o.total_amount as total_price,
      CONCAT(o.street_address, ', ', o.city) as delivery_address,
      CONCAT(o.first_name, ' ', o.last_name) as customer_name,
      CONCAT('₱', CAST(o.total_amount AS CHAR), ' order from ', o.city) as items
    FROM orders o
    ORDER BY o.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(results);
  });
});

// Update order status endpoint
app.put('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }
  
  const query = 'UPDATE orders SET order_status = ? WHERE order_id = ?';
  
  db.query(query, [status, orderId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update order status' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ 
      message: 'Order status updated successfully',
      orderId: orderId,
      newStatus: status
    });
  });
});



// Get sales data
app.get('/api/sales', (req, res) => {
  const salesQueries = [
    // Total sales - only count completed orders
    'SELECT SUM(total_amount) as total_sales FROM orders WHERE order_status = "completed"',
    
    // Monthly sales (current month) - only count completed orders
    `SELECT SUM(total_amount) as monthly_sales 
     FROM orders 
     WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
     AND YEAR(created_at) = YEAR(CURRENT_DATE())
     AND order_status = "completed"`,
    
    // Total completed orders
    'SELECT COUNT(*) as total_orders FROM orders WHERE order_status = "completed"',
    
    // Recent transactions - only show completed orders
    `SELECT 
       o.order_id,
       CONCAT(o.first_name, ' ', o.last_name) as customer_name,
       o.created_at as order_date,
       o.total_amount as total_price
     FROM orders o
     WHERE o.order_status = "completed"
     ORDER BY o.created_at DESC
     LIMIT 10`
  ];
  
  Promise.all(salesQueries.map(query => {
    return new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }))
  .then(([totalSales, monthlySales, totalOrders, recentTransactions]) => {
    res.json({
      total_sales: totalSales[0].total_sales || 0,
      monthly_sales: monthlySales[0].monthly_sales || 0,
      total_orders: totalOrders[0].total_orders || 0,
      recent_transactions: recentTransactions
    });
  })
  .catch(err => {
    console.error('Error fetching sales data:', err);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  });
});

// Add new order (manual admin order) - simplified without order_items table
app.post('/api/orders', (req, res) => {
  const { user_id, items, delivery_address, total_price, customer_name } = req.body;
  
  if (!total_price || !customer_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Parse customer name
  const nameParts = customer_name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const orderQuery = `
    INSERT INTO orders (
      user_id, first_name, last_name, company_name, country_region, street_address,
      city, state, zip, phone_number, email_address, additional_info, payment_method, total_amount, order_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  
  const orderValues = [
    user_id || 1, firstName, lastName, '', 'Philippines', delivery_address || 'Admin Created Order',
    'Manila', 'NCR', '1000', '09123456789', 'admin@foodloft.com', 'Created by admin', 'Cash', total_price, 'pending'
  ];
  
  db.query(orderQuery, orderValues, (err, orderResult) => {
    if (err) {
      console.error('Error creating order:', err);
      return res.status(500).json({ error: 'Failed to create order' });
    }
    
    const order_id = orderResult.insertId;
    
    // Add order items to order_items table
    if (items && items.length > 0) {
      // Validate items before inserting
      const validItems = items.filter(item => 
        item.food_id && 
        !isNaN(parseInt(item.food_id)) && 
        parseInt(item.food_id) > 0 &&
        item.quantity && 
        !isNaN(parseInt(item.quantity)) && 
        parseInt(item.quantity) > 0 &&
        item.price && 
        !isNaN(parseFloat(item.price)) && 
        parseFloat(item.price) > 0
      );
      
      if (validItems.length === 0) {
        return res.status(400).json({ error: 'No valid items provided' });
      }
      
      const orderItemsQuery = 'INSERT INTO order_items (order_id, food_id, quantity, price) VALUES ?';
      const orderItemsValues = validItems.map(item => [
        order_id,
        parseInt(item.food_id),
        parseInt(item.quantity),
        parseFloat(item.price)
      ]);
      
      db.query(orderItemsQuery, [orderItemsValues], (itemsErr) => {
        if (itemsErr) {
          console.error('Error adding order items:', itemsErr);
          return res.status(500).json({ error: 'Failed to add order items' });
        }
        
        res.json({ message: 'Order created successfully', order_id: order_id });
      });
    } else {
      res.json({ message: 'Order created successfully (no items)', order_id: order_id });
    }
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


// BELOW IS ALL ADMIN PART 



// ============================
// FOOD ROUTES
// ============================

// Helper: get or create category by name, returns Promise of category_id
function getCategoryIdByName(name) {
  return new Promise((resolve, reject) => {
    if (!name) return resolve(null);
    db.query('SELECT category_id FROM categories WHERE name = ?', [name], (err, results) => {
      if (err) return reject(err);
      if (results.length > 0) {
        resolve(results[0].category_id);
      } else {
        // Create category if not found
        db.query('INSERT INTO categories (name) VALUES (?)', [name], (err2, result2) => {
          if (err2) return reject(err2);
          resolve(result2.insertId);
        });
      }
    });
  });
}

// GET all food with category name and id as 'id'
app.get('/api/food', (req, res) => {
  const sql = `
    SELECT f.food_id AS id, f.name, f.description, f.price, f.image, f.quantity, c.name AS category
    FROM food f
    LEFT JOIN categories c ON f.category_id = c.category_id
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch food' });
    res.json(results);
  });
});

// POST add new food (with image upload)
app.post('/api/food', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !description || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const category_id = await getCategoryIdByName(category);

    const sql = `
      INSERT INTO food (name, description, price, quantity, image, category_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [name, description, price, quantity, image, category_id], (err, result) => {
      if (err) {
        console.error('Error inserting food:', err);
        return res.status(500).json({ error: 'Failed to add product' });
      }
      res.status(201).json({ message: 'Product added', id: result.insertId });
    });
  } catch (err) {
    console.error('Error in POST /api/food:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update food item (no image update)
app.put('/api/food/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity, category } = req.body;

  // Validate required fields
  if (!name || !description || !price || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  getCategoryIdByName(category)
    .then(category_id => {
      const sql = `
        UPDATE food SET name = ?, description = ?, price = ?, quantity = ?, category_id = ?
        WHERE food_id = ?
      `;
      db.query(sql, [name, description, price, quantity, category_id, id], (err, result) => {
        if (err) {
          console.error('Error updating food:', err);
          return res.status(500).json({ error: 'Failed to update product' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated' });
      });
    })
    .catch(err => {
      console.error('Error fetching category:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Delete Product
async function deleteProduct(id) {
  if (!id) {
    alert("❌ Invalid product ID");
    return;
  }

  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("🗑 Product deleted.");
      loadProducts();
    } else {
      const data = await res.json();
      alert("❌ Error: " + (data.error || "Failed to delete product"));
    }
  } catch (err) {
    console.error(err);
    alert("❌ Failed to delete product.");
  }
}


// ============================
// USERS ROUTES
// ============================

// GET all users (only selected fields)
app.get('/api/users', (req, res) => {
  const sql = 'SELECT user_id, full_name, email, role FROM users';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(results);
  });
});

// POST add new user (with plain password)
app.post('/api/users', (req, res) => {
  const { full_name, email, role, password, address, contact_number } = req.body;
  if (!full_name || !email || !role || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create username from email prefix
  const username = email.split('@')[0];

  const sql = `INSERT INTO users (username, password, email, full_name, role, address, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [username, password, email, full_name, role, address || null, contact_number || null], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to add user' });
    }
    res.status(201).json({ message: 'User added', user_id: result.insertId });
  });
});

// PUT update user
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, password, address, contact_number } = req.body;
  if (!full_name || !email || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Update including password only if provided
  let sql, params;
  if (password) {
    sql = `UPDATE users SET full_name = ?, email = ?, role = ?, password = ?, address = ?, contact_number = ? WHERE user_id = ?`;
    params = [full_name, email, role, password, address || null, contact_number || null, id];
  } else {
    sql = `UPDATE users SET full_name = ?, email = ?, role = ?, address = ?, contact_number = ? WHERE user_id = ?`;
    params = [full_name, email, role, address || null, contact_number || null, id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update user' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated' });
  });
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE user_id = ?', [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  });
});

app.delete('/api/food/:id', (req, res) => {
  const foodId = req.params.id;

  // Delete related order_items
  db.query('DELETE FROM order_items WHERE food_id = ?', [foodId], (err) => {
    if (err) {
      console.error('Error deleting order items:', err);
      return res.status(500).json({ error: 'Failed to delete related order items' });
    }

    // Delete related cart items
    db.query('DELETE FROM cart WHERE food_id = ?', [foodId], (err) => {
      if (err) {
        console.error('Error deleting cart items:', err);
        return res.status(500).json({ error: 'Failed to delete related cart items' });
      }

      // Finally, delete the food product
      db.query('DELETE FROM food WHERE food_id = ?', [foodId], (err, result) => {
        if (err) {
          console.error('Error deleting product:', err);
          return res.status(500).json({ error: 'Failed to delete product' });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted' });
      });
    });
  });
});
