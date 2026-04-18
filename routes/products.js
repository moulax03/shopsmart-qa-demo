const express = require('express');
const { getDb } = require('../database/db');

const router = express.Router();

const VALID_SORT_VALUES = ['price_asc', 'price_desc', 'name_asc', 'name_desc'];

// GET /api/products
// BUG-014: price_asc and price_desc actually sort by name instead of price.
router.get('/', (req, res) => {
  console.log('[GET /api/products] Query:', req.query);

  let { page, limit, category, sort, search } = req.query;

  // Validate page
  page = parseInt(page) || 1;
  if (page < 1) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Page must be >= 1.'
    });
  }

  // Validate limit
  limit = parseInt(limit) || 12;
  if (limit < 1 || limit > 50) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Limit must be between 1 and 50.'
    });
  }

  // Validate sort
  if (sort && !VALID_SORT_VALUES.includes(sort)) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: `Sort must be one of: ${VALID_SORT_VALUES.join(', ')}.`
    });
  }

  const db = getDb();

  // Build WHERE clause
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category.toLowerCase());
  }

  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause
  // BUG-014: price_asc and price_desc sort by name instead of price
  let orderClause = 'ORDER BY name ASC'; // default
  if (sort === 'price_asc') {
    orderClause = 'ORDER BY name ASC';  // BUG-014: should be "ORDER BY price ASC"
  } else if (sort === 'price_desc') {
    orderClause = 'ORDER BY name DESC'; // BUG-014: should be "ORDER BY price DESC"
  } else if (sort === 'name_asc') {
    orderClause = 'ORDER BY name ASC';
  } else if (sort === 'name_desc') {
    orderClause = 'ORDER BY name DESC';
  }

  // Count total
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM products ${whereClause}`).get(...params);
  const total = countRow.total;

  // Fetch paginated products
  const offset = (page - 1) * limit;
  const products = db.prepare(`SELECT * FROM products ${whereClause} ${orderClause} LIMIT ? OFFSET ?`).all(...params, limit, offset);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    status: 'success',
    data: {
      products,
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

// GET /api/products/:id
router.get('/:id', (req, res) => {
  console.log('[GET /api/products/:id] ID:', req.params.id);

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

  if (!product) {
    return res.status(404).json({
      status: 'error',
      code: 'PRODUCT_NOT_FOUND',
      message: 'Product not found.'
    });
  }

  return res.status(200).json({
    status: 'success',
    data: { product }
  });
});

module.exports = router;
