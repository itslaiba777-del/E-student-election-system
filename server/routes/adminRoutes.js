const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getStudentsList,
  updateStudentStatus,
  getDepartments,
  createDepartment,
  deleteDepartment,
} = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const requireAdminPermission = require('../middleware/permissionMiddleware');

router.use(verifyToken);
router.use(requireRole(['admin', 'superadmin']));

router.get('/dashboard', requireAdminPermission(null), getAdminDashboard);
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.delete('/departments/:id', deleteDepartment);
router.get('/students', getStudentsList);
router.put('/students/:student_id/status', updateStudentStatus);

module.exports = router;
