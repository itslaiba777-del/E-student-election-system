require('dotenv').config();
const db = require('../config/db');

async function inspect() {
  try {
    const uni = await db.query('SELECT * FROM universities LIMIT 5');
    console.log('Universities rows:', uni.rows);
    const depts = await db.query('SELECT * FROM departments LIMIT 5');
    console.log('Departments rows:', depts.rows);
    const progs = await db.query('SELECT * FROM programs LIMIT 5');
    console.log('Programs rows:', progs.rows);
    process.exit(0);
  } catch (err) {
    console.error('Inspect error:', err);
    process.exit(1);
  }
}

inspect();
