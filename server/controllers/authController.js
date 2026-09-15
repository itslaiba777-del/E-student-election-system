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

    const query = `
      SELECT s.*, u.university_name, f.faculty_name, d.department_name, p.program_name
      FROM students s
      JOIN universities u ON s.university_id = u.id
      JOIN faculties f ON s.faculty_id = f.id
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE s.university_id = $1 AND (s.cnic = $2 OR s.registration_number = $2)
    `;
    const result = await db.query(query, [university_id, identifier.trim()]);
    if (result.rows.length === 0) {
      await logLoginAttempt('student', identifier, 'failed', ip);
      return res.status(401).json({ message: 'Incorrect credentials or record not found.' });
    }

    const student = result.rows[0];
    if (student.status === 'locked') {
      await logLoginAttempt('student', identifier, 'failed', ip);
      return res.status(403).json({ message: 'Account is locked. Please contact university admin.' });
    }

    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      await logLoginAttempt('student', identifier, 'failed', ip);
      return res.status(401).json({ message: 'Incorrect credentials.' });
    }

    await logLoginAttempt('student', student.email, 'success', ip);

    const token = jwt.sign(
      {
        id: student.id,
        role: student.user_role || 'voter',
        user_role: student.user_role || 'voter',
        university_id: student.university_id,
        faculty_id: student.faculty_id,
        department_id: student.department_id,
        program_id: student.program_id,
        cnic: student.cnic,
        registration_number: student.registration_number,
        email: student.email,
        full_name: student.full_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: `${student.user_role === 'candidate' ? 'Candidate' : 'Voter'} login successful.`,
      token,
      user: {
        id: student.id,
        role: student.user_role || 'voter',
        user_role: student.user_role || 'voter',
        full_name: student.full_name || 'Student User',
        mobile_number: student.mobile_number,
        cnic: student.cnic,
        registration_number: student.registration_number,
        email: student.email,
        university_id: student.university_id,
        university_name: student.university_name,
        faculty_name: student.faculty_name,
        department_name: student.department_name,
        program_name: student.program_name,
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

    // 3. Check Students / Candidates (by CNIC, Reg Number, or Email)
    const studentQuery = `
      SELECT s.*, u.university_name, f.faculty_name, d.department_name, p.program_name
      FROM students s
      JOIN universities u ON s.university_id = u.id
      JOIN faculties f ON s.faculty_id = f.id
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE LOWER(s.email) = $1 OR s.cnic = $2 OR s.registration_number = $2
    `;
    const studentRes = await db.query(studentQuery, [lowerIdentifier, cleanIdentifier]);
    if (studentRes.rows.length > 0) {
      const student = studentRes.rows[0];
      if (student.status !== 'locked') {
        const isMatch = await bcrypt.compare(password, student.password_hash);
        if (isMatch) {
          await logLoginAttempt('student', student.email, 'success', ip);
          const token = jwt.sign(
            {
              id: student.id,
              role: student.user_role || 'voter',
              user_role: student.user_role || 'voter',
              university_id: student.university_id,
              faculty_id: student.faculty_id,
              department_id: student.department_id,
              program_id: student.program_id,
              cnic: student.cnic,
              registration_number: student.registration_number,
              email: student.email,
              full_name: student.full_name,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          return res.status(200).json({
            message: `${student.user_role === 'candidate' ? 'Candidate' : 'Voter'} login successful.`,
            token,
            user: {
              id: student.id,
              role: student.user_role || 'voter',
              user_role: student.user_role || 'voter',
              full_name: student.full_name || 'Student User',
              mobile_number: student.mobile_number,
              cnic: student.cnic,
              registration_number: student.registration_number,
              email: student.email,
              university_id: student.university_id,
              university_name: student.university_name,
              faculty_name: student.faculty_name,
              department_name: student.department_name,
              program_name: student.program_name,
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

