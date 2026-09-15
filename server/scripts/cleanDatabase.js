const bcrypt = require('bcrypt');
const db = require('../config/db');

async function cleanDatabase() {
  try {
    console.log('====================================================');
    console.log('🧹 STARTING DATABASE CLEANUP FOR MANUAL TESTING');
    console.log('====================================================\n');

    // 1. Truncate all tables
    console.log('1. Truncating all database tables...');
    await db.query(`
      TRUNCATE login_audit_log, otp_records, votes, voting_status, 
               candidates, elections, election_schedule_logs, admin_permissions, admins, superadmins, 
               students, student_records, programs, departments, faculties, universities,
               system_settings
      RESTART IDENTITY CASCADE;
    `);
    console.log('   ✅ All tables truncated and identity sequences reset to 1.');

    // 2. Insert ONLY SuperAdmin account (Username: superadmin, Email: superadmin@system.com, Password: superadmin123)
    console.log('\n2. Creating single SuperAdmin account...');
    const superadminPass = await bcrypt.hash('superadmin123', 10);
    await db.query(`
      INSERT INTO superadmins (name, email, password_hash)
      VALUES ('superadmin', 'superadmin@system.com', $1);
    `, [superadminPass]);
    console.log('   ✅ Created SuperAdmin:');
    console.log('      • Username / Email : superadmin  (or superadmin@system.com)');
    console.log('      • Password         : superadmin123');

    // 3. Ensure system_settings has required default branding
    console.log('\n3. Initializing default system branding...');
    await db.query(`
      INSERT INTO system_settings 
      (university_name, campus_name, logo_url, registration_number_pattern, otp_expiry_minutes, session_timeout_minutes, face_attempt_limit, otp_attempt_limit, enforce_mfa, ip_restriction, support_email, emergency_phone)
      VALUES ('COMSATS University Islamabad', 'Main Campus', '/uploads/default-logo.png', '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$', 5, 30, 1, 5, true, false, 'support@campusvote.edu', '+1 (555) 012-3456');
    `);
    console.log('   ✅ Default system_settings created.');

    // 4. Verify table row counts
    const tables = [
      'superadmins',
      'admins',
      'universities',
      'faculties',
      'departments',
      'programs',
      'students',
      'elections',
      'candidates',
      'votes',
      'system_settings',
    ];

    console.log('\n====================================================');
    console.log('📊 DATABASE ROW COUNTS SUMMARY:');
    console.log('====================================================');
    for (const table of tables) {
      const res = await db.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(res.rows[0].count, 10);
      console.log(`   • Table '${table}': ${count} row(s)`);
    }

    console.log('\n====================================================');
    console.log('✨ DATABASE IS CLEAN & READY FOR MANUAL TESTING!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database cleanup failed:', err);
    process.exit(1);
  }
}

cleanDatabase();
