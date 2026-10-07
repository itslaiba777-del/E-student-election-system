const express = require('express');
const router = express.Router();
const {
  castVote,
  getVoterStatus,
  requestOTP,
  verifyOTP,
  verifyFace,
} = require('../controllers/voteController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// 2FA Verification Flow: Step 1 (OTP) & Step 2 (Biometric Face)
router.post('/request-otp', requireRole(['student', 'voter', 'candidate']), requestOTP);
router.post('/verify-otp', requireRole(['student', 'voter', 'candidate']), verifyOTP);
router.post('/verify-face', requireRole(['student', 'voter', 'candidate']), verifyFace);

// Step 3: Cast Vote (Voters / Students / Candidates)
router.post('/cast', requireRole(['student', 'voter', 'candidate']), castVote);

// Get Voter Status for election
router.get('/status/:election_id', requireRole(['student', 'voter', 'candidate']), getVoterStatus);

module.exports = router;
