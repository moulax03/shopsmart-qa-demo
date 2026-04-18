const express = require('express');
const { getDb } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50 && /^[a-zA-Z\s\-']+$/.test(trimmed);
}

// GET /api/profile
router.get('/', authenticateToken, (req, res) => {
  console.log('[GET /api/profile] UserId:', req.user.userId);

  const db = getDb();
  const user = db.prepare('SELECT id, firstName, lastName, email, phone, createdAt FROM users WHERE id = ?').get(req.user.userId);

  if (!user) {
    return res.status(404).json({
      status: 'error',
      code: 'USER_NOT_FOUND',
      message: 'User not found.'
    });
  }

  return res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// PUT /api/profile
// BUG-008: Phone number validation is completely skipped.
// Any string is accepted as a phone number, including "abc-not-valid", "123", "".
router.put('/', authenticateToken, (req, res) => {
  console.log('[PUT /api/profile] UserId:', req.user.userId, 'Body:', req.body);

  const { firstName, lastName, phone } = req.body;
  const errors = {};

  if (firstName !== undefined && !validateName(firstName)) {
    errors.firstName = 'First name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.';
  }
  if (lastName !== undefined && !validateName(lastName)) {
    errors.lastName = 'Last name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.';
  }

  // BUG-008: No phone validation. A real implementation would check:
  // if (phone && !/^\+?[\d\s\-().]{7,20}$/.test(phone)) { errors.phone = '...'; }
  // We intentionally skip all phone validation here.

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Please fix the validation errors.',
      errors
    });
  }

  const db = getDb();
  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);

  if (!currentUser) {
    return res.status(404).json({
      status: 'error',
      code: 'USER_NOT_FOUND',
      message: 'User not found.'
    });
  }

  const updatedFirstName = firstName !== undefined ? firstName.trim() : currentUser.firstName;
  const updatedLastName = lastName !== undefined ? lastName.trim() : currentUser.lastName;
  // BUG-008: phone is stored exactly as provided, with no format validation
  const updatedPhone = phone !== undefined ? phone : currentUser.phone;

  db.prepare('UPDATE users SET firstName = ?, lastName = ?, phone = ? WHERE id = ?').run(
    updatedFirstName, updatedLastName, updatedPhone, req.user.userId
  );

  const updatedUser = db.prepare('SELECT id, firstName, lastName, email, phone, createdAt FROM users WHERE id = ?').get(req.user.userId);

  return res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully.',
    data: { user: updatedUser }
  });
});

module.exports = router;
