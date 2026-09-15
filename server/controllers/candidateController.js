const db = require('../config/db');

/**
 * Register candidate for an election (Photo & Symbol upload)
 */
const registerCandidate = async (req, res) => {
  try {
    const { name, party, manifesto, faculty_id, department_id, program_id, election_id } = req.body;

    let photo_url = null;
    let symbol_image_url = null;

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photo_url = `/uploads/${req.files.photo[0].filename}`;
      }
      if (req.files.symbol && req.files.symbol[0]) {
        symbol_image_url = `/uploads/${req.files.symbol[0].filename}`;
      }
    }

    if (!name || !faculty_id || !department_id || !election_id) {
      return res.status(400).json({ message: 'Name, faculty, department, and election ID are required.' });
    }

    // Verify candidate application time window
    const electionResult = await db.query(
      'SELECT candidate_apply_start, candidate_apply_end, status FROM elections WHERE id = $1',
      [election_id]
    );

    if (electionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const election = electionResult.rows[0];
    const now = new Date();
    if (now < new Date(election.candidate_apply_start) || now > new Date(election.candidate_apply_end)) {
      return res.status(400).json({ message: 'Candidate nomination period for this election is closed.' });
    }

    const query = `
      INSERT INTO candidates (name, party, manifesto, photo_url, symbol_image_url, faculty_id, department_id, program_id, election_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `;
    const values = [
      name.trim(),
      party ? party.trim() : null,
      manifesto ? manifesto.trim() : null,
      photo_url,
      symbol_image_url,
      faculty_id,
      department_id,
      program_id || null,
      election_id,
    ];

    const result = await db.query(query, values);
    return res.status(201).json({
      message: 'Candidate nomination submitted successfully. Pending admin approval.',
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error('Register candidate error:', error);
    return res.status(500).json({ message: 'Server error registering candidate.' });
  }
};

/**
 * Get Candidates for an election
 */
const getCandidatesByElection = async (req, res) => {
  try {
    const { election_id } = req.params;
    const { status } = req.query; // e.g. 'approved' for student voter screen

    let query = `
      SELECT c.*, f.faculty_name, d.department_name, p.program_name
      FROM candidates c
      JOIN faculties f ON c.faculty_id = f.id
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE c.election_id = $1
    `;
    let params = [election_id];

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    query += ' ORDER BY c.name ASC';

    const result = await db.query(query, params);
    return res.status(200).json({ candidates: result.rows });
  } catch (error) {
    console.error('Get candidates error:', error);
    return res.status(500).json({ message: 'Server error fetching candidates.' });
  }
};

/**
 * Update candidate approval status (Requires can_approve_candidates permission)
 */
const updateCandidateStatus = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (status === 'approved') {
      const candidateCheck = await db.query('SELECT election_id FROM candidates WHERE id = $1', [candidate_id]);
      if (candidateCheck.rows.length > 0) {
        const electionId = candidateCheck.rows[0].election_id;
        const elecRes = await db.query('SELECT total_seats, title FROM elections WHERE id = $1', [electionId]);
        
        if (elecRes.rows.length > 0) {
          const totalSeats = parseInt(elecRes.rows[0].total_seats || 20, 10);
          const countRes = await db.query(
            `SELECT COUNT(*) as approved_count FROM candidates WHERE election_id = $1 AND status = 'approved' AND id != $2`,
            [electionId, candidate_id]
          );
          const approvedCount = parseInt(countRes.rows[0].approved_count, 10);
          
          if (approvedCount >= totalSeats) {
            return res.status(400).json({
              message: `Cannot approve candidate! Candidate seat quota reached (${approvedCount}/${totalSeats} approved). Maximum ${totalSeats} candidate seats allowed for '${elecRes.rows[0].title}'.`
            });
          }
        }
      }
    }

    const result = await db.query(
      'UPDATE candidates SET status = $1 WHERE id = $2 RETURNING *',
      [status, candidate_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Candidate nomination not found.' });
    }

    const candidate = result.rows[0];

    // If candidate application is REJECTED, automatically convert/demote candidate to Voter!
    if (status === 'rejected') {
      await db.query(
        `UPDATE students
         SET role = 'voter', user_role = 'voter'
         WHERE full_name ILIKE $1 OR id = $2`,
        [candidate.name, candidate.student_id || 0]
      );
    }

    return res.status(200).json({
      message: status === 'rejected'
        ? `Candidate application rejected. Student has been automatically converted to a Voter.`
        : `Candidate application approved! Candidate is now eligible to contest in the election.`,
      candidate,
    });
  } catch (error) {
    console.error('Update candidate status error:', error);
    return res.status(500).json({ message: 'Server error updating candidate status.' });
  }
};

/**
 * Update candidate nomination details (party, manifesto/slogan, symbol, photo) before deadline
 */
const updateCandidateDetails = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const { party, manifesto } = req.body;

    const candResult = await db.query('SELECT * FROM candidates WHERE id = $1', [candidate_id]);
    if (candResult.rows.length === 0) {
      return res.status(404).json({ message: 'Candidate nomination record not found.' });
    }

    const candidate = candResult.rows[0];

    // Check election deadline
    const elecResult = await db.query('SELECT candidate_apply_end, title FROM elections WHERE id = $1', [candidate.election_id]);
    if (elecResult.rows.length > 0) {
      const applyEnd = new Date(elecResult.rows[0].candidate_apply_end);
      if (new Date() > applyEnd) {
        return res.status(403).json({
          message: 'Nomination deadline has passed. Candidate details can no longer be edited.',
          deadline_passed: true,
          candidate_apply_end: applyEnd,
        });
      }
    }

    let photo_url = candidate.photo_url;
    let symbol_image_url = candidate.symbol_image_url;

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photo_url = `/uploads/${req.files.photo[0].filename}`;
      }
      if (req.files.symbol && req.files.symbol[0]) {
        symbol_image_url = `/uploads/${req.files.symbol[0].filename}`;
      }
    }

    const updated = await db.query(
      `UPDATE candidates
       SET party = COALESCE($1, party),
           manifesto = COALESCE($2, manifesto),
           photo_url = COALESCE($3, photo_url),
           symbol_image_url = COALESCE($4, symbol_image_url)
       WHERE id = $5
       RETURNING *`,
      [party ? party.trim() : null, manifesto ? manifesto.trim() : null, photo_url, symbol_image_url, candidate_id]
    );

    return res.status(200).json({
      message: 'Candidate nomination details updated successfully.',
      candidate: updated.rows[0],
    });
  } catch (error) {
    console.error('Update candidate details error:', error);
    return res.status(500).json({ message: 'Server error updating candidate details.' });
  }
};

/**
 * Get candidate nomination details for current logged-in student user
 */
const getMyNomination = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const studentEmail = req.user?.email;

    if (!studentId && !studentEmail) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Lookup candidate by student name/email/id or query
    const studentRes = await db.query('SELECT full_name FROM students WHERE id = $1 OR email = $2', [studentId, studentEmail]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const studentName = studentRes.rows[0].full_name;

    const candRes = await db.query(
      `SELECT c.*, e.title as election_title, e.candidate_apply_end, e.status as election_status
       FROM candidates c
       JOIN elections e ON c.election_id = e.id
       WHERE c.name ILIKE $1
       ORDER BY c.created_at DESC LIMIT 1`,
      [studentName]
    );

    if (candRes.rows.length === 0) {
      return res.status(200).json({ candidate: null });
    }

    const cand = candRes.rows[0];
    const isDeadlinePassed = new Date() > new Date(cand.candidate_apply_end);

    return res.status(200).json({
      candidate: cand,
      is_deadline_passed: isDeadlinePassed,
    });
  } catch (error) {
    console.error('Get my nomination error:', error);
    return res.status(500).json({ message: 'Server error fetching candidate nomination.' });
  }
};

module.exports = {
  registerCandidate,
  getCandidatesByElection,
  updateCandidateStatus,
  updateCandidateDetails,
  getMyNomination,
};

