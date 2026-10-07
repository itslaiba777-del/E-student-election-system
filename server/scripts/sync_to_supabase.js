const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connStr = process.env.DATABASE_URL;
const DB_PATH = path.join(__dirname, '../data/persistent_db.json');

async function syncToSupabase() {
  console.log('🔄 Connecting to Supabase PostgreSQL...');
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Connected to Supabase!');

  // 1. Add missing columns
  console.log('🛠 Updating table schemas if needed...');
  
  // system_settings
  await client.query(`
    ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS university_name VARCHAR(255) DEFAULT 'COMSATS University Islamabad';
    ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS campus_name VARCHAR(255) DEFAULT 'Main Campus';
    ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) DEFAULT '/uploads/default-logo.png';
    ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS registration_number_pattern VARCHAR(255) DEFAULT '^[A-Za-z0-9-]{5,20}$';
    ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS min_candidate_cgpa NUMERIC(3,2) DEFAULT 3.00;
  `);

  // departments
  await client.query(`
    ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_code VARCHAR(50);
    ALTER TABLE departments ADD COLUMN IF NOT EXISTS university_id INT DEFAULT 1;
  `);

  // elections
  await client.query(`
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS position_title VARCHAR(255) DEFAULT 'President';
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS scope_type VARCHAR(50) DEFAULT 'all_departments';
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS department_id INT;
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS min_semester INT DEFAULT 3;
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS min_cgpa_criteria NUMERIC(3,2) DEFAULT 3.00;
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS total_seats INT DEFAULT 1;
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS voter_register_start TIMESTAMP WITH TIME ZONE;
    ALTER TABLE elections ADD COLUMN IF NOT EXISTS voter_register_end TIMESTAMP WITH TIME ZONE;
  `);

  // candidates
  await client.query(`
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS slogan VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS motto VARCHAR(255);
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS department_name VARCHAR(255);
  `);

  // students
  await client.query(`
    ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'voter';
    ALTER TABLE students ADD COLUMN IF NOT EXISTS faculty_name VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS department_name VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS program_name VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS batch VARCHAR(50);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3,2);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS party_name VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS symbol_url VARCHAR(500);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS manifesto TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS has_voted BOOLEAN DEFAULT false;
  `);

  // student_records
  await client.query(`
    ALTER TABLE student_records ADD COLUMN IF NOT EXISTS faculty_id INT;
    ALTER TABLE student_records ADD COLUMN IF NOT EXISTS faculty_name VARCHAR(255);
    ALTER TABLE student_records ADD COLUMN IF NOT EXISTS department_name VARCHAR(255);
    ALTER TABLE student_records ADD COLUMN IF NOT EXISTS program_name VARCHAR(255);
  `);

  // admins
  await client.query(`
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS can_approve_candidates BOOLEAN DEFAULT true;
    ALTER TABLE admins ADD COLUMN IF NOT EXISTS can_approve_students BOOLEAN DEFAULT true;
  `);

  console.log('✅ Schema columns verified!');

  // 2. Read persistent_db.json
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  // 3. Upsert universities
  for (const u of data.universities || []) {
    await client.query(`
      INSERT INTO universities (id, university_name, logo_url, registration_number_pattern)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        university_name = EXCLUDED.university_name,
        logo_url = EXCLUDED.logo_url,
        registration_number_pattern = EXCLUDED.registration_number_pattern;
    `, [u.id, u.university_name, u.logo_url, u.registration_number_pattern || '^[A-Za-z0-9-]{5,20}$']);
  }
  console.log('✔ Universities synced');

  // 4. Upsert faculties
  for (const f of data.faculties || []) {
    await client.query(`
      INSERT INTO faculties (id, faculty_name, university_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        faculty_name = EXCLUDED.faculty_name,
        university_id = EXCLUDED.university_id;
    `, [f.id, f.faculty_name, f.university_id || 1]);
  }
  console.log('✔ Faculties synced');

  // 5. Upsert departments
  for (const d of data.departments || []) {
    await client.query(`
      INSERT INTO departments (id, department_name, department_code, faculty_id, university_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        department_name = EXCLUDED.department_name,
        department_code = EXCLUDED.department_code,
        faculty_id = EXCLUDED.faculty_id,
        university_id = EXCLUDED.university_id;
    `, [d.id, d.department_name, d.department_code, d.faculty_id, d.university_id || 1]);
  }
  console.log('✔ Departments synced');

  // 6. Upsert programs
  for (const p of data.programs || []) {
    await client.query(`
      INSERT INTO programs (id, program_name, department_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        program_name = EXCLUDED.program_name,
        department_id = EXCLUDED.department_id;
    `, [p.id, p.program_name, p.department_id]);
  }
  console.log('✔ Programs synced');

  // 7. Upsert system_settings
  if (data.system_settings && data.system_settings[0]) {
    const s = data.system_settings[0];
    await client.query(`
      INSERT INTO system_settings (id, university_name, campus_name, logo_url, registration_number_pattern, min_candidate_cgpa)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        university_name = EXCLUDED.university_name,
        campus_name = EXCLUDED.campus_name,
        logo_url = EXCLUDED.logo_url,
        registration_number_pattern = EXCLUDED.registration_number_pattern,
        min_candidate_cgpa = EXCLUDED.min_candidate_cgpa;
    `, [s.id || 1, s.university_name, s.campus_name, s.logo_url, s.registration_number_pattern, s.min_candidate_cgpa || 3.0]);
    console.log('✔ System Settings synced');
  }

  // 8. Upsert superadmins
  for (const sa of data.superadmins || []) {
    await client.query(`
      INSERT INTO superadmins (id, name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash;
    `, [sa.id, sa.name, sa.email, sa.password_hash]);
  }
  console.log('✔ Superadmins synced');

  // 9. Upsert admins & admin_permissions
  for (const a of data.admins || []) {
    await client.query(`
      INSERT INTO admins (id, name, email, password_hash, level, university_id, faculty_id, department_id, status, can_approve_candidates, can_approve_students)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        level = EXCLUDED.level,
        status = EXCLUDED.status,
        can_approve_candidates = EXCLUDED.can_approve_candidates,
        can_approve_students = EXCLUDED.can_approve_students;
    `, [a.id, a.name, a.email, a.password_hash, a.level || 'university', a.university_id || 1, a.faculty_id || null, a.department_id || null, a.status || 'active', a.can_approve_candidates !== false, a.can_approve_students !== false]);

    await client.query(`
      INSERT INTO admin_permissions (admin_id, can_view_candidates, can_approve_candidates, can_view_students, can_approve_students, can_view_results, can_submit_results, can_extend_voting_time)
      VALUES ($1, true, true, true, true, true, true, true)
      ON CONFLICT DO NOTHING;
    `, [a.id]);
  }
  console.log('✔ Admins synced');

  // 10. Upsert elections
  for (const e of data.elections || []) {
    await client.query(`
      INSERT INTO elections (id, title, position_title, total_seats, university_id, scope, scope_type, department_id, min_semester, min_cgpa_criteria, terms_and_conditions, candidate_apply_start, candidate_apply_end, voter_register_start, voter_register_end, voting_start, voting_end, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        position_title = EXCLUDED.position_title,
        total_seats = EXCLUDED.total_seats,
        min_cgpa_criteria = EXCLUDED.min_cgpa_criteria,
        terms_and_conditions = EXCLUDED.terms_and_conditions,
        candidate_apply_start = EXCLUDED.candidate_apply_start,
        candidate_apply_end = EXCLUDED.candidate_apply_end,
        voting_start = EXCLUDED.voting_start,
        voting_end = EXCLUDED.voting_end,
        status = EXCLUDED.status;
    `, [e.id, e.title, e.position_title, e.total_seats || 1, e.university_id || 1, e.scope || 'university-wide', e.scope_type || 'all_departments', e.department_id || null, e.min_semester || 3, e.min_cgpa_criteria || 3.0, e.terms_and_conditions, e.candidate_apply_start, e.candidate_apply_end, e.voter_register_start, e.voter_register_end, e.voting_start, e.voting_end, e.status || 'active']);
  }
  console.log('✔ Elections synced');

  // 11. Upsert student_records
  for (const sr of data.student_records || []) {
    await client.query(`
      INSERT INTO student_records (id, university_id, cnic, registration_number, full_name, father_name, dob, faculty_id, faculty_name, department_id, department_name, program_id, program_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        cnic = EXCLUDED.cnic,
        registration_number = EXCLUDED.registration_number,
        full_name = EXCLUDED.full_name,
        father_name = EXCLUDED.father_name,
        department_id = EXCLUDED.department_id,
        program_id = EXCLUDED.program_id;
    `, [sr.id, sr.university_id || 1, sr.cnic, sr.registration_number, sr.full_name, sr.father_name, sr.dob || '2002-01-01', sr.faculty_id || 1, sr.faculty_name || '', sr.department_id || 1, sr.department_name || '', sr.program_id || 1, sr.program_name || '']);
  }
  console.log('✔ Student Records synced');

  // 12. Upsert students
  for (const s of data.students || []) {
    await client.query(`
      INSERT INTO students (id, full_name, father_name, cnic, registration_number, mobile_number, user_role, university_id, faculty_id, faculty_name, department_id, department_name, program_id, program_name, batch, semester, cgpa, email, password_hash, profile_image_url, party_name, symbol_url, manifesto, status, has_voted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        user_role = EXCLUDED.user_role,
        cnic = EXCLUDED.cnic,
        registration_number = EXCLUDED.registration_number,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        profile_image_url = EXCLUDED.profile_image_url,
        party_name = EXCLUDED.party_name,
        symbol_url = EXCLUDED.symbol_url,
        manifesto = EXCLUDED.manifesto,
        status = EXCLUDED.status,
        has_voted = EXCLUDED.has_voted;
    `, [s.id, s.full_name, s.father_name, s.cnic, s.registration_number, s.mobile_number, s.user_role || 'voter', s.university_id || 1, s.faculty_id || 1, s.faculty_name || '', s.department_id || 1, s.department_name || '', s.program_id || 1, s.program_name || '', s.batch, s.semester, s.cgpa, s.email, s.password_hash, s.profile_image_url, s.party_name || null, s.symbol_url || null, s.manifesto || null, s.status || 'active', s.has_voted || false]);
  }
  console.log('✔ Students synced');

  // 13. Upsert candidates
  for (const c of data.candidates || []) {
    await client.query(`
      INSERT INTO candidates (id, name, party, slogan, motto, bio, manifesto, experience, photo_url, symbol_image_url, faculty_id, department_id, department_name, program_id, election_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        party = EXCLUDED.party,
        slogan = EXCLUDED.slogan,
        motto = EXCLUDED.motto,
        bio = EXCLUDED.bio,
        manifesto = EXCLUDED.manifesto,
        experience = EXCLUDED.experience,
        photo_url = EXCLUDED.photo_url,
        symbol_image_url = EXCLUDED.symbol_image_url,
        department_name = EXCLUDED.department_name,
        election_id = EXCLUDED.election_id,
        status = EXCLUDED.status;
    `, [c.id, c.name, c.party, c.slogan || '', c.motto || '', c.bio || '', c.manifesto || '', c.experience || '', c.photo_url, c.symbol_image_url, c.faculty_id || 1, c.department_id || 1, c.department_name || '', c.program_id || 1, c.election_id || 1, c.status || 'pending']);
  }
  console.log('✔ Candidates synced');

  // Reset sequence IDs so new inserts work cleanly
  const seqs = [
    ['universities', 'id'],
    ['faculties', 'id'],
    ['departments', 'id'],
    ['programs', 'id'],
    ['elections', 'id'],
    ['superadmins', 'id'],
    ['admins', 'id'],
    ['students', 'id'],
    ['student_records', 'id'],
    ['candidates', 'id']
  ];
  for (const [tbl, col] of seqs) {
    try {
      await client.query(`SELECT setval(pg_get_serial_sequence('${tbl}', '${col}'), COALESCE(max(${col}), 1)) FROM ${tbl}`);
    } catch (e) {}
  }

  console.log('🎉 ALL DATA SUCCESSFULLY SYNCED INTO SUPABASE POSTGRESQL!');
  await client.end();
}

syncToSupabase().catch(err => {
  console.error('❌ Sync error:', err);
  process.exit(1);
});
