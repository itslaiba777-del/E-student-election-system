const express = require('express');
const router = express.Router();
const { castVote, getVoterStatus } = require('../controllers/voteController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Cast Vote (Voters / Students)
router.post('/cast', requireRole(['student', 'voter']), castVote);

// Get Voter Status for election
router.get('/status/:election_id', requireRole(['student', 'voter']), getVoterStatus);

module.exports = router;
