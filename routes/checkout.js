const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const SHIPPING_COST = 5.99;

// POST /api/checkout
// BUG-006: Does NOT validate that shippingAddress is present.
// If missing, order is created with shippingAddress stored as "{}".
router.post('/', authenticateToken, (req, res) => {
  console.log('[POST /api/checkout] UserId:', req.user.userId, 'Body:', req.body);

  const { shippingAddress, payment } = req.body;

  // BUG-006: No validation that shippingAddress is present or has required fields.
  // A real implementation would check: if (!shippingAddress || !shippingAddress.address1) return 400.
  // We skip this entirely — missing shippingAddress just becomes {}.

  // Validate payment fields only if payment object is present
  if (payment) {
    const currentYear = new Date().getFullYear();
    const errors = {};

    if (!payment.cardNumber || !/^\d{16}$/.test(String(payment.cardNumber).replace(/\s/g, ''))) {
      errors.cardNumber = 'Card number must be exactly 16 digits.';
    }
    if (!payment.expiryYear || parseInt(payment.expiryYear) < currentYear) {
      errors.expiryYear = `Expiry year must be ${currentYear} or later.`;
    }
    if (!payment.cvv || !/^\d{3,4}$/.test(String(payment.cvv))) {
      errors.cvv = 'CVV must be 3 or 4 digits.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        status: 'error',
        code: 'PAYMENT_VALIDATION_ERROR',
        message: 'Payment information is invalid.',
        errors
      });
    }
  }

  const db = getDb();

  // Get cart
  const cart = db.prepare('SELECT * FROM carts WHERE userId = ?').get(req.user.userId);

  if (!cart) {
    return res.status(400).json({
      status: 'error',
      code: 'EMPTY_CART',
      message: 'Your cart is empty.'
    });
  }

  const cartItems = db.prepare(`
    SELECT ci.id, ci.productId, ci.quantity,
           p.name, p.price, p.stockCount
    FROM cart_items ci
    JOIN products p ON p.id = ci.productId
    WHERE ci.cartId = ?
  `).all(cart.id);

  if (cartItems.length === 0) {
    return res.status(400).json({
      status: 'error',
      code: 'EMPTY_CART',
      message: 'Your cart is empty.'
    });
  }

  // Calculate totals
  const subtotal = parseFloat(
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );
  const shipping = SHIPPING_COST;
  const total = parseFloat((subtotal + shipping).toFixed(2));

  // Create order
  const orderId = uuidv4();
  const createdAt = new Date().toISOString();

  // BUG-006: shippingAddress is stored as-is (even if undefined/null, it becomes "{}")
  const addressToStore = JSON.stringify(shippingAddress || {});

  db.prepare(`
    INSERT INTO orders (id, userId, status, subtotal, shipping, total, shippingAddress, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, req.user.userId, 'confirmed', subtotal, shipping, total, addressToStore, createdAt);

  // Insert order items
  const insertItem = db.prepare(`
    INSERT INTO order_items (id, orderId, productId, productName, quantity, unitPrice, lineTotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of cartItems) {
    const lineTotal = parseFloat((item.price * item.quantity).toFixed(2));
    insertItem.run(uuidv4(), orderId, item.productId, item.name, item.quantity, item.price, lineTotal);
  }

  // Clear cart
  db.prepare('DELETE FROM cart_items WHERE cartId = ?').run(cart.id);

  // Fetch the complete order to return
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(orderId);

  return res.status(201).json({
    status: 'success',
    message: 'Order placed successfully.',
    data: {
      order: {
        ...order,
        shippingAddress: JSON.parse(order.shippingAddress),
        items: orderItems
      }
    }
  });
});

module.exports = router;
