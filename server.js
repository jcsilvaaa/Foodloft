const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL DB Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ccinfom123',
  database: 'foodloft_db'
});

db.connect(err => {
  if (err) {
    console.error('❌ DB connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL');
  }
});

// === Configure Multer for File Uploads ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to 'uploads' folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// === REGISTER ROUTE ===
app.post('/register', upload.single('avatar'), (req, res) => {
  const { username, email, password, description, full_name } = req.body;
  const avatar = req.file ? req.file.filename : null;
  
  const sql = 'INSERT INTO users (username, email, password, avatar, description, full_name) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [username, email, password, avatar, description, full_name], (err, result) => {
    if (err) {
      console.error('❌ Registration Error:', err);
      return res.status(500).json({ message: 'Registration failed.' });
    }

    res.status(200).json({ message: '🎉 Registered successfully!' });
  });
});

// === LOGIN ROUTE ===
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1';
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('❌ Login Error:', err);
      return res.status(500).json({ message: 'Server error during login.' });
    }

    if (results.length > 0) {
      const user = results[0];
      res.status(200).json({ message: '✅ Login successful!', user });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

// === ADD TO CART ROUTE ===
app.post('/cart', (req, res) => {
  const { user_id, food_id, quantity } = req.body;

  const sql = 'INSERT INTO cart (user_id, food_id, quantity) VALUES (?, ?, ?)';
  db.query(sql, [user_id, food_id, quantity], (err, result) => {
    if (err) {
      console.error('❌ Error adding to cart:', err);
      return res.status(500).json({ message: 'Failed to add to cart' });
    }
    res.status(200).json({ message: '🛒 Item added to cart' });
  });
});

// === GET CART ITEMS BY USER ===
app.get('/cart/:user_id', (req, res) => {
  const user_id = req.params.user_id;

  const sql = `
    SELECT cart.id AS cart_id, food_id, quantity, f.name, f.price, f.image
    FROM cart 
    JOIN food f ON cart.food_id = f.id 
    WHERE cart.user_id = ?
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching cart:', err);
      return res.status(500).json({ message: 'Failed to fetch cart items' });
    }
    res.status(200).json(results);
  });
});

// === DELETE SPECIFIC ITEM FROM CART ===
app.delete('/cart/:cart_id', (req, res) => {
  const cart_id = req.params.cart_id;

  const sql = 'DELETE FROM cart WHERE id = ?';
  db.query(sql, [cart_id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting cart item:', err);
      return res.status(500).json({ message: 'Failed to delete cart item' });
    }
    res.status(200).json({ message: '🗑️ Cart item deleted' });
  });
});

// === CLEAR ALL ITEMS FOR USER CART ===
app.delete('/cart/user/:user_id', (req, res) => {
  const user_id = req.params.user_id;

  const sql = 'DELETE FROM cart WHERE user_id = ?';
  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error('❌ Error clearing cart:', err);
      return res.status(500).json({ message: 'Failed to clear cart' });
    }
    res.status(200).json({ message: '🧹 Cart cleared for user' });
  });
});
