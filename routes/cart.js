const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const SHIPPING_COST = 5.99;

function getOrCreateCart(db, userId) {
  let cart = db.prepare('SELECT * FROM carts WHERE userId = ?').get(userId);
  if (!cart) {
    const cartId = uuidv4();
    db.prepare('INSERT INTO carts (id, userId) VALUES (?, ?)').run(cartId, userId);
    cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(cartId);
  }
  return cart;
}

function buildCartResponse(db, cartId) {
  const items = db.prepare(`
    SELECT ci.id, ci.cartId, ci.productId, ci.quantity,
           p.name, p.price, p.imageUrl, p.stockCount, p.category
    FROM cart_items ci
    JOIN products p ON p.id = ci.productId
    WHERE ci.cartId = ?
  `).all(cartId);

  const enrichedItems = items.map(item => ({
    ...item,
    lineTotal: parseFloat((item.price * item.quantity).toFixed(2))
  }));

  const subtotal = parseFloat(enrichedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const shipping = enrichedItems.length > 0 ? SHIPPING_COST : 0;
  const total = parseFloat((subtotal + shipping).toFixed(2));

  return {
    cartId,
    items: enrichedItems,
    subtotal,
    shipping,
    total,
    itemCount: enrichedItems.reduce((sum, item) => sum + item.quantity, 0)
  };
}

// GET /api/cart
router.get('/', authenticateToken, (req, res) => {
  console.log('[GET /api/cart] UserId:', req.user.userId);

  const db = getDb();
  const cart = getOrCreateCart(db, req.user.userId);
  const cartData = buildCartResponse(db, cart.id);

  return res.status(200).json({
    status: 'success',
    data: cartData
  });
});

// POST /api/cart/items
// BUG-004: Accepts quantity: 0 without validation error.
router.post('/items', authenticateToken, (req, res) => {
  console.log('[POST /api/cart/items] UserId:', req.user.userId, 'Body:', req.body);

  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'productId is required.'
    });
  }

  // BUG-004: No check for quantity <= 0. A real implementation would reject quantity: 0.
  // We only check that quantity is a number (or default to 1), but we allow 0.
  const qty = parseInt(quantity);
  if (isNaN(qty)) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Quantity must be a number.'
    });
  }
  // BUG-004: Missing: if (qty <= 0) return 400 error

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  if (!product) {
    return res.status(404).json({
      status: 'error',
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product not found.'
    });
  }

  // For quantity >= 1: check stock
  if (qty >= 1 && product.stockCount < qty) {
    return res.status(400).json({
      status: 'error',
      code: 'INSUFFICIENT_STOCK',
      message: `Only ${product.stockCount} items available in stock.`
    });
  }

  const cart = getOrCreateCart(db, req.user.userId);

  // Check if item already in cart
  const existingItem = db.prepare('SELECT * FROM cart_items WHERE cartId = ? AND productId = ?').get(cart.id, productId);

  if (existingItem) {
    // Merge: increment quantity
    const newQty = existingItem.quantity + qty;
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existingItem.id);
  } else {
    // Add new item
    db.prepare('INSERT INTO cart_items (id, cartId, productId, quantity) VALUES (?, ?, ?, ?)').run(
      uuidv4(), cart.id, productId, qty
    );
  }

  const cartData = buildCartResponse(db, cart.id);

  return res.status(200).json({
    status: 'success',
    message: 'Item added to cart.',
    data: cartData
  });
});

// PUT /api/cart/items/:id
router.put('/items/:id', authenticateToken, (req, res) => {
  console.log('[PUT /api/cart/items/:id] ItemId:', req.params.id, 'Body:', req.body);

  const { quantity } = req.body;
  const qty = parseInt(quantity);

  if (isNaN(qty)) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Quantity must be a number.'
    });
  }

  const db = getDb();
  const item = db.prepare(`
    SELECT ci.*, c.userId
    FROM cart_items ci
    JOIN carts c ON c.id = ci.cartId
    WHERE ci.id = ?
  `).get(req.params.id);

  if (!item) {
    return res.status(404).json({
      status: 'error',
      code: 'ITEM_NOT_FOUND',
      message: 'Cart item not found.'
    });
  }

  if (item.userId !== req.user.userId) {
    return res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN',
      message: 'You do not have permission to modify this cart item.'
    });
  }

  if (qty <= 0) {
    // Remove the item
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, req.params.id);
  }

  const cart = db.prepare('SELECT * FROM carts WHERE userId = ?').get(req.user.userId);
  const cartData = buildCartResponse(db, cart.id);

  return res.status(200).json({
    status: 'success',
    message: 'Cart updated.',
    data: cartData
  });
});

// DELETE /api/cart/items/:id
// BUG-012: Returns 200 even when the cart item ID doesn't exist.
router.delete('/items/:id', authenticateToken, (req, res) => {
  console.log('[DELETE /api/cart/items/:id] ItemId:', req.params.id);

  const db = getDb();
  const item = db.prepare(`
    SELECT ci.*, c.userId
    FROM cart_items ci
    JOIN carts c ON c.id = ci.cartId
    WHERE ci.id = ?
  `).get(req.params.id);

  // BUG-012: If item doesn't exist, we still return 200 success instead of 404.
  if (!item) {
    // BUG-012: Should return 404 here, but we return 200 instead.
    return res.status(200).json({
      status: 'success',
      message: 'Item removed from cart.'
    });
  }

  // If item exists but belongs to another user, return 403.
  if (item.userId !== req.user.userId) {
    return res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN',
      message: 'You do not have permission to remove this cart item.'
    });
  }

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);

  const cart = db.prepare('SELECT * FROM carts WHERE userId = ?').get(req.user.userId);
  const cartData = buildCartResponse(db, cart.id);

  return res.status(200).json({
    status: 'success',
    message: 'Item removed from cart.',
    data: cartData
  });
});

module.exports = router;
