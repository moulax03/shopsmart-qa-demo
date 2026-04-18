# ShopSmart

A full-stack e-commerce demo application built for QA training. ShopSmart simulates a real online store with authentication, product browsing, shopping cart, checkout, and order management — intentional bugs included for student discovery.

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite via `better-sqlite3` (auto-created on first run)
- **Auth:** JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Frontend:** Pure HTML5 + CSS3 + Vanilla JavaScript (no build tools)

## Prerequisites

- Node.js 16 or higher
- npm 7 or higher

## Installation

```bash
npm install
```

## Start the Server

```bash
npm start
```

Open your browser at: **http://localhost:3001**

The database is automatically created and seeded on the first run. No extra setup is required.

## Manually Re-seed the Database

```bash
npm run seed
```

This will wipe and re-seed all users, products, and sample orders.

## Pre-seeded Accounts

Use these accounts to explore the app immediately after starting:

| Name | Email | Password |
|------|-------|----------|
| John Doe | john.doe@testshop.com | TestPass1! |
| Sara Lee | sara.lee@testshop.com | ShopTest2@ |
| Mike Brown | mike.brown@testshop.com | Brownie3# |

John Doe has 3 sample orders in his order history.

## Project Structure

```
Ecommerce_App/
├── package.json
├── server.js                     ← Express entry point (port 3001)
├── database/
│   ├── db.js                     ← SQLite connection + schema
│   └── seed.js                   ← Seed data (users, products, orders)
├── middleware/
│   └── auth.js                   ← JWT verification middleware
├── routes/
│   ├── auth.js                   ← Signup, login, forgot-password, change-password
│   ├── products.js               ← Product listing + detail
│   ├── cart.js                   ← Cart CRUD
│   ├── checkout.js               ← Place order
│   ├── orders.js                 ← Order history + detail
│   └── profile.js                ← View/update profile
├── public/                       ← Static frontend files
│   ├── index.html
│   ├── signup.html
│   ├── login.html
│   ├── forgot-password.html
│   ├── products.html
│   ├── product-detail.html
│   ├── cart.html
│   ├── checkout.html
│   ├── order-confirmation.html
│   ├── orders.html
│   ├── order-detail.html
│   ├── profile.html
│   ├── 404.html
│   ├── css/style.css
│   └── js/main.js
├── BUGS.md                       ← Instructor-only bug reference
└── README.md
```

## API Reference

**Base URL:** `http://localhost:3001/api`

All API responses follow the envelope format:
```json
{
  "status": "success" | "error",
  "message": "...",
  "data": { ... },
  "code": "ERROR_CODE"
}
```

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | No | Register new account |
| POST | /api/auth/login | No | Login, receive JWT |
| POST | /api/auth/forgot-password | No | Request password reset |
| POST | /api/auth/change-password | Yes | Change password |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/products | No | List products (pagination, filter, sort, search) |
| GET | /api/products/:id | No | Get single product |

Query params for listing: `page`, `limit` (max 50), `category`, `sort` (price_asc, price_desc, name_asc, name_desc), `search`

### Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/cart | Yes | Get cart with items and totals |
| POST | /api/cart/items | Yes | Add item to cart |
| PUT | /api/cart/items/:id | Yes | Update item quantity |
| DELETE | /api/cart/items/:id | Yes | Remove item from cart |

### Checkout

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/checkout | Yes | Place order, clears cart |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/orders | Yes | List user's orders |
| GET | /api/orders/:id | Yes | Get order detail |

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/profile | Yes | Get current user profile |
| PUT | /api/profile | Yes | Update profile (name, phone) |

## Postman Setup

1. Set a variable `base_url` = `http://localhost:3001`
2. After login, copy the `token` from the response
3. Set `Authorization` header to `Bearer {{token}}` on authenticated requests

Example login:
```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "john.doe@testshop.com",
  "password": "TestPass1!"
}
```

## Notes for Students

- The app intentionally contains bugs. Part of the exercise is discovering them through exploratory and scripted testing.
- All API requests and responses are logged to the server console.
- The SQLite database file (`shopsmart.db`) is created in the project root on first run.
- Product images use `placehold.co` placeholder URLs — no real images are needed.
- Payment processing is simulated only — no real transactions occur.
