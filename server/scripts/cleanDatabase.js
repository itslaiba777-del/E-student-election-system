const bcrypt = require('bcrypt');
const db = require('../config/db');

async function cleanDatabase() {
  try {
    console.log('--- STARTING DATABASE RESET & CLEANUP ---');

    // 1. Truncate all tables except system_settings
    console.log('Truncating data tables...');
    await db.query(`
      TRUNCATE login_audit_log, otp_records, votes, voting_status, 
               candidates, elections, admin_permissions, admins, superadmins, 
               students, student_records, programs, departments, faculties, universities,
               system_settings
      RESTART IDENTITY CASCADE;
    `);
    console.log('✔ All data tables truncated and sequence identities reset.');

    // 2. Insert single default SuperAdmin account
    const superadminPass = await bcrypt.hash('superadmin@', 10);
    await db.query(`
      INSERT INTO superadmins (name, email, password_hash)
      VALUES ('System SuperAdmin', 'superadmin@gmail.com', $1);
    `, [superadminPass]);
    console.log('✔ Fresh SuperAdmin created (superadmin@gmail.com / superadmin@).');

    // 3. Ensure system_settings has required default values
    await db.query(`
      INSERT INTO system_settings 
      (otp_expiry_minutes, session_timeout_minutes, face_attempt_limit, otp_attempt_limit, enforce_mfa, ip_restriction, support_email, emergency_phone)
      VALUES (5, 30, 1, 2, true, false, 'support@campusvote.edu', '+1 (555) 012-3456');
    `);
    console.log('✔ Default system_settings created (otp_expiry=5, session_timeout=30, otp_limit=2, face_limit=1).');

    // 4. Verify table row counts
    const tables = [
      'universities',
      'faculties',
      'departments',
      'programs',
      'student_records',
      'students',
      'superadmins',
      'admins',
      'admin_permissions',
      'elections',
      'candidates',
      'voting_status',
      'votes',
      'otp_records',
      'system_settings',
      'login_audit_log',
    ];

    console.log('\n--- VERIFYING TABLE ROW COUNTS ---');
    for (const table of tables) {
      const res = await db.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(res.rows[0].count, 10);
      console.log(`Table '${table}': ${count} row(s)`);
    }

    // Print superadmins table content
    const saRes = await db.query('SELECT id, name, email, created_at FROM superadmins');
    console.log('\nSuperadmins Table Content:', saRes.rows);

    // Print system_settings table content
    const sysRes = await db.query('SELECT otp_expiry_minutes, session_timeout_minutes, otp_attempt_limit, face_attempt_limit FROM system_settings');
    console.log('System Settings Content:', sysRes.rows);

    console.log('\n--- DATABASE RESET SUCCESSFULLY COMPLETED ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database cleanup failed:', err);
    process.exit(1);
  }
}

cleanDatabase();
