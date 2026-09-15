require('dotenv').config();
const db = require('../config/db');

async function checkConn() {
  try {
    const res = await db.query('SELECT current_schema(), current_user, version()');
    console.log('Connection info:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Connection check error:', err);
    process.exit(1);
  }
}

checkConn();
