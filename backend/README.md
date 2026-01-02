# 🔧 SplitSmart Backend

Express.js + MongoDB REST API for the SplitSmart expense splitting application.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Models](#-database-models)
- [Middleware](#-middleware)
- [Error Handling](#-error-handling)
- [Deployment](#-deployment)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server (with hot reload)
npm run dev

# Start production server
npm start
```

The API will be running at `http://localhost:5000`

---

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/splitsmart
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/splitsmart

# JWT Configuration
JWT_SECRET=your-super-secret-key-minimum-32-characters

# Server Configuration
PORT=5000

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT signing (min 32 chars) |
| `PORT` | ❌ | Server port (default: 5000) |
| `FRONTEND_URL` | ❌ | Allowed CORS origin |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.js              # Application entry point
│   │   ├── Express setup
│   │   ├── MongoDB connection
│   │   ├── CORS configuration
│   │   └── Route mounting
│   │
│   ├── models/               # Mongoose schemas
│   │   ├── User.js           # User authentication model
│   │   ├── Group.js          # Group with members & currency
│   │   ├── Expense.js        # Expense with splits
│   │   ├── Settlement.js     # Payment records
│   │   └── Activity.js       # Audit log entries
│   │
│   ├── routes/               # API route handlers
│   │   ├── auth.js           # /api/auth/* - Login & signup
│   │   ├── groups.js         # /api/groups/* - Group CRUD
│   │   ├── expenses.js       # /api/expenses/* - Expense CRUD
│   │   ├── settlements.js    # /api/settlements/* - Payments
│   │   └── users.js          # /api/users/* - Profile
│   │
│   └── middleware/           # Express middleware
│       ├── auth.js           # JWT verification
│       └── validate.js       # Request validation
│
├── .env.example              # Environment template
├── package.json              # Dependencies & scripts
└── README.md                 # This file
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Header
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### 🔑 Authentication Routes

#### `POST /api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64abc123def456789",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "error": "User already exists"
}
```

---

#### `POST /api/auth/login`
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64abc123def456789",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### 👥 Groups Routes

#### `GET /api/groups`
Get all groups for authenticated user.

**Response (200):**
```json
[
  {
    "_id": "64def456ghi789012",
    "name": "Apartment Expenses",
    "members": ["Alice", "Bob", "Charlie"],
    "currency": "USD",
    "createdBy": "64abc123def456789",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

#### `GET /api/groups/:id`
Get single group with full details.

**Response (200):**
```json
{
  "_id": "64def456ghi789012",
  "name": "Apartment Expenses",
  "members": ["Alice", "Bob", "Charlie"],
  "currency": "USD",
  "createdBy": {
    "_id": "64abc123def456789",
    "name": "John Doe"
  },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

#### `POST /api/groups`
Create a new group.

**Request Body:**
```json
{
  "name": "Trip to Paris",
  "members": ["Alice", "Bob"],
  "currency": "USD"
}
```

**Response (201):**
```json
{
  "_id": "64xyz789abc012345",
  "name": "Trip to Paris",
  "members": ["Alice", "Bob"],
  "currency": "USD",
  "createdBy": "64abc123def456789",
  "createdAt": "2024-01-20T14:00:00.000Z"
}
```

---

#### `PUT /api/groups/:id`
Update group details.

**Request Body:**
```json
{
  "name": "Updated Group Name",
  "currency": "INR"
}
```

---

#### `DELETE /api/groups/:id`
Delete a group and all associated data.

**Response (200):**
```json
{
  "message": "Group deleted successfully"
}
```

---

#### `POST /api/groups/:id/members`
Add a member to group.

**Request Body:**
```json
{
  "memberName": "Diana"
}
```

---

#### `DELETE /api/groups/:id/members/:memberName`
Remove member from group.

**Response (200):**
```json
{
  "message": "Member removed successfully"
}
```

**Error (400) - Member has balance:**
```json
{
  "error": "Cannot remove member with non-zero balance"
}
```

---

### 💸 Expenses Routes

#### `GET /api/expenses/group/:groupId`
Get all expenses for a group.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `startDate` | ISO Date | Filter from date |
| `endDate` | ISO Date | Filter to date |
| `category` | String | Filter by category |

**Response (200):**
```json
[
  {
    "_id": "64exp123abc456",
    "description": "Dinner at Italian restaurant",
    "amount": 120.50,
    "category": "food",
    "paidBy": "Alice",
    "splitType": "equal",
    "splits": {
      "Alice": 40.17,
      "Bob": 40.17,
      "Charlie": 40.16
    },
    "createdAt": "2024-01-18T19:30:00.000Z"
  }
]
```

---

#### `POST /api/expenses/group/:groupId`
Create a new expense.

**Request Body (Equal Split):**
```json
{
  "description": "Groceries",
  "amount": 85.00,
  "category": "shopping",
  "paidBy": "Bob",
  "splitType": "equal",
  "splits": {
    "Alice": 28.33,
    "Bob": 28.33,
    "Charlie": 28.34
  }
}
```

**Request Body (Percentage Split):**
```json
{
  "description": "Utilities",
  "amount": 150.00,
  "category": "utilities",
  "paidBy": "Alice",
  "splitType": "percentage",
  "splits": {
    "Alice": 75.00,
    "Bob": 45.00,
    "Charlie": 30.00
  }
}
```

**Request Body (Custom Split):**
```json
{
  "description": "Movie tickets",
  "amount": 45.00,
  "category": "entertainment",
  "paidBy": "Charlie",
  "splitType": "custom",
  "splits": {
    "Alice": 15.00,
    "Bob": 15.00,
    "Charlie": 15.00
  }
}
```

---

#### `PUT /api/expenses/:id`
Update an expense.

---

#### `DELETE /api/expenses/:id`
Delete an expense.

**Response (200):**
```json
{
  "message": "Expense deleted successfully"
}
```

---

### 💳 Settlements Routes

#### `GET /api/settlements/group/:groupId`
Calculate optimal settlements (who owes whom).

**Response (200):**
```json
{
  "balances": {
    "Alice": 45.50,
    "Bob": -30.25,
    "Charlie": -15.25
  },
  "settlements": [
    {
      "from": "Bob",
      "to": "Alice",
      "amount": 30.25
    },
    {
      "from": "Charlie",
      "to": "Alice",
      "amount": 15.25
    }
  ]
}
```

---

#### `POST /api/settlements/group/:groupId/settle`
Record a settlement payment.

**Request Body:**
```json
{
  "from": "Bob",
  "to": "Alice",
  "amount": 30.25
}
```

**Response (201):**
```json
{
  "_id": "64set789xyz012",
  "groupId": "64def456ghi789012",
  "from": "Bob",
  "to": "Alice",
  "amount": 30.25,
  "createdAt": "2024-01-20T15:45:00.000Z"
}
```

---

#### `GET /api/settlements/group/:groupId/history`
Get settlement history.

**Response (200):**
```json
[
  {
    "_id": "64set789xyz012",
    "from": "Bob",
    "to": "Alice",
    "amount": 30.25,
    "createdAt": "2024-01-20T15:45:00.000Z"
  }
]
```

---

#### `DELETE /api/settlements/:settlementId`
Undo a settlement (within 15 minutes).

**Response (200):**
```json
{
  "message": "Settlement undone successfully"
}
```

**Error (400) - Time limit exceeded:**
```json
{
  "error": "Settlement can only be undone within 15 minutes"
}
```

---

### 👤 Users Routes

#### `GET /api/users/me`
Get current user profile.

**Response (200):**
```json
{
  "_id": "64abc123def456789",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-10T08:00:00.000Z"
}
```

---

#### `PUT /api/users/me`
Update user profile.

**Request Body:**
```json
{
  "name": "John Smith"
}
```

---

#### `PUT /api/users/me/password`
Change password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

---

## 🗄 Database Models

### User Schema
```javascript
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing pre-save hook
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
```

### Group Schema
```javascript
const groupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  members: [{
    type: String,
    required: true
  }],
  currency: {
    type: String,
    enum: ['USD', 'INR'],
    default: 'USD'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

### Expense Schema
```javascript
const expenseSchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    default: 'other'
  },
  paidBy: {
    type: String,
    required: true
  },
  splitType: {
    type: String,
    enum: ['equal', 'percentage', 'custom'],
    default: 'equal'
  },
  splits: {
    type: Map,
    of: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

### Settlement Schema
```javascript
const settlementSchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

---

## 🛡 Middleware

### Auth Middleware (`auth.js`)
```javascript
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Validation Middleware (`validate.js`)
```javascript
const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body);
    next();
  } catch (error) {
    res.status(400).json({ 
      error: 'Validation failed',
      details: error.errors 
    });
  }
};
```

---

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "error": "Error message here",
  "details": {} // Optional additional info
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (auth required) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🚢 Deployment

### Environment Setup
1. Set up MongoDB Atlas cluster
2. Configure environment variables on hosting platform
3. Ensure `FRONTEND_URL` matches production domain

### Recommended Platforms
- **Render** - Easy Node.js deployment
- **Railway** - Simple with MongoDB add-on
- **Heroku** - Classic option
- **DigitalOcean App Platform**

### Production Checklist
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Enable HTTPS
- [ ] Set proper CORS origins
- [ ] Add rate limiting
- [ ] Enable logging

---

## 📜 Scripts

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

---

<p align="center">
  Made with ❤️ for SplitSmart
</p>
