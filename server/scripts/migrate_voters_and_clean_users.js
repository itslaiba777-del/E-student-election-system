const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const connStr = process.env.DATABASE_URL;
const DB_PATH = path.join(__dirname, '../data/persistent_db.json');

async function migrateAndClean() {
  console.log('🔄 Connecting to Supabase PostgreSQL...');
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL!');

  console.log('📦 1. Creating dedicated voters table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS voters (
      id SERIAL PRIMARY KEY,
      cnic VARCHAR(50) NOT NULL,
      registration_number VARCHAR(50) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      father_name VARCHAR(255),
      dob DATE,
      mobile_number VARCHAR(50),
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      university_id INT DEFAULT 1,
      faculty_id INT,
      faculty_name VARCHAR(255),
      department_id INT,
      department_name VARCHAR(255),
      program_id INT,
      program_name VARCHAR(255),
      batch VARCHAR(50),
      semester VARCHAR(50),
      cgpa NUMERIC(3,2),
      profile_image_url VARCHAR(500),
      face_encoding TEXT,
      status VARCHAR(50) DEFAULT 'active',
      has_voted BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✔ voters table created / verified.');

  console.log('📦 2. Enhancing candidates table columns...');
  await client.query(`
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cnic VARCHAR(50);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS university_id INT DEFAULT 1;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS faculty_name VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS department_name VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS program_name VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS batch VARCHAR(50);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3,2);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS face_encoding TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS slogan VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS motto VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience TEXT;
  `);
  console.log('✔ candidates table enhanced.');

  console.log('🧹 3. Removing all user data (voters, candidates, admins, students, votes)...');
  await client.query(`
    TRUNCATE voters, candidates, students, admins, admin_permissions, votes, voting_status, otp_records, login_audit_log
    RESTART IDENTITY CASCADE;
  `);
  console.log('✔ All non-superadmin users, candidates, and votes wiped from database!');

  // Ensure superadmin exists with password superadmin123
  const PASS_SUPERADMIN123 = '$2b$10$pnM5vG1srZ1FokGv0dGdje2.MmdqroQQg6E4OAETlycj2k.9gGWkG';
  await client.query(`
    INSERT INTO superadmins (id, name, email, password_hash)
    VALUES (1, 'superadmin', 'superadmin@system.com', $1)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash;
  `, [PASS_SUPERADMIN123]);
  console.log('✔ SuperAdmin verified in database (superadmin / superadmin123).');

  // Verify counts in Supabase
  const tables = ['superadmins', 'admins', 'candidates', 'voters', 'students', 'student_records', 'elections', 'universities', 'departments', 'programs'];
  console.log('\n--- Supabase Status ---');
  for (const t of tables) {
    const res = await client.query(`SELECT count(*) FROM "${t}"`);
    console.log(`${t}: ${res.rows[0].count} rows`);
  }

  await client.end();

  // 4. Update persistent_db.json
  console.log('\n💾 4. Updating local persistent_db.json...');
  const diskData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  diskData.voters = [];
  diskData.candidates = [];
  diskData.students = [];
  diskData.admins = [];
  diskData.votes = [];
  diskData.election_schedule_logs = [];
  diskData.superadmins = [
    {
      id: 1,
      name: 'superadmin',
      email: 'superadmin@system.com',
      password_hash: PASS_SUPERADMIN123
    }
  ];

  fs.writeFileSync(DB_PATH, JSON.stringify(diskData, null, 2), 'utf8');
  console.log('✔ persistent_db.json updated with clean state!');
  console.log('🎉 Database separation and user cleanup complete!');
}

migrateAndClean().catch(err => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
