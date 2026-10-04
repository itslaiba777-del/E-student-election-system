const db = require('../config/db');
const path = require('path');
const { execSync } = require('child_process');

const commitFileToGit = (filePath, message) => {
  try {
    const rootDir = path.join(__dirname, '../..');
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    execSync(`git add "${relativePath}"`, { cwd: rootDir });
    execSync(`git commit -m "${message}: ${relativePath}"`, { cwd: rootDir });
    console.log(`✅ Git commit successful for candidate media file: ${relativePath}`);
  } catch (err) {
    console.warn('Git commit warning for candidate photo (non-fatal):', err.message);
  }
};

/**
 * Register candidate for an election (Photo & Symbol upload)
 */
const registerCandidate = async (req, res) => {
  try {
    const { name, party, manifesto, bio, experience, faculty_id, department_id, program_id, election_id } = req.body;

    let photo_url = null;
    let symbol_image_url = null;

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photo_url = `/uploads/${req.files.photo[0].filename}`;
        const absPath = path.join(__dirname, '..', photo_url);
        commitFileToGit(absPath, `Add candidate ballot campaign photo for ${name || 'Candidate'}`);
      }
      if (req.files.symbol && req.files.symbol[0]) {
        symbol_image_url = `/uploads/${req.files.symbol[0].filename}`;
        const absPath = path.join(__dirname, '..', symbol_image_url);
        commitFileToGit(absPath, `Add candidate electoral symbol image for ${name || 'Candidate'}`);
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
      INSERT INTO candidates (name, party, manifesto, bio, experience, photo_url, symbol_image_url, faculty_id, department_id, program_id, election_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `;
    const values = [
      name.trim(),
      party ? party.trim() : null,
      manifesto ? manifesto.trim() : null,
      bio ? bio.trim() : null,
      experience ? experience.trim() : null,
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
 * Get ALL Candidate Applications (Admin & SuperAdmin view)
 */
const getAllCandidates = async (req, res) => {
  try {
    const { status, election_id } = req.query;

    // Auto-sync: Ensure every registered student with user_role = 'candidate' has a row in candidates table
    try {
      const pendingCandStudents = await db.query(
        "SELECT * FROM students WHERE user_role = 'candidate'"
      );
      if (pendingCandStudents.rows && pendingCandStudents.rows.length > 0) {
        for (const st of pendingCandStudents.rows) {
          const candCheck = await db.query(
            "SELECT id FROM candidates WHERE name ILIKE $1",
            [st.full_name]
          );
          if (!candCheck.rows || candCheck.rows.length === 0) {
            await db.query(
              `INSERT INTO candidates (name, party, manifesto, photo_url, symbol_image_url, faculty_id, department_id, program_id, election_id, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 'pending')`,
              [
                st.full_name || 'Candidate',
                st.party_name || 'Independent',
                st.manifesto || null,
                st.profile_image_url || null,
                st.symbol_url || null,
                st.faculty_id || 1,
                st.department_id || 1,
                st.program_id || null,
              ]
            );
          }
        }
      }
    } catch (syncErr) {
      console.warn('Candidates auto-sync note:', syncErr.message);
    }

    let query = `
      SELECT c.*, c.name as full_name, c.party as party_name,
             f.faculty_name, d.department_name, p.program_name,
             e.title as election_title, e.position_title
      FROM candidates c
      LEFT JOIN faculties f ON c.faculty_id = f.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN programs p ON c.program_id = p.id
      LEFT JOIN elections e ON c.election_id = e.id
    `;
    let params = [];
    let conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }

    if (election_id) {
      params.push(election_id);
      conditions.push(`c.election_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await db.query(query, params);

    const formatted = result.rows.map((row) => ({
      ...row,
      id: row.id,
      full_name: row.name || row.full_name || 'Candidate',
      student_id: row.registration_number || row.student_id || `ST-${row.id}`,
      party_name: row.party || row.party_name || 'Independent',
      party: row.party || row.party_name || 'Independent',
      slogan: row.slogan || '',
      motto: row.motto || '',
      bio: row.bio || '',
      manifesto: row.manifesto || '',
      experience: row.experience || '',
      photo_url: row.photo_url || null,
      symbol_image_url: row.symbol_image_url || null,
      position_title: row.position_title || 'President',
      applied_date: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Recent',
      status: row.status || 'pending',
    }));

    return res.status(200).json({ candidates: formatted });
  } catch (error) {
    console.error('Get all candidates error:', error);
    return res.status(500).json({ message: 'Server error fetching all candidates.' });
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
 * Supports 'approved', 'rejected', or 'reupload_requested'
 */
const updateCandidateStatus = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'reupload_requested'

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

    // If Admin requests Re-upload / Edit: Clear/reset candidate uploaded details & images from DB
    if (status === 'reupload_requested') {
      const resetRes = await db.query(
        `UPDATE candidates
         SET status = 'reupload_requested',
             party = null,
             slogan = null,
             motto = null,
             manifesto = null,
             bio = null,
             experience = null,
             photo_url = null,
             symbol_image_url = null
         WHERE id = $1 RETURNING *`,
        [candidate_id]
      );
      if (resetRes.rows.length === 0) {
        return res.status(404).json({ message: 'Candidate nomination not found.' });
      }
      return res.status(200).json({
        message: 'Re-upload requested! Candidate details reset in database for fresh candidate entry.',
        candidate: resetRes.rows[0],
      });
    }

    const result = await db.query(
      'UPDATE candidates SET status = $1 WHERE id = $2 RETURNING *',
      [status, candidate_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Candidate nomination not found.' });
    }

    const candidate = result.rows[0];

    return res.status(200).json({
      message: status === 'rejected'
        ? `Candidate application rejected.`
        : `Candidate application approved! Candidate is now eligible to contest in the election.`,
      candidate,
    });
  } catch (error) {
    console.error('Update candidate status error:', error);
    return res.status(500).json({ message: 'Server error updating candidate status.' });
  }
};

/**
 * Update candidate nomination details (party, manifesto, bio, experience, symbol, photo) before deadline
 */
const updateCandidateDetails = async (req, res) => {
  try {
    const { candidate_id } = req.params;
    const { party, slogan, motto, manifesto, bio, experience } = req.body;

    let candResult = await db.query('SELECT * FROM candidates WHERE id = $1', [candidate_id]);
    
    // If not found by candidate_id, lookup by student user name
    if (candResult.rows.length === 0) {
      const studentId = req.user?.id;
      if (studentId) {
        const stRes = await db.query('SELECT full_name, faculty_id, department_id, program_id FROM students WHERE id = $1', [studentId]);
        if (stRes.rows.length > 0) {
          const st = stRes.rows[0];
          // Create nomination row if missing
          const ins = await db.query(
            `INSERT INTO candidates (name, party, slogan, motto, manifesto, bio, experience, faculty_id, department_id, program_id, election_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, 'pending') RETURNING *`,
            [st.full_name, party || 'Independent', slogan || '', motto || '', manifesto || '', bio || '', experience || '', st.faculty_id || 1, st.department_id || 1, st.program_id || null]
          );
          candResult = ins;
        }
      }
    }

    if (candResult.rows.length === 0) {
      return res.status(404).json({ message: 'Candidate nomination record not found.' });
    }

    const candidate = candResult.rows[0];

    let photo_url = candidate.photo_url;
    let symbol_image_url = candidate.symbol_image_url;

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photo_url = `/uploads/${req.files.photo[0].filename}`;
        const absPath = path.join(__dirname, '..', photo_url);
        commitFileToGit(absPath, `Update candidate ballot campaign photo for ${candidate.name}`);
      }
      if (req.files.symbol && req.files.symbol[0]) {
        symbol_image_url = `/uploads/${req.files.symbol[0].filename}`;
        const absPath = path.join(__dirname, '..', symbol_image_url);
        commitFileToGit(absPath, `Update candidate electoral symbol image for ${candidate.name}`);
      }
    }

    const updated = await db.query(
      `UPDATE candidates
       SET party = COALESCE($1, party),
           slogan = COALESCE($2, slogan),
           motto = COALESCE($3, motto),
           manifesto = COALESCE($4, manifesto),
           bio = COALESCE($5, bio),
           experience = COALESCE($6, experience),
           photo_url = COALESCE($7, photo_url),
           symbol_image_url = COALESCE($8, symbol_image_url),
           status = 'pending'
       WHERE id = $9
       RETURNING *`,
      [
        party ? party.trim() : null,
        slogan ? slogan.trim() : null,
        motto ? motto.trim() : null,
        manifesto ? manifesto.trim() : null,
        bio ? bio.trim() : null,
        experience ? experience.trim() : null,
        photo_url,
        symbol_image_url,
        candidate.id,
      ]
    );

    return res.status(200).json({
      message: 'Candidate nomination details uploaded successfully & submitted for Admin Approval!',
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

/**
 * Convert Candidate profile back to standard Voter profile upon acknowledged rejection
 */
const convertToVoter = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const studentEmail = req.user?.email;

    if (!studentId && !studentEmail) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Update student user_role to 'voter'
    await db.query(
      `UPDATE students SET user_role = 'voter' WHERE id = $1 OR email = $2`,
      [studentId, studentEmail]
    );

    // Remove candidate nomination record
    const studentRes = await db.query(
      'SELECT full_name FROM students WHERE id = $1 OR email = $2',
      [studentId, studentEmail]
    );
    if (studentRes.rows.length > 0) {
      const name = studentRes.rows[0].full_name;
      await db.query('DELETE FROM candidates WHERE name ILIKE $1', [name]);
    }

    return res.status(200).json({
      message: 'Account role converted to standard Voter. Profile automatically logging out...',
    });
  } catch (error) {
    console.error('Convert to voter error:', error);
    return res.status(500).json({ message: 'Server error converting candidate profile to voter.' });
  }
};

module.exports = {
  registerCandidate,
  getAllCandidates,
  getCandidatesByElection,
  updateCandidateStatus,
  updateCandidateDetails,
  getMyNomination,
  convertToVoter,
};


