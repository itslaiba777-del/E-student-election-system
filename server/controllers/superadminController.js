const bcrypt = require('bcrypt');
const db = require('../config/db');

/**
 * SuperAdmin Dashboard Overview across system
 */
const getSuperadminDashboard = async (req, res) => {
  try {
    const totalUniversities = await db.query('SELECT COUNT(*) FROM universities');
    const totalAdmins = await db.query('SELECT COUNT(*) FROM admins');
    const totalStudents = await db.query('SELECT COUNT(*) FROM students');
    const totalElections = await db.query('SELECT COUNT(*) FROM elections');

    return res.status(200).json({
      metrics: {
        universities: parseInt(totalUniversities.rows[0].count, 10),
        admins: parseInt(totalAdmins.rows[0].count, 10),
        students: parseInt(totalStudents.rows[0].count, 10),
        elections: parseInt(totalElections.rows[0].count, 10),
      },
    });
  } catch (error) {
    console.error('Superadmin dashboard error:', error);
    return res.status(500).json({ message: 'Server error loading superadmin dashboard.' });
  }
};

/**
 * Create Admin Account with Granular Permissions & Default Password (firstname123)
 */
const createAdmin = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const {
      name,
      email,
      password,
      level, // 'university', 'faculty', 'department'
      university_id = 1,
      faculty_id,
      department_id,
      permissions = {},
    } = req.body;

    if (!name || !email || !level) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Name, email, and level are required.' });
    }

    if (!['university', 'faculty', 'department'].includes(level)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid admin level specified.' });
    }

    // Determine default username & password: firstname + '123'
    const firstName = name.trim().split(' ')[0];
    const defaultPassword = password && password.trim() ? password.trim() : `${firstName.toLowerCase()}123`;

    // Check email uniqueness
    const existing = await client.query('SELECT id FROM admins WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Admin email already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(defaultPassword, salt);

    const adminQuery = `
      INSERT INTO admins (name, email, password_hash, level, university_id, faculty_id, department_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING id, name, email, level, university_id, faculty_id, department_id, status
    `;
    const adminValues = [
      name.trim(),
      email.toLowerCase().trim(),
      password_hash,
      level,
      university_id || 1,
      level !== 'university' ? faculty_id || null : null,
      level === 'department' ? department_id || null : null,
    ];

    const adminRes = await client.query(adminQuery, adminValues);
    const newAdmin = adminRes.rows[0];

    // Insert granular permissions
    const permQuery = `
      INSERT INTO admin_permissions (
        admin_id, can_view_candidates, can_approve_candidates, can_view_students,
        can_approve_students, can_view_results, can_submit_results, can_extend_voting_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const permValues = [
      newAdmin.id,
      permissions.can_view_candidates !== undefined ? !!permissions.can_view_candidates : true,
      permissions.can_approve_candidates !== undefined ? !!permissions.can_approve_candidates : true,
      permissions.can_view_students !== undefined ? !!permissions.can_view_students : true,
      permissions.can_approve_students !== undefined ? !!permissions.can_approve_students : true,
      permissions.can_view_results !== undefined ? !!permissions.can_view_results : true,
      permissions.can_submit_results !== undefined ? !!permissions.can_submit_results : true,
      permissions.can_extend_voting_time !== undefined ? !!permissions.can_extend_voting_time : true,
    ];

    const permRes = await client.query(permQuery, permValues);

    await client.query('COMMIT');

    return res.status(201).json({
      message: `Admin account created successfully. Default password: ${defaultPassword}`,
      admin: {
        ...newAdmin,
        username: firstName.toLowerCase(),
        default_password: defaultPassword,
        permissions: permRes.rows[0],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create admin error:', error);
    return res.status(500).json({ message: 'Server error creating admin account.' });
  } finally {
    client.release();
  }
};

/**
 * SuperAdmin Change/Reset Admin Password
 */
const updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.trim().length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password.trim(), salt);

    const result = await db.query(
      'UPDATE admins SET password_hash = $1 WHERE id = $2 RETURNING id, name, email',
      [password_hash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    return res.status(200).json({
      message: `Password updated successfully for admin ${result.rows[0].name}.`,
      admin: result.rows[0],
    });
  } catch (error) {
    console.error('Update admin password error:', error);
    return res.status(500).json({ message: 'Server error resetting admin password.' });
  }
};

/**
 * Get All Admins List with Permissions
 */
const getAllAdmins = async (req, res) => {
  try {
    const query = `
      SELECT a.id, a.name, a.email, a.level, a.status, a.created_at,
             u.university_name, f.faculty_name, d.department_name,
             p.can_view_candidates, p.can_approve_candidates, p.can_view_students,
             p.can_approve_students, p.can_view_results, p.can_submit_results, p.can_extend_voting_time
      FROM admins a
      LEFT JOIN universities u ON a.university_id = u.id
      LEFT JOIN faculties f ON a.faculty_id = f.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN admin_permissions p ON a.id = p.admin_id
      ORDER BY a.created_at DESC
    `;
    const result = await db.query(query);
    return res.status(200).json({ admins: result.rows });
  } catch (error) {
    console.error('Get all admins error:', error);
    return res.status(500).json({ message: 'Server error fetching admins.' });
  }
};

/**
 * Get Public System Settings & Branding
 */
const getSystemSettings = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM system_settings ORDER BY id ASC LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(200).json({
        settings: {
          university_name: 'COMSATS University',
          campus_name: 'Main Campus',
          logo_url: '/uploads/default-logo.png',
          registration_number_pattern: '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
        },
      });
    }
    return res.status(200).json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get system settings error:', error);
    return res.status(500).json({ message: 'Server error fetching system settings.' });
  }
};

/**
 * Update System Settings & Global University Branding (SuperAdmin)
 */
const updateSystemSettings = async (req, res) => {
  try {
    const {
      university_name,
      campus_name,
      registration_number_pattern,
      support_email,
      emergency_phone,
    } = req.body;

    let logo_url = null;
    if (req.file) {
      logo_url = `/uploads/${req.file.filename}`;
    }

    const check = await db.query('SELECT id FROM system_settings ORDER BY id ASC LIMIT 1');

    let updated;
    if (check.rows.length === 0) {
      updated = await db.query(
        `INSERT INTO system_settings (university_name, campus_name, logo_url, registration_number_pattern, support_email, emergency_phone)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          university_name || 'COMSATS University',
          campus_name || 'Main Campus',
          logo_url || '/uploads/default-logo.png',
          registration_number_pattern || '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
          support_email || 'support@comsats.edu.pk',
          emergency_phone || '+92 (51) 9247000',
        ]
      );
    } else {
      const id = check.rows[0].id;
      updated = await db.query(
        `UPDATE system_settings
         SET university_name = COALESCE($1, university_name),
             campus_name = COALESCE($2, campus_name),
             logo_url = COALESCE($3, logo_url),
             registration_number_pattern = COALESCE($4, registration_number_pattern),
             support_email = COALESCE($5, support_email),
             emergency_phone = COALESCE($6, emergency_phone),
             updated_at = NOW()
         WHERE id = $7 RETURNING *`,
        [
          university_name ? university_name.trim() : null,
          campus_name ? campus_name.trim() : null,
          logo_url,
          registration_number_pattern ? registration_number_pattern.trim() : null,
          support_email ? support_email.trim() : null,
          emergency_phone ? emergency_phone.trim() : null,
          id,
        ]
      );
    }

    // Also update universities table primary row (ID 1)
    if (university_name) {
      await db.query(
        `INSERT INTO universities (id, university_name, logo_url)
         VALUES (1, $1, $2)
         ON CONFLICT (id) DO UPDATE SET university_name = $1, logo_url = COALESCE($2, universities.logo_url)`,
        [university_name.trim(), logo_url]
      );
    }

    return res.status(200).json({
      message: 'System branding and university settings updated successfully.',
      settings: updated.rows[0],
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    return res.status(500).json({ message: 'Server error updating system settings.' });
  }
};

/**
 * Get All Registered Students / Voters (SuperAdmin View)
 */
const getAllStudents = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.full_name, s.email, s.cnic, s.registration_number, s.status, s.created_at,
              u.university_name, d.department_name
       FROM students s
       LEFT JOIN universities u ON s.university_id = u.id
       LEFT JOIN departments d ON s.department_id = d.id
       ORDER BY s.created_at DESC`
    );
    return res.status(200).json({ students: result.rows });
  } catch (error) {
    console.error('Get all students error:', error);
    return res.status(500).json({ message: 'Server error fetching all students.' });
  }
};

/**
 * Get ONLY Approved Candidates (SuperAdmin View)
 */
const getApprovedCandidates = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.name, c.party, c.manifesto, c.photo_url, c.symbol_image_url, c.status, c.created_at,
              e.title as election_title, e.position_title, d.department_name
       FROM candidates c
       JOIN elections e ON c.election_id = e.id
       LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.status = 'approved'
       ORDER BY c.created_at DESC`
    );
    return res.status(200).json({ candidates: result.rows });
  } catch (error) {
    console.error('Get approved candidates error:', error);
    return res.status(500).json({ message: 'Server error fetching approved candidates.' });
  }
};

module.exports = {
  getSuperadminDashboard,
  createAdmin,
  updateAdminPassword,
  getAllAdmins,
  getSystemSettings,
  updateSystemSettings,
  getAllStudents,
  getApprovedCandidates,
};
