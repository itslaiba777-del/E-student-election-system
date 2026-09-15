require('dotenv').config();
const db = require('../config/db');

async function seedAcademic() {
  try {
    console.log('Seeding academic structure...');

    // Insert University
    await db.query(`
      INSERT INTO universities (id, university_name, logo_url)
      VALUES (1, 'COMSATS University Islamabad', '/uploads/default-logo.png')
      ON CONFLICT (id) DO NOTHING
    `);

    const departmentsData = [
      { id: 1, name: 'Computer Science Department', code: 'CS', progs: ['BS Computer Science (BSCS)', 'BS Software Engineering (BSSE)', 'BS Artificial Intelligence (BSAI)'] },
      { id: 2, name: 'Humanities & Languages Department', code: 'HUM', progs: ['BS English Literature', 'BS Urdu Studies'] },
      { id: 3, name: 'Mathematics Department', code: 'MATH', progs: ['BS Mathematics (BSMATH)', 'BS Economics (BSECON)'] },
      { id: 4, name: 'Management Sciences Department', code: 'MGMT', progs: ['Bachelor of Business Administration (BBA)', 'Master of Business Administration (MBA)'] },
    ];

    for (const d of departmentsData) {
      await db.query(`
        INSERT INTO faculties (id, faculty_name, university_id)
        VALUES ($1, $2, 1)
        ON CONFLICT (id) DO NOTHING
      `, [d.id, d.name]);

      await db.query(`
        INSERT INTO departments (id, department_name, department_code, faculty_id, university_id)
        VALUES ($1, $2, $3, $1, 1)
        ON CONFLICT (id) DO NOTHING
      `, [d.id, d.name, d.code]);

      let progIdOffset = d.id * 100;
      for (let i = 0; i < d.progs.length; i++) {
        const pName = d.progs[i];
        const pId = progIdOffset + i + 1;
        await db.query(`
          INSERT INTO programs (id, program_name, department_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO NOTHING
        `, [pId, pName, d.id]);
      }
    }

    console.log('✅ Academic structure (Departments & Degree Programs) seeded into Supabase DB successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedAcademic();
