const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Validation helpers
function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50 && /^[a-zA-Z\s\-']+$/.test(trimmed);
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  console.log('[POST /api/auth/signup] Body:', { ...req.body, password: '***', confirmPassword: '***' });

  const { firstName, lastName, email, password, confirmPassword } = req.body;
  const errors = {};

  if (!validateName(firstName)) {
    errors.firstName = 'First name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.';
  }
  if (!validateName(lastName)) {
    errors.lastName = 'Last name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes.';
  }
  if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!validatePassword(password)) {
    errors.password = 'Password must be at least 8 characters with at least 1 uppercase letter, 1 digit, and 1 special character.';
  }
  if (!password || !confirmPassword || password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Please fix the validation errors.',
      errors
    });
  }

  const db = getDb();

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existingUser) {
    // BUG-010: API correctly returns 409; frontend ignores this and silently resets form
    return res.status(409).json({
      status: 'error',
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'An account with this email address already exists.'
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = uuidv4();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, firstName, lastName, email, password, phone, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, firstName.trim(), lastName.trim(), email.trim().toLowerCase(), hashedPassword, '', createdAt);

  const user = db.prepare('SELECT id, firstName, lastName, email, phone, createdAt FROM users WHERE id = ?').get(userId);

  return res.status(201).json({
    status: 'success',
    message: 'Account created successfully.',
    data: { user }
  });
});

// POST /api/auth/login
// BUG-001: Returns 200 + valid JWT for any existing email regardless of password correctness.
// Only returns 401 if the email doesn't exist in the database at all.
router.post('/login', async (req, res) => {
  console.log('[POST /api/auth/login] Email:', req.body.email);

  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Email is required.'
    });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());

  // BUG-001: If email doesn't exist, return 401. Otherwise, skip password check entirely.
  if (!user) {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.'
    });
  }

  // BUG-001 implementation: We intentionally do NOT check the password.
  // A real implementation would do: const valid = bcrypt.compareSync(password, user.password);
  // But we skip that check — any password works for existing emails.

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

  return res.status(200).json({
    status: 'success',
    message: 'Login successful.',
    data: {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      }
    }
  });
});

// POST /api/auth/forgot-password
// BUG-002: No email format validation. Accepts any input and always returns 200.
router.post('/forgot-password', (req, res) => {
  console.log('[POST /api/auth/forgot-password] Input:', req.body.email);

  // BUG-002: No validation of email format whatsoever.
  // A real implementation would validate email format and return 400 for invalid inputs.
  // We just always return success regardless of input.

  return res.status(200).json({
    status: 'success',
    message: 'If this email exists in our system, a reset link has been sent.'
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  console.log('[POST /api/auth/change-password] UserId:', req.user.userId);

  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'All password fields are required.'
    });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'New password must be at least 8 characters with at least 1 uppercase letter, 1 digit, and 1 special character.'
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'New passwords do not match.'
    });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);

  if (!user) {
    return res.status(404).json({
      status: 'error',
      code: 'USER_NOT_FOUND',
      message: 'User not found.'
    });
  }

  const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_PASSWORD',
      message: 'Current password is incorrect.'
    });
  }

  const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedNewPassword, req.user.userId);

  return res.status(200).json({
    status: 'success',
    message: 'Password changed successfully.'
  });
});

module.exports = router;
