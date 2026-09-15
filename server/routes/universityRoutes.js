const express = require('express');
const router = express.Router();
const { getUniversities, getUniversityById, createUniversity } = require('../controllers/universityController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route for university selector during login/registration
router.get('/', getUniversities);
router.get('/:id', getUniversityById);

// Protected SuperAdmin route
router.post('/', verifyToken, requireRole(['superadmin']), upload.single('logo'), createUniversity);

module.exports = router;
