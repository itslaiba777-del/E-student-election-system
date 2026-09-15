const express = require('express');
const router = express.Router();
const {
  getFacultiesByUniversity,
  createFaculty,
  getDepartmentsByFaculty,
  createDepartment,
  getProgramsByDepartment,
  createProgram,
  getAllDepartments,
  getAllPrograms,
  getPublicSettings,
} = require('../controllers/academicStructureController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public/Read endpoints
router.get('/public-settings', getPublicSettings);
router.get('/departments', getAllDepartments);
router.get('/programs', getAllPrograms);
router.get('/university/:university_id/faculties', getFacultiesByUniversity);
router.get('/faculty/:faculty_id/departments', getDepartmentsByFaculty);
router.get('/department/:department_id/programs', getProgramsByDepartment);

// Protected Admin/SuperAdmin Creation endpoints
router.post('/faculties', verifyToken, requireRole(['superadmin', 'admin']), createFaculty);
router.post('/departments', verifyToken, requireRole(['superadmin', 'admin']), createDepartment);
router.post('/programs', verifyToken, requireRole(['superadmin', 'admin']), createProgram);

module.exports = router;
