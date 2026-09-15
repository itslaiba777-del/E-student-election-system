const db = require('../config/db');

// --- FACULTIES ---

const getFacultiesByUniversity = async (req, res) => {
  try {
    const { university_id } = req.params;
    const result = await db.query('SELECT * FROM faculties WHERE university_id = $1 ORDER BY faculty_name ASC', [university_id]);
    return res.status(200).json({ faculties: result.rows });
  } catch (error) {
    console.error('Get faculties error:', error);
    return res.status(500).json({ message: 'Server error fetching faculties.' });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { faculty_name, university_id } = req.body;
    if (!faculty_name || !university_id) {
      return res.status(400).json({ message: 'Faculty name and university ID are required.' });
    }
    const result = await db.query(
      'INSERT INTO faculties (faculty_name, university_id) VALUES ($1, $2) RETURNING *',
      [faculty_name.trim(), university_id]
    );
    return res.status(201).json({ message: 'Faculty created.', faculty: result.rows[0] });
  } catch (error) {
    console.error('Create faculty error:', error);
    return res.status(500).json({ message: 'Server error creating faculty.' });
  }
};

// --- DEPARTMENTS ---

const getDepartmentsByFaculty = async (req, res) => {
  try {
    const { faculty_id } = req.params;
    const result = await db.query('SELECT * FROM departments WHERE faculty_id = $1 ORDER BY department_name ASC', [faculty_id]);
    return res.status(200).json({ departments: result.rows });
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({ message: 'Server error fetching departments.' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { department_name, faculty_id } = req.body;
    if (!department_name || !faculty_id) {
      return res.status(400).json({ message: 'Department name and faculty ID are required.' });
    }
    const result = await db.query(
      'INSERT INTO departments (department_name, faculty_id) VALUES ($1, $2) RETURNING *',
      [department_name.trim(), faculty_id]
    );
    return res.status(201).json({ message: 'Department created.', department: result.rows[0] });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({ message: 'Server error creating department.' });
  }
};

// --- PROGRAMS ---

const getProgramsByDepartment = async (req, res) => {
  try {
    const { department_id } = req.params;
    const result = await db.query('SELECT * FROM programs WHERE department_id = $1 ORDER BY program_name ASC', [department_id]);
    return res.status(200).json({ programs: result.rows });
  } catch (error) {
    console.error('Get programs error:', error);
    return res.status(500).json({ message: 'Server error fetching programs.' });
  }
};

const createProgram = async (req, res) => {
  try {
    const { program_name, department_id } = req.body;
    if (!program_name || !department_id) {
      return res.status(400).json({ message: 'Program name and department ID are required.' });
    }
    const result = await db.query(
      'INSERT INTO programs (program_name, department_id) VALUES ($1, $2) RETURNING *',
      [program_name.trim(), department_id]
    );
    return res.status(201).json({ message: 'Program created.', program: result.rows[0] });
  } catch (error) {
    console.error('Create program error:', error);
    return res.status(500).json({ message: 'Server error creating program.' });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM departments ORDER BY id ASC');
    return res.status(200).json({ departments: result.rows });
  } catch (error) {
    console.error('Get all departments error:', error);
    return res.status(500).json({ message: 'Server error fetching departments.' });
  }
};

const getAllPrograms = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM programs ORDER BY id ASC');
    return res.status(200).json({ programs: result.rows });
  } catch (error) {
    console.error('Get all programs error:', error);
    return res.status(500).json({ message: 'Server error fetching programs.' });
  }
};

const getPublicSettings = async (req, res) => {
  try {
    const result = await db.query('SELECT university_name, campus_name, logo_url FROM system_settings LIMIT 1');
    const settings = result.rows && result.rows[0] ? result.rows[0] : {
      university_name: 'COMSATS University Islamabad',
      campus_name: 'Main Campus',
      logo_url: '/uploads/default-logo.png'
    };
    return res.status(200).json({ settings });
  } catch (err) {
    return res.status(200).json({
      settings: {
        university_name: 'COMSATS University Islamabad',
        campus_name: 'Main Campus',
        logo_url: '/uploads/default-logo.png'
      }
    });
  }
};

module.exports = {
  getFacultiesByUniversity,
  createFaculty,
  getDepartmentsByFaculty,
  createDepartment,
  getProgramsByDepartment,
  createProgram,
  getAllDepartments,
  getAllPrograms,
  getPublicSettings,
};
