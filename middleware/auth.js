const jwt = require('jsonwebtoken');

const JWT_SECRET = 'shopsmart_jwt_secret_key_2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Access token is required.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token.'
    });
  }
}

module.exports = { authenticateToken, JWT_SECRET };
