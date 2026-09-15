const express = require('express');
const router = express.Router();
const { verifyEligibility, sendOtp, verifyOtp, registerStudent, getProfile } = require('../controllers/studentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Public registration endpoints
router.post('/verify-eligibility', verifyEligibility);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', registerStudent);

// Protected student profile endpoint
router.get('/profile', verifyToken, requireRole(['student']), getProfile);

module.exports = router;

