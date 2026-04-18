const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'shopsmart.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    createTables();
  }
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stockCount INTEGER NOT NULL DEFAULT 0,
      imageUrl TEXT NOT NULL,
      rating REAL DEFAULT 4.0,
      reviewCount INTEGER DEFAULT 0,
      sku TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cartId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (cartId) REFERENCES carts(id),
      FOREIGN KEY (productId) REFERENCES products(id),
      UNIQUE(cartId, productId)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      subtotal REAL NOT NULL,
      shipping REAL NOT NULL DEFAULT 5.99,
      total REAL NOT NULL,
      shippingAddress TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      lineTotal REAL NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    );
  `);
}

function isSeeded() {
  const database = getDb();
  const row = database.prepare('SELECT COUNT(*) as count FROM products').get();
  return row.count > 0;
}

module.exports = { getDb, isSeeded };
