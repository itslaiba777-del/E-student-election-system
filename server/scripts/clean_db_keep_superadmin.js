const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanDatabase() {
  console.log('Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL!');

  // 1. Truncate / Delete all operational and test data with CASCADE
  const tablesToClear = [
    'votes',
    'voting_status',
    'otp_records',
    'candidates',
    'elections',
    'election_schedule_logs',
    'students',
    'voters',
    'admin_permissions',
    'admins',
    'login_audit_log',
    'student_records'
  ];

  for (const table of tablesToClear) {
    try {
      await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`🧹 Cleaned table: ${table}`);
    } catch (err) {
      // If table doesn't exist or TRUNCATE fails, try DELETE
      try {
        await client.query(`DELETE FROM "${table}"`);
        console.log(`🧹 Deleted rows from table: ${table}`);
      } catch (e) {
        console.log(`ℹ️ Table ${table} not found or skipped: ${e.message}`);
      }
    }
  }

  // 2. Ensure SuperAdmin exists and is active
  const superCheck = await client.query('SELECT id, name, email FROM superadmins');
  if (superCheck.rows.length === 0) {
    const hash = await bcrypt.hash('superadmin123', 10);
    await client.query(
      `INSERT INTO superadmins (id, name, email, password_hash)
       VALUES (1, 'superadmin', 'superadmin@system.com', $1)`,
      [hash]
    );
    console.log('✅ Created default SuperAdmin (superadmin@system.com / superadmin123)');
  } else {
    console.log('✅ SuperAdmin preserved:', superCheck.rows);
  }

  // 3. Reset primary key sequences for clean future IDs
  const sequences = [
    'admins_id_seq',
    'candidates_id_seq',
    'elections_id_seq',
    'students_id_seq',
    'votes_id_seq',
    'voting_status_id_seq',
    'otp_records_id_seq',
    'student_records_id_seq'
  ];

  for (const seq of sequences) {
    try {
      await client.query(`ALTER SEQUENCE "${seq}" RESTART WITH 1`);
    } catch (e) {
      // Sequence might not exist, ignore
    }
  }

  // Verify counts
  console.log('\n--- VERIFICATION AFTER CLEANUP ---');
  const verifyTables = ['superadmins', 'admins', 'students', 'candidates', 'elections', 'votes', 'voting_status', 'otp_records'];
  for (const vt of verifyTables) {
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${vt}"`);
      console.log(`${vt}: ${countRes.rows[0].count}`);
    } catch (e) {
      console.log(`${vt}: ${e.message}`);
    }
  }

  await client.end();
  console.log('PostgreSQL connection closed.');

  // 4. Also clean the local disk persistence JSON fallback file
  const persistentDbPath = path.join(__dirname, '../data/persistent_db.json');
  if (fs.existsSync(persistentDbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(persistentDbPath, 'utf8'));
      data.admins = [];
      data.students = [];
      data.candidates = [];
      data.elections = [];
      data.votes = [];
      data.voting_status = [];
      data.otp_records = [];
      data.student_records = [];
      // Keep superadmin
      if (!data.superadmins || data.superadmins.length === 0) {
        data.superadmins = [{
          id: 1,
          name: 'superadmin',
          email: 'superadmin@system.com',
          password_hash: await bcrypt.hash('superadmin123', 10)
        }];
      }
      fs.writeFileSync(persistentDbPath, JSON.stringify(data, null, 2), 'utf8');
      console.log('✅ Cleaned local persistent_db.json fallback successfully.');
    } catch (e) {
      console.warn('Warning updating persistent_db.json:', e.message);
    }
  }

  console.log('\n🎉 ALL DATA HAS BEEN REMOVED! ONLY SUPERADMIN REMAINS.');
}

cleanDatabase().catch((err) => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
