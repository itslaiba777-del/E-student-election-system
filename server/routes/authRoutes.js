const express = require('express');
const router = express.Router();
const { superadminLogin, adminLogin, studentLogin, unifiedLogin } = require('../controllers/authController');
const { getSystemSettings } = require('../controllers/superadminController');

router.post('/login', unifiedLogin);
router.post('/superadmin/login', superadminLogin);
router.post('/admin/login', adminLogin);
router.post('/student/login', studentLogin);

// Public branding endpoint
router.get('/system/settings', getSystemSettings);

module.exports = router;


