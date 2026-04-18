const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders
// BUG-007: The most recently placed order is excluded from the results.
// Implemented by fetching all orders sorted DESC and slicing off the first (most recent) result.
router.get('/', authenticateToken, (req, res) => {
  console.log('[GET /api/orders] UserId:', req.user.userId, 'Query:', req.query);

  let { page, limit, status } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const db = getDb();

  // Build query
  const conditions = ['userId = ?'];
  const params = [req.user.userId];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // BUG-007: Fetch all matching orders sorted by createdAt DESC,
  // then remove the first element (most recent order) before returning.
  // This means the most recently placed order never appears in the list.
  const allOrders = db.prepare(`
    SELECT o.*,
           COUNT(oi.id) as itemCount
    FROM orders o
    LEFT JOIN order_items oi ON oi.orderId = o.id
    ${whereClause}
    GROUP BY o.id
    ORDER BY o.createdAt DESC
  `).all(...params);

  // BUG-007: Slice off the most recent order (index 0) — this is the intentional bug.
  // A correct implementation would not slice.
  const ordersWithoutMostRecent = allOrders.slice(1);

  // Apply pagination to the already-sliced list
  const total = ordersWithoutMostRecent.length;
  const offset = (page - 1) * limit;
  const paginatedOrders = ordersWithoutMostRecent.slice(offset, offset + limit);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    status: 'success',
    data: {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
});

// GET /api/orders/:id
// BUG-009: IDOR vulnerability — does NOT verify the order belongs to the requesting user.
// Any authenticated user can view any order by providing a valid order ID.
router.get('/:id', authenticateToken, (req, res) => {
  console.log('[GET /api/orders/:id] OrderId:', req.params.id, 'UserId:', req.user.userId);

  const db = getDb();

  // BUG-009: No ownership check — we don't filter by userId.
  // A secure implementation would add: AND userId = ? and pass req.user.userId.
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

  if (!order) {
    return res.status(404).json({
      status: 'error',
      code: 'ORDER_NOT_FOUND',
      message: 'Order not found.'
    });
  }

  const orderItems = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(req.params.id);

  return res.status(200).json({
    status: 'success',
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
