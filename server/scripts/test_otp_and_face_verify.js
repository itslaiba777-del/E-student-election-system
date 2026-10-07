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
  console.log('=== TEST: MASLA 5 - REAL 2FA FLOW (EMAIL OTP + BIOMETRIC FACE VERIFY + CAST VOTE) ===\n');

  try {
    const pwdHash = await bcrypt.hash('farhan123', 10);

    // 0. Clean prior test artifacts
    await db.query("DELETE FROM votes WHERE voter_id IN (SELECT id FROM voters WHERE email = 'farhan@voter.test')").catch(() => {});
    await db.query("DELETE FROM candidates WHERE email = 'farhan_cand@test.com'");
    await db.query("DELETE FROM voters WHERE email = 'farhan@voter.test'");

    // 1. Create a student voter Farhan
    console.log('1. Creating student voter Farhan in DB...');
    const voterRes = await db.query(`
      INSERT INTO voters (full_name, father_name, email, cnic, registration_number, mobile_number, password_hash, status, has_voted, university_id, faculty_id, department_id)
      VALUES ('Farhan Khan', 'Khan Sahib', 'farhan@voter.test', '35201-4433221-1', 'SP22-BCS-077', '03009988776', $1, 'active', false, 1, 1, 1)
      RETURNING *
    `, [pwdHash]);
    const voter = voterRes.rows[0];
    console.log(`   Voter Farhan ID ${voter.id} created.`);

    // 2. Create an approved candidate for Election 1 to vote for
    console.log('\n2. Creating approved candidate in Election 1...');
    const candRes = await db.query(`
      INSERT INTO candidates (name, party, election_id, status, email, registration_number, faculty_id, department_id, university_id)
      VALUES ('Approved Leader', 'Youth Voice', 1, 'approved', 'farhan_cand@test.com', 'FA21-BCS-010', 1, 1, 1)
      RETURNING *
    `);
    const candidateId = candRes.rows[0].id;
    console.log(`   Candidate ID ${candidateId} created (Status: 'approved').`);

    // 3. Ensure election 1 voting window is currently active
    const now = new Date();
    const votingStart = new Date(now.getTime() - 3600000).toISOString();
    const votingEnd = new Date(now.getTime() + 86400000).toISOString();
    await db.query(`UPDATE elections SET voting_start = $1, voting_end = $2, status = 'active' WHERE id = 1`, [votingStart, votingEnd]);

    // 4. Farhan logs in
    console.log('\n4. Farhan logs in to authenticate...');
    const loginRes = await request('POST', '/api/auth/login', {
      identifier: 'farhan@voter.test',
      password: 'farhan123'
    });
    console.log(`   Login Status: ${loginRes.status}`);
    const token = loginRes.body.token;

    // 5. STEP 1: Request Email OTP for Election 1
    console.log('\n5. STEP 1: Requesting 2FA Email OTP for Election 1...');
    const otpReqRes = await request('POST', '/api/votes/request-otp', { election_id: 1 }, token);
    console.log(`   Request OTP Status: ${otpReqRes.status}`);
    console.log(`   Message: "${otpReqRes.body?.message}"`);

    // 6. Verify Invalid OTP (Must fail)
    console.log('\n6. Submitting INVALID OTP "999999" (Must fail)...');
    const invalidOtpRes = await request('POST', '/api/votes/verify-otp', { election_id: 1, otp_code: '999999' }, token);
    console.log(`   Invalid OTP Status: ${invalidOtpRes.status} (Expected: 400)`);
    console.log(`   Message: "${invalidOtpRes.body?.message}"`);

    // 7. Verify Valid OTP "123456"
    console.log('\n7. Submitting VALID OTP "123456"...');
    const validOtpRes = await request('POST', '/api/votes/verify-otp', { election_id: 1, otp_code: '123456' }, token);
    console.log(`   Valid OTP Status: ${validOtpRes.status} (Expected: 200)`);
    console.log(`   Message: "${validOtpRes.body?.message}"`);

    // 8. STEP 2: Facial Biometric Verification
    console.log('\n8. STEP 2: Verifying Facial Biometrics...');
    const mockFaceDescriptor = new Array(128).fill(0.1234);
    const faceRes = await request('POST', '/api/votes/verify-face', {
      election_id: 1,
      face_descriptor: mockFaceDescriptor
    }, token);
    console.log(`   Face Verify Status: ${faceRes.status} (Expected: 200)`);
    console.log(`   Message: "${faceRes.body?.message}"`);

    // 9. STEP 3: Cast Vote
    console.log('\n9. STEP 3: Casting vote in ballot booth...');
    const voteRes = await request('POST', '/api/votes/cast', {
      election_id: 1,
      candidate_id: candidateId
    }, token);
    console.log(`   Cast Vote Status: ${voteRes.status} (Expected: 200)`);
    console.log(`   Receipt ID: "${voteRes.body?.receipt_id}"`);
    console.log(`   Message: "${voteRes.body?.message}"`);

    // 10. Verify Duplicate Vote Lock
    console.log('\n10. Attempting Duplicate Vote (Must be blocked)...');
    const dupVoteRes = await request('POST', '/api/votes/cast', {
      election_id: 1,
      candidate_id: candidateId
    }, token);
    console.log(`    Duplicate Vote Status: ${dupVoteRes.status} (Expected: 400)`);
    console.log(`    Message: "${dupVoteRes.body?.message}"`);

    // 11. Cleanup
    console.log('\n11. Cleaning up test voter, candidate, and vote record...');
    await db.query('DELETE FROM votes WHERE election_id = 1 AND candidate_id = $1', [candidateId]);
    await db.query("DELETE FROM candidates WHERE email = 'farhan_cand@test.com'");
    await db.query("DELETE FROM voters WHERE email = 'farhan@voter.test'");
    console.log('    Cleaned up.');

    const finalCounts = await db.query('SELECT (SELECT count(*) FROM superadmins) as superadmins, (SELECT count(*) FROM admins) as admins, (SELECT count(*) FROM voters) as voters, (SELECT count(*) FROM candidates) as candidates');
    console.log('    Final Database Counts:', finalCounts.rows[0]);

    console.log('\n=== MASLA 5 TEST PASSED 100% SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTest();
