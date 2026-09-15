const bcrypt = require('bcrypt');
const db = require('../config/db');

async function resetSuperAdminPassword() {
  try {
    const pass = 'superadmin@';
    const hash = await bcrypt.hash(pass, 10);
    console.log('Generated hash for superadmin@:', hash);

    const match = await bcrypt.compare(pass, hash);
    console.log('Self check bcrypt match:', match);

    const res = await db.query(
      'UPDATE superadmins SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [hash, 'superadmin@gmail.com']
    );

    console.log('Updated superadmin rows:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
}

resetSuperAdminPassword();
