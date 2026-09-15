const express = require('express');
const router = express.Router();
const {
  registerCandidate,
  getCandidatesByElection,
  updateCandidateStatus,
  updateCandidateDetails,
  getMyNomination,
} = require('../controllers/candidateController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const requireAdminPermission = require('../middleware/permissionMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get candidates for an election (Public/Student)
router.get('/election/:election_id', getCandidatesByElection);

// Get current candidate's nomination details
router.get('/my-nomination', verifyToken, getMyNomination);

// Candidate nomination registration (With candidate photo & candidate symbol upload)
router.post(
  '/',
  verifyToken,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'symbol', maxCount: 1 },
  ]),
  registerCandidate
);

// Update Candidate Details before deadline (Party, Manifesto/Slogan, Photo, Symbol)
router.put(
  '/:candidate_id/details',
  verifyToken,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'symbol', maxCount: 1 },
  ]),
  updateCandidateDetails
);

// Approve / Reject Candidate (Requires can_approve_candidates permission)
router.put(
  '/:candidate_id/status',
  verifyToken,
  requireRole(['admin', 'superadmin']),
  requireAdminPermission('can_approve_candidates'),
  updateCandidateStatus
);

module.exports = router;

