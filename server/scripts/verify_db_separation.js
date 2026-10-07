const db = require('../config/db');

async function testSeparation() {
  console.log('Testing Supabase PostgreSQL Separation State...');
  try {
    const superadmins = await db.query('SELECT count(*) FROM superadmins');
    const admins = await db.query('SELECT count(*) FROM admins');
    const candidates = await db.query('SELECT count(*) FROM candidates');
    const voters = await db.query('SELECT count(*) FROM voters');
    const students = await db.query('SELECT count(*) FROM students');
    const studentRecords = await db.query('SELECT count(*) FROM student_records');
    const elections = await db.query('SELECT count(*) FROM elections');

    console.log('\n--- Database Record Counts ---');
    console.log('Superadmins:     ', superadmins.rows[0].count);
    console.log('Admins:          ', admins.rows[0].count);
    console.log('Candidates:      ', candidates.rows[0].count);
    console.log('Voters:          ', voters.rows[0].count);
    console.log('Students (legacy):', students.rows[0].count);
    console.log('Student Records: ', studentRecords.rows[0].count);
    console.log('Elections:       ', elections.rows[0].count);

    const superadminUser = await db.query('SELECT id, name, email FROM superadmins');
    console.log('\nSuperAdmin in DB:', superadminUser.rows);

    const voterCols = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'voters'
      ORDER BY ordinal_position
    `);
    console.log('\nVoters Columns:');
    voterCols.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

    const candCols = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidates'
      ORDER BY ordinal_position
    `);
    console.log('\nCandidates Columns:');
    candCols.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

    process.exit(0);
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
}

testSeparation();
