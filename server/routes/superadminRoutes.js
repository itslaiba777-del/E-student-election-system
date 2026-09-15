const express = require('express');
const router = express.Router();
const {
  getSuperadminDashboard,
  createAdmin,
  updateAdminPassword,
  getAllAdmins,
  getSystemSettings,
  updateSystemSettings,
  getAllStudents,
  getApprovedCandidates,
} = require('../controllers/superadminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(verifyToken);
router.use(requireRole(['superadmin']));

router.get('/dashboard', getSuperadminDashboard);
router.post('/admins', createAdmin);
router.put('/admins/:id/password', updateAdminPassword);
router.get('/admins', getAllAdmins);

router.get('/settings', getSystemSettings);
router.put('/settings', upload.single('logo'), updateSystemSettings);
router.get('/students', getAllStudents);
router.get('/candidates', getApprovedCandidates);

module.exports = router;

