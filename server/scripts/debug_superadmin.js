require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcrypt');

async function debugSuperAdmin() {
  try {
    console.log('Truncating superadmins...');
    await db.query('TRUNCATE superadmins RESTART IDENTITY CASCADE');

    const pass = await bcrypt.hash('superadmin123', 10);
    const res = await db.query(
      "INSERT INTO superadmins (name, email, password_hash) VALUES ('superadmin', 'superadmin@system.com', $1) RETURNING *",
      [pass]
    );
    console.log('Inserted SuperAdmin:', res.rows[0]);

    const countRes = await db.query('SELECT COUNT(*) FROM superadmins');
    console.log('Superadmins count:', countRes.rows[0].count);
    process.exit(0);
  } catch (err) {
    console.error('Superadmin Insert Error:', err);
    process.exit(1);
  }
}

debugSuperAdmin();
