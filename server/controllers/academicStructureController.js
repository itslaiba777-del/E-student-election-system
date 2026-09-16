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
    const { faculty_name, name, university_id } = req.body;
    const fName = (faculty_name || name || '').trim();
    if (!fName) {
      return res.status(400).json({ message: 'Faculty name is required.' });
    }
    const uniId = university_id || 1;
    const result = await db.query(
      'INSERT INTO faculties (faculty_name, university_id) VALUES ($1, $2) RETURNING *',
      [fName, uniId]
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
    const { department_name, name, faculty_id } = req.body;
    const dName = (department_name || name || '').trim();
    if (!dName) {
      return res.status(400).json({ message: 'Department name is required.' });
    }
    const facId = faculty_id || 1;
    const result = await db.query(
      'INSERT INTO departments (department_name, faculty_id) VALUES ($1, $2) RETURNING *',
      [dName, facId]
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
    const { program_name, name, department_id } = req.body;
    const pName = (program_name || name || '').trim();
    if (!pName || !department_id) {
      return res.status(400).json({ message: 'Program name and department ID are required.' });
    }
    const result = await db.query(
      'INSERT INTO programs (program_name, department_id) VALUES ($1, $2) RETURNING *',
      [pName, department_id]
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

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM programs WHERE department_id = $1', [id]);
    await db.query('DELETE FROM departments WHERE id = $1', [id]);
    await db.query('DELETE FROM faculties WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Department and associated degree programs deleted successfully.' });
  } catch (error) {
    console.error('Delete department error:', error);
    return res.status(500).json({ message: 'Server error deleting department.' });
  }
};

const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM programs WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Degree Program deleted successfully.' });
  } catch (error) {
    console.error('Delete program error:', error);
    return res.status(500).json({ message: 'Server error deleting program.' });
  }
};

const getHierarchy = async (req, res) => {
  try {
    const facultiesRes = await db.query('SELECT * FROM faculties ORDER BY id ASC');
    const deptsRes = await db.query('SELECT * FROM departments ORDER BY id ASC');
    const progsRes = await db.query('SELECT * FROM programs ORDER BY id ASC');

    const faculties = facultiesRes.rows || [];
    const departments = deptsRes.rows || [];
    const programs = progsRes.rows || [];

    let hierarchy = faculties.map((f) => ({
      id: f.id,
      university_id: f.university_id || 1,
      name: f.faculty_name,
      expanded: true,
      departments: departments
        .filter((d) => d.faculty_id == f.id || (!d.faculty_id && f.id == 1))
        .map((d) => ({
          id: d.id,
          faculty_id: f.id,
          name: d.department_name,
          expanded: true,
          programs: programs
            .filter((p) => p.department_id == d.id)
            .map((p) => ({
              id: p.id,
              department_id: d.id,
              name: p.program_name,
            })),
        })),
    }));

    const assignedDeptIds = new Set();
    hierarchy.forEach((f) => f.departments.forEach((d) => assignedDeptIds.add(d.id)));
    const unassignedDepts = departments.filter((d) => !assignedDeptIds.has(d.id));

    if (unassignedDepts.length > 0) {
      hierarchy.push({
        id: 999,
        university_id: 1,
        name: 'Academic Departments',
        expanded: true,
        departments: unassignedDepts.map((d) => ({
          id: d.id,
          faculty_id: 999,
          name: d.department_name,
          expanded: true,
          programs: programs
            .filter((p) => p.department_id == d.id)
            .map((p) => ({
              id: p.id,
              department_id: d.id,
              name: p.program_name,
            })),
        })),
      });
    }

    return res.status(200).json({ faculties: hierarchy });
  } catch (err) {
    console.error('Get hierarchy error:', err);
    return res.status(500).json({ message: 'Server error fetching academic hierarchy.' });
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
  deleteDepartment,
  deleteProgram,
  getHierarchy,
};
