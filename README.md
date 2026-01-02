# 💰 SplitSmart - Expense Splitting Application
A full-stack MERN application for splitting expenses among groups of friends, roommates, or travel companions. Track shared expenses, calculate balances, and settle debts with ease
## 🌐 Live Demo
🚀 **Live Application URL:**  
https://smart-expense-splitter-1-chot.onrender.com/

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Frontend Documentation](#-frontend-documentation)
- [Backend Documentation](#-backend-documentation)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Functionality
| Feature | Description |
|---------|-------------|
| 👥 **Group Management** | Create groups, add/remove members, set currency |
| 💸 **Expense Tracking** | Log expenses with descriptions, categories, and amounts |
| ➗ **Smart Splitting** | Equal, percentage-based, or custom amount splits |
| 💳 **Settlement System** | Calculate optimal payments to settle all debts |
| 📜 **History & Audit** | Complete activity timeline and settlement history |

### Advanced Features
| Feature | Description |
|---------|-------------|
| 💱 **Multi-Currency** | Support for USD ($) and INR (₹) |
| 📊 **Reports & Export** | CSV export with date filtering |
| ↩️ **Undo Settlements** | Reverse accidental payments within 15 minutes |
| ⚠️ **Large Payment Alerts** | Confirmation dialog for settlements ≥$100 |
| 🌓 **Dark/Light Theme** | System-aware theme switching |
| 📱 **Responsive Design** | Mobile-first, works on all devices |

---

## 🛠 Tech Stack

### Frontend
```
React 18          → UI Framework
Vite              → Build Tool & Dev Server
Tailwind CSS      → Utility-First Styling
shadcn/ui         → Accessible Component Library
React Router v6   → Client-Side Routing
React Query       → Server State Management
React Hook Form   → Form Handling
Zod               → Schema Validation
Lucide Icons      → Icon Library
```

### Backend
```
Node.js           → JavaScript Runtime
Express.js        → Web Framework
MongoDB           → NoSQL Database
Mongoose          → ODM for MongoDB
JWT               → Authentication Tokens
bcryptjs          → Password Hashing
CORS              → Cross-Origin Resource Sharing
```

---

## 📁 Project Structure

```
splitsmart/
├── 📂 src/                      # Frontend source code
│   ├── 📂 components/           # Reusable UI components
│   │   ├── 📂 ui/              # shadcn base components
│   │   ├── ExpenseForm.tsx     # Create/edit expenses
│   │   ├── SettlementCard.tsx  # Settlement with animations
│   │   ├── SettlementHistory.tsx
│   │   ├── BalanceSummary.tsx  # Member balance display
│   │   ├── MemberList.tsx      # Group member management
│   │   ├── ActivityTimeline.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── CSVExport.tsx       # Export functionality
│   │   ├── ThemeToggle.tsx     # Dark/light mode
│   │   ├── NavLink.tsx
│   │   └── ProtectedRoute.tsx  # Auth guard
│   │
│   ├── 📂 pages/               # Route components
│   │   ├── Index.tsx           # Landing page
│   │   ├── Login.tsx           # User login
│   │   ├── Signup.tsx          # User registration
│   │   ├── Dashboard.tsx       # Groups overview
│   │   ├── GroupDetail.tsx     # Single group view
│   │   ├── Reports.tsx         # Analytics & export
│   │   ├── Profile.tsx         # User settings
│   │   └── NotFound.tsx        # 404 page
│   │
│   ├── 📂 contexts/            # React contexts
│   │   └── AuthContext.tsx     # Authentication state
│   │
│   ├── 📂 hooks/               # Custom React hooks
│   │   ├── use-toast.ts        # Toast notifications
│   │   └── use-mobile.tsx      # Mobile detection
│   │
│   ├── 📂 lib/                 # Utilities & configs
│   │   ├── api.ts              # API client & types
│   │   ├── validations.ts      # Zod schemas
│   │   ├── categories.ts       # Expense categories
│   │   └── utils.ts            # Helper functions
│   │
│   ├── App.tsx                 # Root component & routes
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles & tokens
│
├── 📂 backend/                  # Backend source code
│   ├── 📂 src/
│   │   ├── index.js            # Server entry point
│   │   ├── 📂 models/          # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Group.js
│   │   │   ├── Expense.js
│   │   │   ├── Settlement.js
│   │   │   └── Activity.js
│   │   ├── 📂 routes/          # API route handlers
│   │   │   ├── auth.js
│   │   │   ├── groups.js
│   │   │   ├── expenses.js
│   │   │   ├── settlements.js
│   │   │   └── users.js
│   │   └── 📂 middleware/      # Express middleware
│   │       ├── auth.js         # JWT verification
│   │       └── validate.js     # Request validation
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── 📂 public/                   # Static assets
├── tailwind.config.ts          # Tailwind configuration
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config
└── package.json                # Frontend dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ ([Install with nvm](https://github.com/nvm-sh/nvm))
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** 

### Installation

#### 1. Clone the Repository
```bash
git clone <YOUR_GIT_URL>
cd splitsmart
```

#### 2. Setup Backend
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

#### 3. Setup Frontend
```bash
# Return to root directory
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🎨 Frontend Documentation

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    AuthProvider                         ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                 BrowserRouter                       │││
│  │  │  ┌─────────────────┐  ┌─────────────────────────┐   │││
│  │  │  │  Public Routes  │  │    Protected Routes     │   │││
│  │  │  │  - Index        │  │  - Dashboard            │   │││
│  │  │  │  - Login        │  │  - GroupDetail          │   │││
│  │  │  │  - Signup       │  │  - Reports              │   │││
│  │  │  │                 │  │  - Profile              │   │││
│  │  │  └─────────────────┘  └─────────────────────────┘   │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```


### 🔑 Authentication Routes

#### `POST /api/auth/signup`
Create a new user account.


#### `POST /api/auth/login`
Authenticate user and get JWT token.

---
### 👥 Groups Routes

#### `GET /api/groups`
Get all groups for authenticated user.



#### `GET /api/groups/:id`
Get single group with full details.


#### `POST /api/groups`
Create a new group.

#### `PUT /api/groups/:id`
Update group details.

#### `DELETE /api/groups/:id`
Delete a group and all associated data.


#### `POST /api/groups/:id/members`
Add a member to group.

#### `DELETE /api/groups/:id/members/:memberName`
Remove member from group.

---
### 💸 Expenses Routes

#### `GET /api/expenses/group/:groupId`
Get all expenses for a group.


#### `POST /api/expenses/group/:groupId`
Create a new expense.

#### `PUT /api/expenses/:id`
Update an expense.

#### `DELETE /api/expenses/:id`
Delete an expense.

---
### 💳 Settlements Routes

#### `GET /api/settlements/group/:groupId`
Calculate optimal settlements (who owes whom).

#### `POST /api/settlements/group/:groupId/settle`
Record a settlement payment.


#### `GET /api/settlements/group/:groupId/history`
Get settlement history.

#### `DELETE /api/settlements/:settlementId`
Undo a settlement (within 15 minutes).

---
### 👤 Users Routes

#### `GET /api/users/me`
Get current user profile.

#### `PUT /api/users/me`
Update user profile.

#### `PUT /api/users/me/password`
Change password.

---
## 🗄 Database Models

### User Schema


### Group Schema


### Expense Schema

### Settlement Schema

---
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
## ⚙️ Backend Documentation

### Server Architecture

```
HTTP Request
     │
     ▼
┌─────────────────┐
│   Express App   │
│   (index.js)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     CORS        │  ← Allow frontend origins
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JSON Parser    │  ← Parse request body
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │  ← /api/auth, /api/groups, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auth Middleware │  ← Verify JWT token
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validation     │  ← Validate request data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Route Handler   │  ← Business logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Mongoose Model  │  ← Database operations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │  ← Data persistence
└─────────────────┘
```


## 🗄 Database Schema

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │      Group      │
├─────────────────┤       ├─────────────────┤
│ _id             │───┐   │ _id             │
│ name            │   │   │ name            │
│ email           │   └──►│ createdBy       │
│ password        │       │ members[]       │
│ createdAt       │       │ currency        │
└─────────────────┘       └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │   Expense   │  │ Settlement  │  │  Activity   │
          ├─────────────┤  ├─────────────┤  ├─────────────┤
          │ _id         │  │ _id         │  │ _id         │
          │ groupId     │  │ groupId     │  │ groupId     │
          │ description │  │ from        │  │ type        │
          │ amount      │  │ to          │  │ description │
          │ category    │  │ amount      │  │ createdAt   │
          │ paidBy      │  │ createdAt   │  └─────────────┘
          │ splitType   │  └─────────────┘
          │ splits{}    │
          │ createdAt   │
          └─────────────┘
```

---

## 🔒 Security

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Server  │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │ POST /signup   │                │
     │───────────────►│                │
     │                │ Hash password  │
     │                │───────────────►│
     │                │                │
     │                │ Create user    │
     │                │◄───────────────│
     │                │                │
     │  JWT Token     │                │
     │◄───────────────│                │
     │                │                │
     │ GET /groups    │                │
     │ + Bearer Token │                │
     │───────────────►│                │
     │                │ Verify JWT     │
     │                │                │
     │                │ Query DB       │
     │                │───────────────►│
     │                │                │
     │  Groups Data   │◄───────────────│
     │◄───────────────│                │
```

### Security Measures

| Layer | Implementation |
|-------|----------------|
| **Passwords** | bcrypt hashing with salt |
| **Tokens** | JWT with expiration |
| **Validation** | Zod schemas (client + server) |
| **CORS** | Whitelisted origins only |
| **Authorization** | Users can only access own data |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Made By ❤️  Anil Kumar
</p>
