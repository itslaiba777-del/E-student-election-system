const db = require('../config/db');

/**
 * Middleware factory to check admin level and specific permission flags
 * @param {string} requiredPermission Column name in admin_permissions table e.g. 'can_approve_candidates'
 * @param {Array<string>} [requiredLevels] Optional allowed admin levels e.g. ['university', 'faculty']
 */
const requireAdminPermission = (requiredPermission, requiredLevels = []) => {
  return async (req, res, next) => {
    try {
      // SuperAdmin automatically bypasses specific admin permission checks
      if (req.user && req.user.role === 'superadmin') {
        return next();
      }

      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access restricted to authorized admins.' });
      }

      const adminId = req.user.id;

      // Fetch admin level and permission flags
      const query = `
        SELECT a.id, a.level, a.university_id, a.faculty_id, a.department_id, p.*
        FROM admins a
        LEFT JOIN admin_permissions p ON a.id = p.admin_id
        WHERE a.id = $1 AND a.status = 'active'
      `;
      const result = await db.query(query, [adminId]);

      if (result.rows.length === 0) {
        return res.status(403).json({ message: 'Admin account not found or deactivated.' });
      }

      const admin = result.rows[0];

      // Level check
      if (requiredLevels.length > 0 && !requiredLevels.includes(admin.level)) {
        return res.status(403).json({
          message: `Action requires ${requiredLevels.join('/')} admin level. Your level is '${admin.level}'.`,
        });
      }

      // Permission flag check
      if (requiredPermission && !admin[requiredPermission]) {
        return res.status(403).json({
          message: `Permission denied. You do not possess '${requiredPermission}' privilege.`,
        });
      }

      // Attach admin scope details to request object for downstream controllers
      req.adminScope = {
        id: admin.id,
        level: admin.level,
        university_id: admin.university_id,
        faculty_id: admin.faculty_id,
        department_id: admin.department_id,
        permissions: admin,
      };

      next();
    } catch (error) {
      console.error('Error verifying admin permission:', error);
      return res.status(500).json({ message: 'Server error checking administrative permissions.' });
    }
  };
};

module.exports = requireAdminPermission;
