const http = require('http');
const db = require('../config/db');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('--- Testing Step-4 Candidate Registration Flow & Duplicate Prevention ---');
  
  const testCnic = '34567-8765456-7';
  const testReg = 'FA22-BCS-056';
  const testEmail = 'candidate.abdullah@university.edu';

  // 1. Ensure student_records contains an eligible record with CGPA >= 3.0
  await db.query(`DELETE FROM student_records WHERE cnic = $1 OR registration_number = $2`, [testCnic, testReg]);
  await db.query(`DELETE FROM candidates WHERE cnic = $1 OR registration_number = $2 OR email = $3`, [testCnic, testReg, testEmail]);
  await db.query(`DELETE FROM voters WHERE cnic = $1 OR registration_number = $2 OR email = $3`, [testCnic, testReg, testEmail]);

  await db.query(`
    INSERT INTO student_records (
      university_id, full_name, father_name, cnic, registration_number, email, mobile_number,
      faculty_id, department_id, program_id, batch, semester, cgpa, is_eligible_candidate
    ) VALUES (
      1, 'Abdullah Akram', 'Muhammad Akram', $1, $2, $3, '03096932637',
      1, 1, 1, '2022', 6, 3.85, true
    )
  `, [testCnic, testReg, testEmail]);

  console.log('✅ Temporary eligible student record inserted for verification.');

  // 2. Simulate Step-4 Registration call
  const payload = {
    university_id: 1,
    cnic: testCnic,
    registration_number: testReg,
    full_name: 'Abdullah Akram',
    father_name: 'Muhammad Akram',
    mobile_number: '03096932637',
    department_id: 1,
    email: testEmail,
    password: 'password123',
    user_role: 'candidate',
    party_name: 'Insaf Student Federation',
    party_slogan: 'Empowering Student Voice with Integrity',
    slogan: 'Empowering Student Voice with Integrity',
    symbol_url: '/uploads/default-symbol.png',
    manifesto: 'Promoting student welfare, campus digital tools, and transparent elections.',
    election_id: 1,
    face_encoding: 'FACE_VECTOR_RECORDED',
    cgpa: 3.85
  };

  console.log('\nSubmitting candidate registration (Attempt 1)...');
  const res1 = await post('http://localhost:5000/api/students/register', payload);
  console.log('Attempt 1 response status:', res1.status);
  console.log('Attempt 1 response body:', res1.body);

  // 3. Verify exactly 1 row was created in candidates table
  const candCheck = await db.query('SELECT id, name, party, slogan, manifesto, symbol_image_url, email, status FROM candidates WHERE email = $1', [testEmail]);
  console.log('\nCandidates table count for this email:', candCheck.rows.length);
  if (candCheck.rows.length === 1) {
    console.log('✅ EXACTLY 1 candidate row created!');
    console.log('Candidate row details:', candCheck.rows[0]);
  } else {
    console.error('❌ FAILURE: Found', candCheck.rows.length, 'candidate rows!');
  }

  // 4. Attempt second registration with same details (Duplicate Prevention Test)
  console.log('\nSubmitting candidate registration again (Attempt 2 - Duplicate Test)...');
  const res2 = await post('http://localhost:5000/api/students/register', payload);
  console.log('Attempt 2 response status:', res2.status);
  console.log('Attempt 2 response body:', res2.body);

  if (res2.status === 400) {
    console.log('✅ Duplicate registration successfully blocked with 400 Bad Request!');
  } else {
    console.error('❌ FAILURE: Duplicate was not blocked!');
  }

  // Check candidate count again
  const candCheck2 = await db.query('SELECT count(*) FROM candidates WHERE email = $1', [testEmail]);
  console.log('Candidate count after duplicate attempt:', candCheck2.rows[0].count);

  // 5. Clean up all test records so live DB keeps ONLY superadmin
  console.log('\nCleaning up all test records...');
  await db.query(`DELETE FROM candidates WHERE cnic = $1 OR registration_number = $2 OR email = $3`, [testCnic, testReg, testEmail]);
  await db.query(`DELETE FROM voters WHERE cnic = $1 OR registration_number = $2 OR email = $3`, [testCnic, testReg, testEmail]);
  await db.query(`DELETE FROM student_records WHERE cnic = $1 OR registration_number = $2`, [testCnic, testReg]);

  const remainingUsers = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM superadmins) as superadmins,
      (SELECT COUNT(*) FROM admins) as admins,
      (SELECT COUNT(*) FROM voters) as voters,
      (SELECT COUNT(*) FROM candidates) as candidates
  `);
  console.log('Current DB state after cleanup:', remainingUsers.rows[0]);

  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
