const db = require('../config/db');

/**
 * List all universities
 */
const getUniversities = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM universities ORDER BY university_name ASC');
    return res.status(200).json({ universities: result.rows });
  } catch (error) {
    console.error('Get universities error:', error);
    return res.status(500).json({ message: 'Server error fetching universities.' });
  }
};

/**
 * Get university details by ID
 */
const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM universities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'University not found.' });
    }
    return res.status(200).json({ university: result.rows[0] });
  } catch (error) {
    console.error('Get university by id error:', error);
    return res.status(500).json({ message: 'Server error fetching university details.' });
  }
};

/**
 * Create a new university
 */
const createUniversity = async (req, res) => {
  try {
    const { university_name, registration_number_pattern } = req.body;
    let logo_url = null;

    if (req.file) {
      logo_url = `/uploads/${req.file.filename}`;
    }

    if (!university_name) {
      return res.status(400).json({ message: 'University name is required.' });
    }

    const defaultPattern = '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$';
    const query = `
      INSERT INTO universities (university_name, logo_url, registration_number_pattern)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [
      university_name.trim(),
      logo_url,
      registration_number_pattern ? registration_number_pattern.trim() : defaultPattern,
    ];

    const result = await db.query(query, values);
    return res.status(201).json({
      message: 'University created successfully.',
      university: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'A university with this name already exists.' });
    }
    console.error('Create university error:', error);
    return res.status(500).json({ message: 'Server error creating university.' });
  }
};

module.exports = {
  getUniversities,
  getUniversityById,
  createUniversity,
};
