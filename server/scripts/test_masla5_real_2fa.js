const http = require('http');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { voteOtpStore } = require('../controllers/voteController');

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
  console.log('=== TEST: MASLA 5 - REAL 2FA FLOW & SECURITY VERIFICATION ===\n');

  try {
    const testVoterEmail = 'voter.real2fa@test.com';
    const testCandEmail = 'cand.real2fa@test.com';
    const pwdHash = await bcrypt.hash('password123', 10);

    // 0. Clean prior test artifacts
    await db.query("DELETE FROM votes WHERE voter_id IN (SELECT id FROM voters WHERE email = $1)", [testVoterEmail]).catch(() => {});
    await db.query("DELETE FROM candidates WHERE email = $1", [testCandEmail]);
    await db.query("DELETE FROM voters WHERE email = $1", [testVoterEmail]);

    // 1. Create active voter in DB
    console.log('1. Creating test voter in DB...');
    const voterRes = await db.query(`
      INSERT INTO voters (full_name, father_name, email, cnic, registration_number, mobile_number, password_hash, status, has_voted, university_id, faculty_id, department_id)
      VALUES ('Bilal Saeed', 'Saeed Anwar', $1, '35201-7788990-1', 'SP22-BCS-999', '03001122334', $2, 'active', false, 1, 1, 1)
      RETURNING *
    `, [testVoterEmail, pwdHash]);
    const voter = voterRes.rows[0];
    console.log(`   Voter created: ID ${voter.id}, Email: ${voter.email}`);

    // 2. Create approved candidate in DB for Election 1
    console.log('\n2. Creating approved candidate in Election 1...');
    const candRes = await db.query(`
      INSERT INTO candidates (name, party, election_id, status, email, registration_number, faculty_id, department_id, university_id)
      VALUES ('Progressive Leader', 'Future Students', 1, 'approved', $1, 'FA21-BCS-777', 1, 1, 1)
      RETURNING *
    `, [testCandEmail]);
    const candidateId = candRes.rows[0].id;
    console.log(`   Candidate created: ID ${candidateId}`);

    // 3. Ensure Election 1 voting window is currently active
    const now = new Date();
    const votingStart = new Date(now.getTime() - 3600000).toISOString();
    const votingEnd = new Date(now.getTime() + 86400000).toISOString();
    await db.query(`UPDATE elections SET voting_start = $1, voting_end = $2, status = 'active' WHERE id = 1`, [votingStart, votingEnd]);

    // 4. Voter logs in to get JWT token
    console.log('\n4. Voter logs in...');
    const loginRes = await request('POST', '/api/auth/login', {
      identifier: testVoterEmail,
      password: 'password123'
    });
    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    const token = loginRes.body.token;
    console.log('   Login successful, token acquired.');

    // 5. TEST: Direct vote cast WITHOUT 2FA OTP verification (MUST BE REJECTED WITH 403)
    console.log('\n5. [SECURITY CHECK] Attempting to cast vote WITHOUT completing 2FA OTP...');
    const directCastRes = await request('POST', '/api/votes/cast', {
      election_id: 1,
      candidate_id: candidateId,
    }, token);
    console.log(`   Status: ${directCastRes.status} (Expected: 403 Forbidden)`);
    console.log(`   Response: ${JSON.stringify(directCastRes.body)}`);
    if (directCastRes.status !== 403) {
      throw new Error('SECURITY FLAW: Direct vote without 2FA was NOT blocked with 403!');
    }
    console.log('   ✅ Direct vote successfully blocked by 2FA enforcement!');

    // 6. Request Real OTP for Election 1
    console.log('\n6. Requesting Real 2FA OTP for Election 1...');
    const otpReqRes = await request('POST', '/api/votes/request-otp', { election_id: 1 }, token);
    console.log(`   Request OTP Status: ${otpReqRes.status}`);
    console.log(`   Response: ${JSON.stringify(otpReqRes.body)}`);

    // Look up generated OTP from API response or controller store
    const realCode = otpReqRes.body?.debug_otp;
    if (!realCode) {
      throw new Error('Failed to find generated OTP in API response!');
    }
    console.log(`   Real OTP code generated: "${realCode}"`);

    // 7. [SECURITY CHECK] Try FAKE bypass "123456" (Must be rejected)
    if (realCode !== '123456') {
      console.log('\n7. [SECURITY CHECK] Submitting fake bypass code "123456"...');
      const fakeOtpRes = await request('POST', '/api/votes/verify-otp', { election_id: 1, otp_code: '123456' }, token);
      console.log(`   Fake OTP Status: ${fakeOtpRes.status} (Expected: 400 Bad Request)`);
      console.log(`   Response: ${JSON.stringify(fakeOtpRes.body)}`);
      if (fakeOtpRes.status !== 400) {
        throw new Error('SECURITY FLAW: Fake OTP 123456 was accepted!');
      }
      console.log('   ✅ Fake OTP bypass successfully rejected!');
    }

    // 8. [SECURITY CHECK] Try wrong code "000000" (Must be rejected)
    console.log('\n8. [SECURITY CHECK] Submitting wrong code "000000"...');
    const wrongOtpRes = await request('POST', '/api/votes/verify-otp', { election_id: 1, otp_code: '000000' }, token);
    console.log(`   Wrong OTP Status: ${wrongOtpRes.status} (Expected: 400 Bad Request)`);
    console.log(`   Response: ${JSON.stringify(wrongOtpRes.body)}`);
    if (wrongOtpRes.status !== 400) {
      throw new Error('SECURITY FLAW: Wrong OTP was accepted!');
    }
    console.log('   ✅ Wrong OTP successfully rejected!');

    // 9. Submit REAL OTP code
    console.log(`\n9. Submitting REAL generated OTP code "${realCode}"...`);
    const validOtpRes = await request('POST', '/api/votes/verify-otp', { election_id: 1, otp_code: realCode }, token);
    console.log(`   Valid OTP Status: ${validOtpRes.status} (Expected: 200 OK)`);
    console.log(`   Response: ${JSON.stringify(validOtpRes.body)}`);
    if (validOtpRes.status !== 200 || !validOtpRes.body.verified) {
      throw new Error('Real OTP verification failed!');
    }
    const verificationToken = validOtpRes.body.verification_token;
    console.log(`   ✅ Real OTP verified! Verification Token: ${verificationToken}`);

    // 10. Facial biometric verification
    console.log('\n10. Submitting facial biometric verification...');
    const faceRes = await request('POST', '/api/votes/verify-face', {
      election_id: 1,
      face_descriptor: new Array(128).fill(0.2468),
    }, token);
    console.log(`   Face Verify Status: ${faceRes.status} (Expected: 200 OK)`);
    console.log(`   Response: ${JSON.stringify(faceRes.body)}`);
    if (faceRes.status !== 200) {
      throw new Error('Facial verification failed!');
    }
    console.log('   ✅ Biometric verification passed!');

    // 11. Cast vote with valid 2FA token
    console.log('\n11. Casting Vote in ballot booth with 2FA token...');
    const castVoteRes = await request('POST', '/api/votes/cast', {
      election_id: 1,
      candidate_id: candidateId,
      verification_token: verificationToken,
    }, token);
    console.log(`   Cast Vote Status: ${castVoteRes.status} (Expected: 200 OK)`);
    console.log(`   Response: ${JSON.stringify(castVoteRes.body)}`);
    if (castVoteRes.status !== 200 || !castVoteRes.body.receipt_id) {
      throw new Error('Vote casting failed!');
    }
    console.log(`   ✅ Vote successfully cast! Receipt: ${castVoteRes.body.receipt_id}`);

    // 12. Attempt Duplicate Vote (Must be blocked)
    console.log('\n12. [SECURITY CHECK] Attempting duplicate vote for the same election...');
    const dupVoteRes = await request('POST', '/api/votes/cast', {
      election_id: 1,
      candidate_id: candidateId,
      verification_token: verificationToken,
    }, token);
    console.log(`   Duplicate Vote Status: ${dupVoteRes.status} (Expected: 400 or 403)`);
    console.log(`   Response: ${JSON.stringify(dupVoteRes.body)}`);
    if (dupVoteRes.status !== 400 && dupVoteRes.status !== 403) {
      throw new Error('SECURITY FLAW: Duplicate vote was not blocked!');
    }
    console.log('   ✅ Duplicate vote attempt successfully blocked!');

    // 13. Clean up all test records
    console.log('\n13. Cleaning up all test records from DB...');
    await db.query("DELETE FROM votes WHERE election_id = 1 AND candidate_id = $1", [candidateId]);
    await db.query("DELETE FROM candidates WHERE email = $1", [testCandEmail]);
    await db.query("DELETE FROM voters WHERE email = $1", [testVoterEmail]);

    const remaining = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM superadmins) as superadmins,
        (SELECT COUNT(*) FROM admins) as admins,
        (SELECT COUNT(*) FROM voters) as voters,
        (SELECT COUNT(*) FROM candidates) as candidates,
        (SELECT COUNT(*) FROM votes) as votes
    `);
    console.log('   Current Database Status after cleanup:', remaining.rows[0]);

    console.log('\n🎉 ALL REAL 2FA TESTS PASSED 100% SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTest();
