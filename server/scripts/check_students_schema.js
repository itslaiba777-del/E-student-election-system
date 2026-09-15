require('dotenv').config();
const db = require('../config/db');

async function checkSchema() {
  try {
    const res = await db.query('SELECT * FROM students LIMIT 1');
    if (res.fields) {
      console.log('Fields in students table:');
      res.fields.forEach(f => console.log(' - ' + f.name));
    }
    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err);
    process.exit(1);
  }
}

checkSchema();
