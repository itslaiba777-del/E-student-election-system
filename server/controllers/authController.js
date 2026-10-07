const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_university_evoting_2026';
const JWT_EXPIRES_IN = '7d';

// Helper to record login attempt in login_audit_log
const logLoginAttempt = async (userType, email, status, ip) => {
  try {
    await db.query(
      `INSERT INTO login_audit_log (user_type, user_email, status, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userType, email || 'unknown', status, ip || '127.0.0.1']
    );
  } catch (err) {
    console.warn('Failed to insert login audit log:', err.message);
  }
};

/**
 * SuperAdmin Login
 */
const superadminLogin = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      await logLoginAttempt('superadmin', email, 'failed', ip);
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await db.query(
      'SELECT * FROM superadmins WHERE LOWER(email) = $1 OR LOWER(name) = $1',
      [email.toLowerCase().trim()]
    );
    if (result.rows.length === 0) {
      await logLoginAttempt('superadmin', email, 'failed', ip);
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const superadmin = result.rows[0];
    const isMatch = await bcrypt.compare(password, superadmin.password_hash);
    if (!isMatch) {
      await logLoginAttempt('superadmin', email, 'failed', ip);
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    await logLoginAttempt('superadmin', email, 'success', ip);

    const token = jwt.sign(
      { id: superadmin.id, role: 'superadmin', name: superadmin.name, email: superadmin.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'SuperAdmin login successful.',
      token,
      superadmin: { id: superadmin.id, name: superadmin.name, email: superadmin.email, role: 'superadmin' },
      user: { id: superadmin.id, name: superadmin.name, email: superadmin.email, role: 'superadmin' },
    });
  } catch (error) {
    console.error('SuperAdmin login error:', error);
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
};

/**
 * Admin Login
 */
const adminLogin = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      await logLoginAttempt('admin', email, 'failed', ip);
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const query = `
      SELECT a.*, p.can_view_candidates, p.can_approve_candidates, p.can_view_students,
             p.can_approve_students, p.can_view_results, p.can_submit_results, p.can_extend_voting_time
      FROM admins a
      LEFT JOIN admin_permissions p ON a.id = p.admin_id
      WHERE LOWER(a.email) = $1 OR LOWER(a.name) = $1 OR LOWER(SPLIT_PART(a.name, ' ', 1)) = $1
    `;
    const result = await db.query(query, [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      await logLoginAttempt('admin', email, 'failed', ip);
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const admin = result.rows[0];

    if (admin.status === 'inactive' || admin.status === 'suspended') {
      await logLoginAttempt('admin', email, 'failed', ip);
      return res.status(403).json({
        message: 'Your account has been deactivated. Contact your SuperAdmin.',
        status: 'inactive',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      await logLoginAttempt('admin', email, 'failed', ip);
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    await logLoginAttempt('admin', email, 'success', ip);

    const token = jwt.sign(
      {
        id: admin.id,
        role: 'admin',
        level: admin.level,
        university_id: admin.university_id,
        faculty_id: admin.faculty_id,
        department_id: admin.department_id,
        name: admin.name,
        email: admin.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: 'Admin login successful.',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        level: admin.level,
        university_id: admin.university_id,
        faculty_id: admin.faculty_id,
        department_id: admin.department_id,
        permissions: {
          can_view_candidates: admin.can_view_candidates,
          can_approve_candidates: admin.can_approve_candidates,
          can_view_students: admin.can_view_students,
          can_approve_students: admin.can_approve_students,
          can_view_results: admin.can_view_results,
          can_submit_results: admin.can_submit_results,
          can_extend_voting_time: admin.can_extend_voting_time,
        },
      },
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        level: admin.level,
        university_id: admin.university_id,
        faculty_id: admin.faculty_id,
        department_id: admin.department_id,
        admin_level: admin.level,
        permissions: {
          can_view_candidates: admin.can_view_candidates,
          can_approve_candidates: admin.can_approve_candidates,
          can_view_students: admin.can_view_students,
          can_approve_students: admin.can_approve_students,
          can_view_results: admin.can_view_results,
          can_submit_results: admin.can_submit_results,
          can_extend_voting_time: admin.can_extend_voting_time,
        },
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
};

/**
 * Student Login
 */
const studentLogin = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { identifier, password, university_id } = req.body;
    if (!identifier || !password || !university_id) {
      await logLoginAttempt('student', identifier, 'failed', ip);
      return res.status(400).json({ message: 'University, CNIC/Registration Number, and password are required.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    let userRecord = null;
    let userRole = 'voter';

    // 1. Check candidates table first
    const candQuery = `
      SELECT c.*, c.name as full_name, u.university_name, f.faculty_name, d.department_name, p.program_name
      FROM candidates c
      LEFT JOIN universities u ON c.university_id = u.id
      LEFT JOIN faculties f ON c.faculty_id = f.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE (c.university_id = $1 OR c.university_id IS NULL) AND (LOWER(c.cnic) = $2 OR LOWER(c.registration_number) = $2)
    `;
    const candRes = await db.query(candQuery, [university_id, cleanId]);
    if (candRes.rows && candRes.rows.length > 0) {
      userRecord = candRes.rows[0];
      userRole = 'candidate';
    } else {
      // 2. Check voters table
      const voterQuery = `
        SELECT v.*, u.university_name, f.faculty_name, d.department_name, p.program_name
        FROM voters v
        LEFT JOIN universities u ON v.university_id = u.id
        LEFT JOIN faculties f ON v.faculty_id = f.id
        LEFT JOIN departments d ON v.department_id = d.id
        LEFT JOIN programs p ON v.program_id = p.id
        WHERE v.university_id = $1 AND (LOWER(v.cnic) = $2 OR LOWER(v.registration_number) = $2)
      `;
      const voterRes = await db.query(voterQuery, [university_id, cleanId]);
      if (voterRes.rows && voterRes.rows.length > 0) {
        userRecord = voterRes.rows[0];
        userRole = 'voter';
      }
    }

    if (!userRecord) {
      await logLoginAttempt('student', identifier, 'failed', ip);
      return res.status(401).json({ message: 'Incorrect credentials or record not found.' });
    }

    if (userRecord.status === 'locked') {
      await logLoginAttempt('student', identifier, 'failed', ip);
      return res.status(403).json({ message: 'Account is locked. Please contact university admin.' });
    }

    const isMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isMatch) {
      await logLoginAttempt('student', identifier, 'failed', ip);
      return res.status(401).json({ message: 'Incorrect credentials.' });
    }

    await logLoginAttempt('student', userRecord.email, 'success', ip);

    const token = jwt.sign(
      {
        id: userRecord.id,
        role: userRole,
        user_role: userRole,
        university_id: userRecord.university_id,
        faculty_id: userRecord.faculty_id,
        department_id: userRecord.department_id,
        program_id: userRecord.program_id,
        cnic: userRecord.cnic,
        registration_number: userRecord.registration_number,
        email: userRecord.email,
        full_name: userRecord.full_name || userRecord.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: `${userRole === 'candidate' ? 'Candidate' : 'Voter'} login successful.`,
      token,
      user: {
        id: userRecord.id,
        role: userRole,
        user_role: userRole,
        full_name: userRecord.full_name || userRecord.name || 'Student User',
        mobile_number: userRecord.mobile_number,
        cnic: userRecord.cnic,
        registration_number: userRecord.registration_number,
        email: userRecord.email,
        university_id: userRecord.university_id,
        university_name: userRecord.university_name,
        faculty_name: userRecord.faculty_name,
        department_name: userRecord.department_name,
        program_name: userRecord.program_name,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
};

/**
 * Single Unified Login Endpoint
 * Allows SuperAdmin/Admin via Email/CNIC, Voter/Candidate via CNIC/Registration Number
 */
const unifiedLogin = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      await logLoginAttempt('unknown', identifier, 'failed', ip);
      return res.status(400).json({ message: 'Username/Email/CNIC and password are required.' });
    }

    const cleanIdentifier = identifier.trim();
    const lowerIdentifier = cleanIdentifier.toLowerCase();

    // 1. Check SuperAdmins (by email or name/username e.g. 'superadmin')
    const superadminRes = await db.query(
      'SELECT * FROM superadmins WHERE LOWER(email) = $1 OR LOWER(name) = $1',
      [lowerIdentifier]
    );
    if (superadminRes.rows.length > 0) {
      const superadmin = superadminRes.rows[0];
      const isMatch = await bcrypt.compare(password, superadmin.password_hash);
      if (isMatch) {
        await logLoginAttempt('superadmin', superadmin.email, 'success', ip);
        const token = jwt.sign(
          { id: superadmin.id, role: 'superadmin', name: superadmin.name, email: superadmin.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );
        return res.status(200).json({
          message: 'SuperAdmin login successful.',
          token,
          user: { id: superadmin.id, name: superadmin.name, email: superadmin.email, role: 'superadmin', user_role: 'superadmin' },
        });
      }
    }

    // 2. Check Admins (by Email, Name, or First Name e.g. 'laiba')
    const adminRes = await db.query(
      `SELECT a.*, p.can_view_candidates, p.can_approve_candidates, p.can_view_students,
              p.can_approve_students, p.can_view_results, p.can_submit_results, p.can_extend_voting_time
       FROM admins a
       LEFT JOIN admin_permissions p ON a.id = p.admin_id
       WHERE LOWER(a.email) = $1 OR LOWER(a.name) = $1 OR LOWER(SPLIT_PART(a.name, ' ', 1)) = $1`,
      [lowerIdentifier]
    );
    if (adminRes.rows.length > 0) {
      const admin = adminRes.rows[0];
      if (admin.status !== 'inactive' && admin.status !== 'suspended') {
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (isMatch) {
          await logLoginAttempt('admin', admin.email, 'success', ip);
          const token = jwt.sign(
            {
              id: admin.id,
              role: 'admin',
              level: admin.level,
              university_id: admin.university_id,
              faculty_id: admin.faculty_id,
              department_id: admin.department_id,
              name: admin.name,
              email: admin.email,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          return res.status(200).json({
            message: 'Admin login successful.',
            token,
            user: {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              role: 'admin',
              user_role: 'admin',
              level: admin.level,
              university_id: admin.university_id,
              faculty_id: admin.faculty_id,
              department_id: admin.department_id,
              permissions: {
                can_view_candidates: admin.can_view_candidates,
                can_approve_candidates: admin.can_approve_candidates,
                can_view_students: admin.can_view_students,
                can_approve_students: admin.can_approve_students,
                can_view_results: admin.can_view_results,
                can_submit_results: admin.can_submit_results,
                can_extend_voting_time: admin.can_extend_voting_time,
              },
            },
          });
        }
      }
    }

    // 3. Check Candidates first (by CNIC, Reg Number, or Email)
    const candQuery = `
      SELECT c.*, c.name as full_name, u.university_name, f.faculty_name, d.department_name, p.program_name
      FROM candidates c
      LEFT JOIN universities u ON c.university_id = u.id
      LEFT JOIN faculties f ON c.faculty_id = f.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE LOWER(c.email) = $1 OR LOWER(c.cnic) = $1 OR LOWER(c.registration_number) = $1
    `;
    const candRes = await db.query(candQuery, [lowerIdentifier]);
    if (candRes.rows && candRes.rows.length > 0) {
      const candidate = candRes.rows[0];
      if (candidate.status !== 'locked') {
        const isMatch = await bcrypt.compare(password, candidate.password_hash);
        if (isMatch) {
          await logLoginAttempt('candidate', candidate.email, 'success', ip);
          const token = jwt.sign(
            {
              id: candidate.id,
              role: 'candidate',
              user_role: 'candidate',
              university_id: candidate.university_id,
              faculty_id: candidate.faculty_id,
              department_id: candidate.department_id,
              program_id: candidate.program_id,
              cnic: candidate.cnic,
              registration_number: candidate.registration_number,
              email: candidate.email,
              full_name: candidate.full_name || candidate.name,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          return res.status(200).json({
            message: 'Candidate login successful.',
            token,
            user: {
              id: candidate.id,
              role: 'candidate',
              user_role: 'candidate',
              full_name: candidate.full_name || candidate.name || 'Candidate',
              father_name: candidate.father_name,
              mobile_number: candidate.mobile_number,
              cnic: candidate.cnic,
              registration_number: candidate.registration_number,
              email: candidate.email,
              profile_image_url: candidate.profile_image_url || candidate.photo_url,
              photo_url: candidate.profile_image_url || candidate.photo_url,
              university_id: candidate.university_id,
              university_name: candidate.university_name,
              faculty_name: candidate.faculty_name,
              department_name: candidate.department_name,
              program_name: candidate.program_name,
            },
          });
        }
      }
    }

    // 4. Check Voters (by CNIC, Reg Number, or Email)
    const voterQuery = `
      SELECT v.*, u.university_name, f.faculty_name, d.department_name, p.program_name
      FROM voters v
      LEFT JOIN universities u ON v.university_id = u.id
      LEFT JOIN faculties f ON v.faculty_id = f.id
      LEFT JOIN departments d ON v.department_id = d.id
      LEFT JOIN programs p ON v.program_id = p.id
      WHERE LOWER(v.email) = $1 OR LOWER(v.cnic) = $1 OR LOWER(v.registration_number) = $1
    `;
    const voterRes = await db.query(voterQuery, [lowerIdentifier]);
    if (voterRes.rows && voterRes.rows.length > 0) {
      const voter = voterRes.rows[0];
      if (voter.status !== 'locked') {
        const isMatch = await bcrypt.compare(password, voter.password_hash);
        if (isMatch) {
          await logLoginAttempt('voter', voter.email, 'success', ip);
          const token = jwt.sign(
            {
              id: voter.id,
              role: 'voter',
              user_role: 'voter',
              university_id: voter.university_id,
              faculty_id: voter.faculty_id,
              department_id: voter.department_id,
              program_id: voter.program_id,
              cnic: voter.cnic,
              registration_number: voter.registration_number,
              email: voter.email,
              full_name: voter.full_name,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          return res.status(200).json({
            message: 'Voter login successful.',
            token,
            user: {
              id: voter.id,
              role: 'voter',
              user_role: 'voter',
              full_name: voter.full_name || 'Voter',
              father_name: voter.father_name,
              mobile_number: voter.mobile_number,
              cnic: voter.cnic,
              registration_number: voter.registration_number,
              email: voter.email,
              profile_image_url: voter.profile_image_url,
              photo_url: voter.profile_image_url,
              university_id: voter.university_id,
              university_name: voter.university_name,
              faculty_name: voter.faculty_name,
              department_name: voter.department_name,
              program_name: voter.program_name,
            },
          });
        }
      }
    }

    await logLoginAttempt('unknown', cleanIdentifier, 'failed', ip);
    return res.status(401).json({ message: 'Invalid credentials. Please check your username/email/CNIC and password.' });
  } catch (error) {
    console.error('Unified login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

module.exports = {
  superadminLogin,
  adminLogin,
  studentLogin,
  unifiedLogin,
};

