const db = require('../config/db');

/**
 * Get Admin Dashboard Overview
 */
const getAdminDashboard = async (req, res) => {
  try {
    const { level, university_id, faculty_id, department_id } = req.adminScope;

    let studentWhere = 'WHERE university_id = $1';
    let candidateWhere = 'WHERE e.university_id = $1';
    let params = [university_id];

    if (level === 'faculty' && faculty_id) {
      studentWhere += ' AND faculty_id = $2';
      candidateWhere += ' AND c.faculty_id = $2';
      params.push(faculty_id);
    } else if (level === 'department' && department_id) {
      studentWhere += ' AND department_id = $2';
      candidateWhere += ' AND c.department_id = $2';
      params.push(department_id);
    }

    const totalStudentsResult = await db.query(`SELECT COUNT(*) FROM students ${studentWhere}`, params);
    const totalCandidatesResult = await db.query(
      `SELECT COUNT(*) FROM candidates c JOIN elections e ON c.election_id = e.id ${candidateWhere}`,
      params
    );
    const activeElectionsResult = await db.query(
      `SELECT COUNT(*) FROM elections WHERE university_id = $1 AND status = 'active'`,
      [university_id]
    );

    return res.status(200).json({
      scope: { level, university_id, faculty_id, department_id },
      metrics: {
        total_students: parseInt(totalStudentsResult.rows[0].count, 10),
        total_candidates: parseInt(totalCandidatesResult.rows[0].count, 10),
        active_elections: parseInt(activeElectionsResult.rows[0].count, 10),
      },
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    return res.status(500).json({ message: 'Server error loading admin dashboard.' });
  }
};

/**
 * Get Students List (Enforces can_view_students permission and level scope)
 */
const getStudentsList = async (req, res) => {
  try {
    const { level, university_id, faculty_id, department_id } = req.adminScope || { level: 'university', university_id: 1 };

    let whereClauses = ['s.university_id = $1'];
    let params = [university_id];

    if (level === 'faculty' && faculty_id) {
      params.push(faculty_id);
      whereClauses.push(`s.faculty_id = $${params.length}`);
    } else if (level === 'department' && department_id) {
      params.push(department_id);
      whereClauses.push(`s.department_id = $${params.length}`);
    }

    const query = `
      SELECT s.id, s.cnic, s.registration_number, s.email, s.status, s.created_at,
             f.faculty_name, d.department_name, p.program_name
      FROM students s
      JOIN faculties f ON s.faculty_id = f.id
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN programs p ON s.program_id = p.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY s.created_at DESC
    `;

    const result = await db.query(query, params);
    return res.status(200).json({ students: result.rows });
  } catch (error) {
    console.error('Get students list error:', error);
    return res.status(500).json({ message: 'Server error fetching students list.' });
  }
};

/**
 * Update Student Status (Enforces can_approve_students permission)
 */
const updateStudentStatus = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { status } = req.body; // 'active', 'locked', 'pending'

    if (!['active', 'locked', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const result = await db.query(
      'UPDATE students SET status = $1 WHERE id = $2 RETURNING id, registration_number, status',
      [status, student_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    return res.status(200).json({
      message: `Student status updated to '${status}'.`,
      student: result.rows[0],
    });
  } catch (error) {
    console.error('Update student status error:', error);
    return res.status(500).json({ message: 'Server error updating student status.' });
  }
};

/**
 * Get All Departments
 */
const getDepartments = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY department_name ASC');
    return res.status(200).json({ departments: result.rows });
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({ message: 'Server error fetching departments.' });
  }
};

/**
 * Create New Department
 */
const createDepartment = async (req, res) => {
  try {
    const { department_name, department_code } = req.body;

    if (!department_name || !department_name.trim()) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const code = department_code ? department_code.trim().toUpperCase() : department_name.substring(0, 4).toUpperCase();

    const result = await db.query(
      `INSERT INTO departments (university_id, department_name, department_code)
       VALUES (1, $1, $2) RETURNING *`,
      [department_name.trim(), code]
    );

    return res.status(201).json({
      message: `Department '${department_name.trim()}' created successfully.`,
      department: result.rows[0],
    });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({ message: 'Server error creating department.' });
  }
};

module.exports = {
  getAdminDashboard,
  getStudentsList,
  updateStudentStatus,
  getDepartments,
  createDepartment,
};
