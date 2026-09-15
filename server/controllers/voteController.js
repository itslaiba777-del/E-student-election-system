const db = require('../config/db');

/**
 * Cast Vote for an Election (Secure 2FA Flow)
 */
const castVote = async (req, res) => {
  try {
    const { election_id, candidate_id } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!election_id || !candidate_id) {
      return res.status(400).json({ message: 'Election ID and Candidate ID are required to cast vote.' });
    }

    // 1. Verify election exists & voting is currently live
    const electionRes = await db.query('SELECT * FROM elections WHERE id = $1', [election_id]);
    if (electionRes.rows.length === 0) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const election = electionRes.rows[0];
    const now = new Date();

    if (now < new Date(election.voting_start) || now > new Date(election.voting_end)) {
      return res.status(400).json({ message: 'Voting window is not active for this election.' });
    }

    // 2. Verify candidate is approved
    const candRes = await db.query('SELECT * FROM candidates WHERE id = $1 AND election_id = $2', [candidate_id, election_id]);
    if (candRes.rows.length === 0) {
      return res.status(404).json({ message: 'Candidate not found for this election.' });
    }

    if (candRes.rows[0].status !== 'approved') {
      return res.status(400).json({ message: 'Votes can only be cast for admin-approved candidates.' });
    }

    // 3. Prevent duplicate voting
    const voteCheck = await db.query(
      'SELECT id FROM votes WHERE election_id = $1 AND (voter_id = $2 OR student_id = $2)',
      [election_id, userId]
    );

    if (voteCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Vote Cast Already! Candidate list is locked for your account.',
        has_voted: true,
      });
    }

    // 4. Record anonymous vote
    await db.query(
      `INSERT INTO votes (election_id, candidate_id, voter_id, student_id)
       VALUES ($1, $2, $3, $3)`,
      [election_id, candidate_id, userId]
    );

    // 5. Update student status
    await db.query('UPDATE students SET has_voted = true WHERE id = $1 OR email = $2', [userId, userEmail]);

    return res.status(200).json({
      message: 'Vote Cast Successfully! Candidate List Locked.',
      has_voted: true,
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    return res.status(500).json({ message: 'Server error casting vote.' });
  }
};

/**
 * Get Voter Status for active election
 */
const getVoterStatus = async (req, res) => {
  try {
    const { election_id } = req.params;
    const userId = req.user?.id;

    const voteCheck = await db.query(
      'SELECT id FROM votes WHERE election_id = $1 AND (voter_id = $2 OR student_id = $2)',
      [election_id, userId]
    );

    const hasVoted = voteCheck.rows.length > 0;

    return res.status(200).json({
      election_id,
      has_voted: hasVoted,
    });
  } catch (error) {
    console.error('Get voter status error:', error);
    return res.status(500).json({ message: 'Server error fetching voter status.' });
  }
};

module.exports = {
  castVote,
  getVoterStatus,
};
