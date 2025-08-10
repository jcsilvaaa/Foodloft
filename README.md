# FoodLoft - Restaurant Management System

A comprehensive web-based restaurant management system built with Node.js, Express, and MySQL. FoodLoft provides complete order management, user administration, and sales analytics for restaurant operations.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Admin Features](#admin-features)
- [Customer Features](#customer-features)
- [File Structure](#file-structure)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Features

### **Admin Dashboard**
- Real-time sales analytics (only completed orders count toward revenue)
- Order management with status tracking (7-stage order lifecycle)
- User management system
- Menu management with image uploads
- Dynamic dashboard statistics

### **Order Management System**
- **Order Statuses**: `pending` → `confirmed` → `preparing` → `ready` → `delivered` → `completed` / `cancelled`
- Real-time order status updates via dropdown interface
- Order history with comprehensive filtering
- Manual order creation for walk-in customers
- Order item management with quantity and pricing

### **Menu Management**
- Food item management with categories
- Image upload support for menu items
- Price and quantity management
- Category-based organization

### **User System**
- Role-based access control (Admin/Customer)
- Profile management with avatar uploads
- User registration and authentication
- Contact information management

### **Sales Analytics**
- **Accurate Revenue Tracking**: Only completed orders count as sales
- Monthly sales reporting
- Recent transactions display
- Business performance metrics

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **File Upload**: Multer
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with responsive design
- **Database Connection**: MySQL2

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/foodloft.git
cd foodloft
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Database
1. Update database credentials in `server.js`:
```javascript
const db = mysql.createConnection({
  host: 'localhost',
  user: 'your-username',
  password: 'your-password',
  database: 'foodloft_db'
});
```

### Step 4: Setup Database
```bash
# Import database schema
mysql -u your-username -p foodloft_db < sql/foodloft_ph.sql

# Import sample data (optional)
mysql -u your-username -p foodloft_db < sql/sample_data.sql
```

### Step 5: Start the Server
```bash
node server.js
```

The application will be available at `http://localhost:3000`

## Database Setup

### Database Schema
The system uses the following main tables:
- `users` - User accounts and profiles
- `categories` - Food categories
- `food` - Menu items
- `orders` - Customer orders
- `order_items` - Order line items
- `cart` - Shopping cart items

### Order Status ENUM
```sql
order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled')
```

### Sample Data
The system includes comprehensive sample data:
- **3 Main Food Items**: Kikiam (₱100), Chinese Meatballs (₱300), Dumplings (₱200)
- **Multiple Users**: Admin and customer accounts
- **Sample Orders**: Various order statuses and timeframes for testing

## Usage

### Admin Access
1. Navigate to `http://localhost:3000/admin.html`
2. Login with admin credentials
3. Access dashboard, order management, and user management

### Customer Access
1. Navigate to `http://localhost:3000` (Homepage)
2. Browse menu and add items to cart
3. Proceed to checkout and place orders
4. View order history

### Default Admin Account
- **Username**: `foodloft_admin`
- **Password**: `admin123`
- **Email**: `admin@foodloft.com`

## API Documentation

### Order Management
```javascript
// Get all orders
GET /api/orders

// Update order status
PUT /api/orders/:orderId/status
Body: { status: "completed" }

// Create new order
POST /api/orders
Body: { user_id, items, delivery_address, total_price, customer_name }
```

### Sales Analytics
```javascript
// Get sales data (only completed orders)
GET /api/sales
Response: {
  total_sales: "15000.00",
  monthly_sales: "8500.00", 
  total_orders: 45,
  recent_transactions: [...]
}
```

### Menu Management
```javascript
// Get all food items
GET /api/food

// Add new food item
POST /api/food
Body: FormData with name, description, price, quantity, category, image

// Update food item
PUT /api/food/:id
```

### User Management
```javascript
// Get all users
GET /api/users

// Update user profile
POST /update-profile/:id
Body: FormData with user details and avatar
```

## 👨‍💼 Admin Features

### Dashboard
- **Total Sales**: Revenue from completed orders only
- **Pending Orders**: Orders awaiting processing
- **Total Users**: Registered customer count
- **Real-time Updates**: Dynamic data loading

### Order History Management
- View all orders with detailed information
- **Status Dropdown**: Change order status in real-time
- **Order Statuses**: 7-stage order lifecycle management
- Filter and search capabilities
- Create manual orders for walk-in customers

### User Management
- View all registered users
- Manage user roles and permissions
- User profile management

### Menu Management
- Add, edit, and delete menu items
- Upload food images
- Manage categories and pricing
- Inventory quantity tracking

## Customer Features

### Menu Browsing
- View available food items with images
- Category-based navigation
- Detailed food descriptions and pricing

### Shopping Cart
- Add/remove items from cart
- Quantity management
- Real-time total calculation

### Order Placement
- Checkout process with customer information
- Multiple payment methods
- Order confirmation

### Profile Management
- Update personal information
- Upload profile avatar
- View order history

## File Structure

```
foodloft/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── README.md                 # This file
│
├── sql/                      # Database files
│   ├── foodloft_ph.sql      # Main database schema
│   └── sample_data.sql      # Sample data for testing
│
├── uploads/                 # User uploaded files
│   ├── avatars/            # User profile pictures
│   └── food/               # Food item images
│
├── admin/                   # Admin interface
│   ├── admin.html          # Main dashboard
│   ├── admin.css           # Dashboard styling
│   ├── admin-order-history.html    # Order management
│   ├── admin-order-history.css     # Order management styling
│   ├── admin-sales.html            # Sales analytics
│   ├── admin-sales.css             # Sales page styling
│   └── admin-user.html             # User management
│
├── customer/               # Customer interface
│   ├── Homepage.html       # Main homepage
│   ├── Homepage.css        # Homepage styling
│   ├── menu.html          # Menu browsing
│   ├── menu.css           # Menu styling
│   ├── cart.html          # Shopping cart
│   ├── cart.css           # Cart styling
│   ├── Checkout.html      # Checkout process
│   ├── Checkout.css       # Checkout styling
│   └── order-history.html # Customer order history
│
├── auth/                  # Authentication
│   ├── login.html         # Login page
│   ├── login.css          # Login styling
│   ├── register.html      # Registration page
│   └── register.css       # Registration styling
│
├── profile/               # User profiles
│   ├── User.html          # User profile view
│   ├── User.css           # Profile styling
│   ├── editprofile.html   # Profile editing
│   └── editprofile.css    # Edit profile styling
│
└── assets/               # Static assets
    ├── images/           # Food and UI images
    └── fonts/            # Custom fonts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check if port 3000 is in use
netstat -an | findstr :3000

# Kill processes using port 3000
taskkill /F /PID <process_id>
```

#### Database Connection Issues
1. Verify MySQL is running
2. Check database credentials in `server.js`
3. Ensure database `foodloft_db` exists
4. Import the schema: `mysql -u root -p foodloft_db < sql/foodloft_ph.sql`

#### Foreign Key Constraint Errors
```sql
-- Clear existing data in correct order
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM cart;
-- Then reload sample data
```

#### Order Status Dropdown Not Working
1. Ensure server is running
2. Check browser console for JavaScript errors
3. Verify API endpoints are responding
4. Clear browser cache

### Sales Not Updating
- **Issue**: Sales showing incorrect totals
- **Solution**: Sales calculations now only count `completed` orders for accurate revenue reporting

### Food Selection Issues in Admin
- **Issue**: "Please ensure all food items have valid selections and quantities"
- **Solution**: Fixed API response field mapping from `food_id` to `id`

## Support

For support, please contact:
- **Email**: admin@foodloft.com
- **GitHub Issues**: [Create an issue](https://github.com/your-username/foodloft/issues)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- DLSU CCAPDEV Course
- Express.js and Node.js communities
- MySQL documentation and community
- Contributors and testers

---

**FoodLoft** - Streamlining restaurant operations with modern web technology!
