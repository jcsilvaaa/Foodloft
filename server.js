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
  password: '_Sideswipe21',
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
  
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
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