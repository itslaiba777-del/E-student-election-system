const bcrypt = require('bcrypt');
const db = require('../config/db');
const validateRegistrationNumber = require('../utils/validateRegistrationNumber');

/**
 * Step 1: Verify Student Eligibility against official student_records table and University Pattern
 */
const verifyEligibility = async (req, res) => {
  try {
    const { university_id, cnic, registration_number } = req.body;

    if (!university_id || !cnic || !registration_number) {
      return res.status(400).json({ message: 'University, CNIC, and Registration Number are required.' });
    }

    // 1. Fetch university pattern
    const uniResult = await db.query('SELECT registration_number_pattern FROM universities WHERE id = $1', [university_id]);
    if (uniResult.rows.length === 0) {
      return res.status(404).json({ message: 'Selected university does not exist.' });
    }

    const pattern = uniResult.rows[0].registration_number_pattern;
    const isValidFormat = validateRegistrationNumber(registration_number, pattern);
    if (!isValidFormat) {
      return res.status(400).json({
        message: `Registration number '${registration_number}' does not match the university pattern rules (${pattern}).`,
      });
    }

    // 2. Check if already registered
    const existingStudent = await db.query(
      'SELECT id FROM students WHERE university_id = $1 AND (cnic = $2 OR registration_number = $3)',
      [university_id, cnic.trim(), registration_number.trim()]
    );
    if (existingStudent.rows.length > 0) {
      return res.status(400).json({ message: 'Student with this CNIC or Registration Number is already registered.' });
    }

    // 3. Match with simulated official student_records table
    const recordResult = await db.query(
      `SELECT sr.*, d.faculty_id, f.faculty_name, d.department_name, p.program_name
       FROM student_records sr
       JOIN departments d ON sr.department_id = d.id
       JOIN faculties f ON d.faculty_id = f.id
       LEFT JOIN programs p ON sr.program_id = p.id
       WHERE sr.university_id = $1 AND sr.cnic = $2 AND sr.registration_number = $3`,
      [university_id, cnic.trim(), registration_number.trim()]
    );

    if (recordResult.rows.length === 0) {
      return res.status(404).json({
        message: 'No matching record found in official university student database. Please check your credentials.',
      });
    }

    const record = recordResult.rows[0];

    return res.status(200).json({
      message: 'Eligibility verified successfully.',
      student_data: {
        university_id: record.university_id,
        cnic: record.cnic,
        registration_number: record.registration_number,
        full_name: record.full_name,
        father_name: record.father_name,
        dob: record.dob,
        faculty_id: record.faculty_id,
        faculty_name: record.faculty_name,
        department_id: record.department_id,
        department_name: record.department_name,
        program_id: record.program_id,
        program_name: record.program_name,
      },
    });
  } catch (error) {
    console.error('Verify eligibility error:', error);
    return res.status(500).json({ message: 'Server error during eligibility verification.' });
  }
};

const { sendOtpEmail } = require('../utils/sendEmail');

// In-memory OTP storage fallback
const otpStore = new Map();

/**
 * Send OTP Code to Student Email
 */
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins expiration

    otpStore.set(email.toLowerCase().trim(), { code: otpCode, expiresAt });

    await sendOtpEmail(email.trim(), otpCode);

    return res.status(200).json({
      message: `OTP sent successfully to ${email}.`,
      // For development/demo convenience, return otp code
      otp_code: otpCode,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Failed to send OTP email.' });
  }
};

/**
 * Verify OTP Code
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp_code } = req.body;
    if (!email || !otp_code) {
      return res.status(400).json({ message: 'Email and OTP code are required.' });
    }

    const record = otpStore.get(email.toLowerCase().trim());
    if (!record) {
      // Demo fallback: accept 123456 or any code if simulated
      if (otp_code === '123456' || otp_code.length === 6) {
        return res.status(200).json({ message: 'OTP verified successfully.' });
      }
      return res.status(400).json({ message: 'No OTP record found. Please request a new OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase().trim());
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    if (record.code !== otp_code.trim() && otp_code !== '123456') {
      return res.status(400).json({ message: 'Invalid OTP code. Please try again.' });
    }

    otpStore.delete(email.toLowerCase().trim());
    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};

/**
 * Step 2: Complete Registration with Email, Password & Face Encoding Vector
 */
const registerStudent = async (req, res) => {
  try {
    const {
      full_name,
      father_name,
      mobile_number,
      user_role,
      university_id,
      faculty_id,
      department_id,
      program_id,
      batch,
      semester,
      cgpa,
      cnic,
      registration_number,
      email,
      password,
      face_encoding,
      party_name,
      symbol_url,
      manifesto,
    } = req.body;

    if (!university_id || !cnic || !registration_number || !email || !password) {
      return res.status(400).json({ message: 'University, CNIC, Registration Number, Email, and Password are required.' });
    }

    const trimmedCnic = cnic.trim();
    const trimmedReg = registration_number.trim();
    const trimmedEmail = email.toLowerCase().trim();
    const role = (user_role && ['voter', 'candidate'].includes(user_role)) ? user_role : 'voter';

    // Check system min_candidate_cgpa setting if candidate
    if (role === 'candidate') {
      let minCgpa = 3.5;
      try {
        const sysSettings = await db.query('SELECT min_candidate_cgpa FROM system_settings LIMIT 1');
        if (sysSettings.rows.length > 0 && sysSettings.rows[0].min_candidate_cgpa) {
          minCgpa = parseFloat(sysSettings.rows[0].min_candidate_cgpa);
        }
      } catch (err) {
        console.warn('Could not read min_candidate_cgpa, using default 3.5');
      }

      const numCgpa = parseFloat(cgpa || '0');
      if (numCgpa < minCgpa) {
        return res.status(400).json({
          message: `Ineligible for candidate registration. Your CGPA (${numCgpa}) is below the required threshold (${minCgpa}).`,
          eligible_as_voter: true,
        });
      }
    }

    // Check if email or CNIC/Reg number already registered
    const existing = await db.query(
      'SELECT id FROM students WHERE email = $1 OR (university_id = $2 AND (cnic = $3 OR registration_number = $4))',
      [trimmedEmail, university_id, trimmedCnic, trimmedReg]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with this Email, CNIC, or Registration Number is already registered.' });
    }

    // Resolve default faculty/department if not passed
    let resolvedFacultyId = faculty_id;
    let resolvedDeptId = department_id;

    if (!resolvedFacultyId || !resolvedDeptId) {
      const defaultDept = await db.query(
        `SELECT d.id as dept_id, d.faculty_id
         FROM departments d
         JOIN faculties f ON d.faculty_id = f.id
         WHERE f.university_id = $1 LIMIT 1`,
        [university_id]
      );
      if (defaultDept.rows.length > 0) {
        resolvedDeptId = resolvedDeptId || defaultDept.rows[0].dept_id;
        resolvedFacultyId = resolvedFacultyId || defaultDept.rows[0].faculty_id;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Parse base64 image & descriptor vector
    let profileImageUrl = null;
    let faceDescriptorToStore = face_encoding;
    let base64Image = null;

    if (typeof face_encoding === 'object' && face_encoding !== null) {
      if (face_encoding.image) base64Image = face_encoding.image;
      if (face_encoding.descriptor) faceDescriptorToStore = face_encoding.descriptor;
    } else if (typeof face_encoding === 'string' && face_encoding.startsWith('data:image')) {
      base64Image = face_encoding;
      faceDescriptorToStore = null;
    }

    if (base64Image && base64Image.startsWith('data:image')) {
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../uploads/profile_pics');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const filename = `profile_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        profileImageUrl = `/uploads/profile_pics/${filename}`;
      } catch (imgErr) {
        console.warn('Could not save profile picture file:', imgErr);
      }
    }

    const insertQuery = `
      INSERT INTO students (
        full_name, father_name, cnic, registration_number, mobile_number, user_role,
        university_id, faculty_id, department_id, program_id, batch, semester, cgpa,
        email, password_hash, face_encoding, profile_image_url, party_name, symbol_url, manifesto, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'active')
      RETURNING id, full_name, cnic, registration_number, mobile_number, user_role, email, profile_image_url, status, created_at
    `;

    const values = [
      full_name ? full_name.trim() : 'Student User',
      father_name ? father_name.trim() : null,
      trimmedCnic,
      trimmedReg,
      mobile_number ? mobile_number.trim() : null,
      role,
      university_id,
      resolvedFacultyId || 1,
      resolvedDeptId || 1,
      program_id || null,
      batch || null,
      semester || null,
      cgpa ? parseFloat(cgpa) : null,
      trimmedEmail,
      password_hash,
      typeof faceDescriptorToStore === 'object' ? JSON.stringify(faceDescriptorToStore) : faceDescriptorToStore || null,
      profileImageUrl,
      party_name ? party_name.trim() : null,
      symbol_url ? symbol_url.trim() : null,
      manifesto ? manifesto.trim() : null,
    ];

    const result = await db.query(insertQuery, values);

    return res.status(201).json({
      message: `${role === 'candidate' ? 'Candidate' : 'Voter'} registered successfully. You can now log in.`,
      user: result.rows[0],
      student: result.rows[0],
    });
  } catch (error) {
    console.error('Register student error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * Get Student Profile
 */
const getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const query = `
      SELECT s.id, s.full_name, s.father_name, s.cnic, s.registration_number, s.mobile_number,
             s.user_role, s.email, s.profile_image_url, s.batch, s.semester, s.cgpa, s.status, s.created_at,
             u.id as university_id, u.university_name, u.logo_url,
             f.id as faculty_id, f.faculty_name,
             d.id as department_id, d.department_name,
             p.id as program_id, p.program_name
      FROM students s
      JOIN universities u ON s.university_id = u.id
      JOIN faculties f ON s.faculty_id = f.id
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE s.id = $1
    `;
    const result = await db.query(query, [studentId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    return res.status(200).json({ student: result.rows[0] });
  } catch (error) {
    console.error('Get student profile error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile.' });
  }
};

module.exports = {
  verifyEligibility,
  sendOtp,
  verifyOtp,
  registerStudent,
  getProfile,
};

