const db = require('../config/db');

/**
 * Create Election (SuperAdmin or authorized Admin)
 */
const createElection = async (req, res) => {
  try {
    const {
      title,
      position_title = 'President',
      total_seats = 20,
      university_id = 1,
      scope = 'university-wide',
      scope_type = 'all_departments',
      department_id,
      min_semester = 3,
      min_cgpa_criteria = 3.0,
      terms_and_conditions = 'Candidates must be active students with clean disciplinary record.',
      candidate_apply_start,
      candidate_apply_end,
      voter_register_start,
      voter_register_end,
      voting_start,
      voting_end,
    } = req.body;

    if (!title || !candidate_apply_start || !candidate_apply_end) {
      return res.status(400).json({ message: 'Title and candidate registration dates are required.' });
    }

    const query = `
      INSERT INTO elections (
        title, position_title, total_seats, university_id, scope, scope_type, department_id,
        min_semester, min_cgpa_criteria, terms_and_conditions,
        candidate_apply_start, candidate_apply_end, voter_register_start, voter_register_end, voting_start, voting_end, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'upcoming')
      RETURNING *
    `;

    const values = [
      title.trim(),
      position_title ? position_title.trim() : 'President',
      parseInt(total_seats || 20, 10),
      university_id || 1,
      scope || 'university-wide',
      scope_type || 'all_departments',
      department_id || null,
      min_semester || 3,
      min_cgpa_criteria || 3.0,
      terms_and_conditions || 'Candidates must be active students with clean disciplinary record.',
      candidate_apply_start,
      candidate_apply_end,
      voter_register_start || candidate_apply_start,
      voter_register_end || candidate_apply_end,
      voting_start || null,
      voting_end || null,
    ];

    const result = await db.query(query, values);
    // Log initial schedule entry
    if (voting_start && voting_end) {
      await db.query(
        `INSERT INTO election_schedule_logs (election_id, action_type, voting_start, voting_end)
         VALUES ($1, $2, $3, $4)`,
        [result.rows[0].id, 'INITIAL_SCHEDULE_LAUNCH', voting_start, voting_end]
      );
    }

    return res.status(201).json({
      message: `Election '${title.trim()}' for ${position_title} created successfully.`,
      election: result.rows[0],
    });
  } catch (error) {
    console.error('Create election error:', error);
    return res.status(500).json({ message: 'Server error creating election.' });
  }
};

/**
 * Get Elections list based on role & scope
 */
const getElections = async (req, res) => {
  try {
    const { university_id, scope, faculty_id, department_id } = req.query;

    let whereClauses = [];
    let params = [];

    if (university_id) {
      params.push(university_id);
      whereClauses.push(`e.university_id = $${params.length}`);
    }

    if (scope) {
      params.push(scope);
      whereClauses.push(`e.scope = $${params.length}`);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT e.*, u.university_name
      FROM elections e
      JOIN universities u ON e.university_id = u.id
      ${whereString}
      ORDER BY e.created_at DESC
    `;

    const result = await db.query(query, params);

    // Auto update status based on current time
    const now = new Date();
    const updatedElections = result.rows.map((elec) => {
      let currentStatus = elec.status;
      if (elec.status !== 'closed') {
        if (now >= new Date(elec.voting_start) && now <= new Date(elec.voting_end)) {
          currentStatus = 'active';
        } else if (now > new Date(elec.voting_end)) {
          currentStatus = 'closed';
        }
      }
      return { ...elec, calculated_status: currentStatus };
    });

    return res.status(200).json({ elections: updatedElections });
  } catch (error) {
    console.error('Get elections error:', error);
    return res.status(500).json({ message: 'Server error fetching elections.' });
  }
};

/**
 * Extend Voting Time (Enforces can_extend_voting_time permission)
 */
const extendVotingTime = async (req, res) => {
  try {
    const { election_id } = req.params;
    const { new_voting_end } = req.body;

    if (!new_voting_end) {
      return res.status(400).json({ message: 'New voting end timestamp is required.' });
    }

    const electionResult = await db.query('SELECT voting_start, voting_end, status FROM elections WHERE id = $1', [election_id]);
    if (electionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const currentEnd = new Date(electionResult.rows[0].voting_end);
    const proposedEnd = new Date(new_voting_end);

    if (proposedEnd <= currentEnd) {
      return res.status(400).json({ message: 'Extended end time must be after the current voting end time.' });
    }

    const result = await db.query(
      `UPDATE elections 
       SET voting_end = $1, status = CASE WHEN $1 > NOW() THEN 'active' ELSE status END, updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [new_voting_end, election_id]
    );

    // Log extension
    await db.query(
      `INSERT INTO election_schedule_logs (election_id, action_type, voting_start, voting_end)
       VALUES ($1, $2, $3, $4)`,
      [election_id, 'TIME_EXTENDED', electionResult.rows[0].voting_start, new_voting_end]
    );

    return res.status(200).json({
      message: 'Voting time extended successfully.',
      election: result.rows[0],
    });
  } catch (error) {
    console.error('Extend voting time error:', error);
    return res.status(500).json({ message: 'Server error extending voting time.' });
  }
};

/**
 * Get Election Results (Exposed ONLY when election is CLOSED)
 * IMPORTANT: Live votes are NEVER exposed during active voting!
 */
const getElectionResults = async (req, res) => {
  try {
    const { election_id } = req.params;

    const electionRes = await db.query('SELECT * FROM elections WHERE id = $1', [election_id]);
    if (electionRes.rows.length === 0) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const election = electionRes.rows[0];
    const now = new Date();

    if (election.status !== 'closed' && now <= new Date(election.voting_end)) {
      return res.status(403).json({
        message: 'Election is currently active. Results are strictly hidden until voting is closed.',
      });
    }

    // Calculate aggregated vote tally from anonymous votes table
    const tallyQuery = `
      SELECT c.id as candidate_id, c.name as candidate_name, c.party, c.symbol_image_url, c.photo_url,
             COUNT(v.id) as vote_count
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id AND v.election_id = $1
      WHERE c.election_id = $1 AND c.status = 'approved'
      GROUP BY c.id
      ORDER BY vote_count DESC
    `;

    const tallyResult = await db.query(tallyQuery, [election_id]);
    const totalVotes = tallyResult.rows.reduce((sum, row) => sum + parseInt(row.vote_count, 10), 0);

    const formattedResults = tallyResult.rows.map((row, index) => {
      const vCount = parseInt(row.vote_count, 10);
      return {
        ...row,
        vote_count: vCount,
        percentage: totalVotes > 0 ? ((vCount / totalVotes) * 100).toFixed(2) : '0.00',
        is_winner: index === 0 && vCount > 0,
      };
    });

    const winner = formattedResults.length > 0 && formattedResults[0].vote_count > 0 ? formattedResults[0] : null;
    const runnerUp = formattedResults.length > 1 ? formattedResults[1] : null;
    const victoryMargin = winner && runnerUp ? winner.vote_count - runnerUp.vote_count : winner ? winner.vote_count : 0;

    return res.status(200).json({
      election,
      total_votes_cast: totalVotes,
      winner,
      victory_margin: victoryMargin,
      results: formattedResults,
    });
  } catch (error) {
    console.error('Get election results error:', error);
    return res.status(500).json({ message: 'Server error tallying election results.' });
  }
};

/**
 * Update / Extend Election Schedule dynamically (Admin control)
 */
const updateElectionSchedule = async (req, res) => {
  try {
    const { election_id } = req.params;
    const {
      candidate_apply_end,
      voter_register_end,
      voting_start,
      voting_end,
    } = req.body;

    const electionCheck = await db.query('SELECT * FROM elections WHERE id = $1', [election_id]);
    if (electionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const updated = await db.query(
      `UPDATE elections
       SET candidate_apply_end = COALESCE($1, candidate_apply_end),
           voter_register_end = COALESCE($2, voter_register_end),
           voting_start = COALESCE($3, voting_start),
           voting_end = COALESCE($4, voting_end),
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [
        candidate_apply_end || null,
        voter_register_end || null,
        voting_start || null,
        voting_end || null,
        election_id,
      ]
    );

    // Determine action type
    const prevStart = electionCheck.rows[0].voting_start ? new Date(electionCheck.rows[0].voting_start) : null;
    const prevEnd = electionCheck.rows[0].voting_end ? new Date(electionCheck.rows[0].voting_end) : null;
    const nextStart = voting_start ? new Date(voting_start) : prevStart;
    const nextEnd = voting_end ? new Date(voting_end) : prevEnd;

    let action_type = 'TIMINGS_SAVED_LAUNCHED';
    if (prevEnd && nextEnd && nextEnd > prevEnd) {
      action_type = 'TIME_EXTENDED';
    } else if (prevStart || prevEnd) {
      action_type = 'SCHEDULE_UPDATED';
    }

    await db.query(
      `INSERT INTO election_schedule_logs (election_id, action_type, voting_start, voting_end)
       VALUES ($1, $2, $3, $4)`,
      [
        election_id,
        action_type,
        nextStart ? nextStart.toISOString() : null,
        nextEnd ? nextEnd.toISOString() : null,
      ]
    );

    return res.status(200).json({
      message: 'Election schedule updated successfully.',
      election: updated.rows[0],
    });
  } catch (error) {
    console.error('Update election schedule error:', error);
    return res.status(500).json({ message: 'Server error updating election schedule.' });
  }
};

/**
 * Get election schedule audit logs
 */
const getScheduleLogs = async (req, res) => {
  try {
    const { election_id } = req.params;
    const result = await db.query(
      `SELECT * FROM election_schedule_logs WHERE election_id = $1 ORDER BY created_at DESC`,
      [election_id]
    );
    return res.status(200).json({ logs: result.rows });
  } catch (error) {
    console.error('Get schedule logs error:', error);
    return res.status(500).json({ message: 'Server error fetching schedule logs.' });
  }
};

module.exports = {
  createElection,
  getElections,
  extendVotingTime,
  getElectionResults,
  updateElectionSchedule,
  getScheduleLogs,
};
