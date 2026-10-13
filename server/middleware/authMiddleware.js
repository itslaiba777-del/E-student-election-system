const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to verify JWT token and extract user details
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    let decoded;
    const primarySecret = process.env.JWT_SECRET || 'super_secret_jwt_key_university_evoting_2026';
    const fallbackSecret = 'campus_vote_super_secret_key_2024_change_this';
    try {
      decoded = jwt.verify(token, primarySecret);
    } catch (err1) {
      decoded = jwt.verify(token, fallbackSecret);
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Session invalid or expired. Please log in again.' });
  }
};

/**
 * Role-based authorization middleware factory
 * @param {Array<string>} allowedRoles Roles permitted to access route e.g. ['superadmin', 'admin', 'student']
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient role permissions.' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
