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
  deleteDepartment,
  deleteProgram,
  getHierarchy,
} = require('../controllers/academicStructureController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public/Read endpoints
router.get('/public-settings', getPublicSettings);
router.get('/departments', getAllDepartments);
router.get('/programs', getAllPrograms);
router.get('/hierarchy/:university_id', getHierarchy);
router.get('/university/:university_id/faculties', getFacultiesByUniversity);
router.get('/faculty/:faculty_id/departments', getDepartmentsByFaculty);
router.get('/department/:department_id/programs', getProgramsByDepartment);

// Protected Admin/SuperAdmin Creation & Deletion endpoints
router.post('/faculties', verifyToken, requireRole(['superadmin', 'admin']), createFaculty);
router.post('/departments', verifyToken, requireRole(['superadmin', 'admin']), createDepartment);
router.post('/programs', verifyToken, requireRole(['superadmin', 'admin']), createProgram);
router.delete('/departments/:id', verifyToken, requireRole(['superadmin', 'admin']), deleteDepartment);
router.delete('/programs/:id', verifyToken, requireRole(['superadmin', 'admin']), deleteProgram);

module.exports = router;
