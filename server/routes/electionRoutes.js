const express = require('express');
const router = express.Router();
const { createElection, getElections, extendVotingTime, getElectionResults, updateElectionSchedule, getScheduleLogs } = require('../controllers/electionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const requireAdminPermission = require('../middleware/permissionMiddleware');

// Get elections list
router.get('/', getElections);

// Create election (SuperAdmin or Admin)
router.post('/', verifyToken, requireRole(['superadmin', 'admin']), createElection);

// Dynamic Schedule Update / Extension
router.put('/:election_id/schedule', verifyToken, requireRole(['admin', 'superadmin']), updateElectionSchedule);

// Get schedule history audit trail
router.get('/:election_id/schedule-history', verifyToken, requireRole(['admin', 'superadmin']), getScheduleLogs);

// Extend voting time (Requires can_extend_voting_time permission)
router.put(
  '/:election_id/extend',
  verifyToken,
  requireRole(['admin', 'superadmin']),
  requireAdminPermission('can_extend_voting_time'),
  extendVotingTime
);

// Get election results (Available ONLY when election is closed and permitted)
router.get(
  '/:election_id/results',
  verifyToken,
  requireRole(['admin', 'superadmin', 'student']),
  requireAdminPermission('can_view_results'),
  getElectionResults
);

module.exports = router;
