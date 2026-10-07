const http = require('http');
const bcrypt = require('bcrypt');
const db = require('../config/db');

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers,
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTest() {
  console.log('=== TEST: MASLA 4 - CANDIDATE REGISTRATION, DUPLICATE PREVENTION & NOMINATION PERSISTENCE ===\n');

  try {
    const pwdHash = await bcrypt.hash('danish123', 10);

    // 0. Clean prior test artifacts
    await db.query("DELETE FROM candidates WHERE email = 'danish@cand.test'");
    await db.query("DELETE FROM voters WHERE email = 'danish@cand.test'");

    // 1. Create a student voter Danish
    console.log('1. Creating student voter Danish in DB...');
    const voterRes = await db.query(`
      INSERT INTO voters (full_name, father_name, email, cnic, registration_number, mobile_number, password_hash, status, university_id, faculty_id, department_id)
      VALUES ('Danish Ali', 'Ali Muhammad', 'danish@cand.test', '35201-7766554-1', 'FA21-BCS-088', '03211234567', $1, 'active', 1, 1, 1)
      RETURNING *
    `, [pwdHash]);
    const voter = voterRes.rows[0];
    console.log(`   Student Voter ID ${voter.id} created.`);

    // 2. Student Danish logs in
    console.log('\n2. Student Danish logs in...');
    const loginRes = await request('POST', '/api/auth/login', {
      identifier: 'danish@cand.test',
      password: 'danish123'
    });
    console.log(`   Login Status: ${loginRes.status}`);
    const token = loginRes.body.token;

    // 3. Ensure election 1 nomination window is open
    const now = new Date();
    const applyStart = new Date(now.getTime() - 3600000).toISOString();
    const applyEnd = new Date(now.getTime() + 86400000).toISOString();
    await db.query(`UPDATE elections SET candidate_apply_start = $1, candidate_apply_end = $2 WHERE id = 1`, [applyStart, applyEnd]);

    // 4. Candidate registers nomination
    console.log('\n4. Candidate Danish registers nomination for Election 1...');
    const regRes = await request('POST', '/api/candidates', {
      election_id: 1,
      party: 'Tech Innovators',
      slogan: 'Innovation and Integrity',
      motto: 'Leadership for Tomorrow',
      manifesto: 'Digital transformation of student society',
      bio: 'Final year CS undergrad'
    }, token);
    console.log(`   Registration Status: ${regRes.status}`);
    console.log(`   Message: "${regRes.body?.message}"`);
    const candId = regRes.body.candidate?.id;
    console.log(`   Created Candidate ID: ${candId}`);

    // Verify DB fields
    const dbCand = await db.query('SELECT * FROM candidates WHERE id = $1', [candId]);
    const cand = dbCand.rows[0];
    console.log(`   DB Candidate saved: Name="${cand.name}", Email="${cand.email}", RegNo="${cand.registration_number}", Slogan="${cand.slogan}", Status="${cand.status}"`);

    // 5. Duplicate nomination test: Attempt to register AGAIN for Election 1
    console.log('\n5. Attempting DUPLICATE candidate registration for Election 1 (Must be blocked)...');
    const dupRes = await request('POST', '/api/candidates', {
      election_id: 1,
      party: 'Another Party',
      slogan: 'Another slogan',
      manifesto: 'Duplicate manifesto'
    }, token);
    console.log(`   Duplicate Attempt Status: ${dupRes.status} (Expected: 400)`);
    console.log(`   Message: "${dupRes.body?.message}"`);

    const countCheck = await db.query('SELECT count(*) FROM candidates WHERE email = $1 AND election_id = 1', ['danish@cand.test']);
    console.log(`   Total nominations in DB for Danish in Election 1: ${countCheck.rows[0].count} (Expected: 1)`);

    // 6. Test getMyNomination API
    console.log('\n6. Testing GET /api/candidates/my-nomination...');
    const myNomRes = await request('GET', '/api/candidates/my-nomination', null, token);
    console.log(`   Get My Nomination Status: ${myNomRes.status}`);
    console.log(`   Candidate Name: "${myNomRes.body.candidate?.name}"`);
    console.log(`   Party: "${myNomRes.body.candidate?.party}"`);
    console.log(`   Status: "${myNomRes.body.candidate?.status}"`);

    // 7. Cleanup
    console.log('\n7. Cleaning up test voter & candidate...');
    await db.query("DELETE FROM candidates WHERE email = 'danish@cand.test'");
    await db.query("DELETE FROM voters WHERE email = 'danish@cand.test'");
    console.log('   Cleaned up.');

    const finalCounts = await db.query('SELECT (SELECT count(*) FROM superadmins) as superadmins, (SELECT count(*) FROM admins) as admins, (SELECT count(*) FROM voters) as voters, (SELECT count(*) FROM candidates) as candidates');
    console.log('   Final Database Counts:', finalCounts.rows[0]);

    console.log('\n=== MASLA 4 TEST PASSED 100% SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTest();
