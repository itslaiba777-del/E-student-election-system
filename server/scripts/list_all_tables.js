require('dotenv').config();
const db = require('../config/db');

async function listTables() {
  try {
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Public Tables in DB:');
    res.rows.forEach(t => console.log(' - ' + t.table_name));
    process.exit(0);
  } catch (err) {
    console.error('List tables error:', err);
    process.exit(1);
  }
}

listTables();
