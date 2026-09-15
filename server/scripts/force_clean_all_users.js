require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcrypt');

async function forceCleanAllUsers() {
  console.log('====================================================');
  console.log('🧹 FORCE CLEANING ALL USERS & DATA FROM DATABASE');
  console.log('====================================================\n');

  try {
    // 1. Execute SQL DELETE / TRUNCATE on all tables
    console.log('1. Deleting ALL users, students, admins, candidates, votes...');
    await db.query('DELETE FROM login_audit_log;');
    await db.query('DELETE FROM otp_records;');
    await db.query('DELETE FROM votes;');
    await db.query('DELETE FROM voting_status;');
    await db.query('DELETE FROM candidates;');
    await db.query('DELETE FROM elections;');
    await db.query('DELETE FROM election_schedule_logs;');
    await db.query('DELETE FROM admin_permissions;');
    await db.query('DELETE FROM admins;');
    await db.query('DELETE FROM superadmins;');
    await db.query('DELETE FROM students;');
    await db.query('DELETE FROM student_records;');
    await db.query('DELETE FROM programs;');
    await db.query('DELETE FROM departments;');
    await db.query('DELETE FROM faculties;');
    await db.query('DELETE FROM universities;');
    console.log('   ✅ All user records deleted from database.');

    // 2. Insert ONLY 1 SuperAdmin (Username: superadmin, Password: superadmin123)
    console.log('\n2. Creating fresh single SuperAdmin account...');
    const superadminPass = await bcrypt.hash('superadmin123', 10);
    await db.query(`
      INSERT INTO superadmins (id, name, email, password_hash)
      VALUES (1, 'superadmin', 'superadmin@system.com', $1);
    `, [superadminPass]);
    console.log('   ✅ Created SuperAdmin:');
    console.log('      • Username / Email : superadmin  (or superadmin@system.com)');
    console.log('      • Password         : superadmin123');

    // 3. Ensure system_settings default row
    await db.query('DELETE FROM system_settings;');
    await db.query(`
      INSERT INTO system_settings 
      (id, university_name, campus_name, logo_url, registration_number_pattern, otp_expiry_minutes, session_timeout_minutes, face_attempt_limit, otp_attempt_limit, enforce_mfa, ip_restriction, support_email, emergency_phone)
      VALUES (1, 'COMSATS University Islamabad', 'Main Campus', '/uploads/default-logo.png', '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$', 5, 30, 1, 5, true, false, 'support@campusvote.edu', '+1 (555) 012-3456');
    `);
    console.log('   ✅ System settings reset.');

    // 4. Print row counts for verification
    const tables = ['students', 'admins', 'candidates', 'superadmins', 'elections', 'departments', 'programs', 'universities'];
    console.log('\n====================================================');
    console.log('📊 VERIFYING CLEAN TABLE COUNTS:');
    console.log('====================================================');
    for (const t of tables) {
      const res = await db.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`   • Table '${t}': ${res.rows[0].count} row(s)`);
    }

    console.log('\n====================================================');
    console.log('✨ ALL USERS DELETED! ONLY SUPERADMIN REMAINS.');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Force clean error:', err);
    process.exit(1);
  }
}

forceCleanAllUsers();
