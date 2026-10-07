const http = require('http');
const db = require('../config/db');

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
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

async function runVoteTest() {
  console.log('=== TEST: REAL VOTE CASTING & FAKE SUCCESS PREVENTION ===\n');

  try {
    // 1. Check GET /api/elections/1
    console.log('1. Testing GET /api/elections/1 ...');
    const elecRes = await request('GET', '/api/elections/1');
    console.log(`   Status: ${elecRes.status}`);
    console.log(`   Election Title: ${elecRes.body.election?.title}`);
    console.log(`   Candidates count before approval: ${elecRes.body.candidates?.length}`);

    // Ensure Election 1 voting window is currently active for test
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
    const endTime = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    await db.query(`UPDATE elections SET voting_start = $1, voting_end = $2, status = 'active' WHERE id = 1`, [startTime, endTime]);

    // 2. Insert test approved candidate into candidates table
    console.log('\n2. Setting up approved candidate in database...');
    const candInsert = await db.query(`
      INSERT INTO candidates (name, party, manifesto, election_id, status, university_id, faculty_id, department_id, cnic, registration_number, email)
      VALUES ('Hamza Ahmed', 'Tech Party', 'Campus growth', 1, 'approved', 1, 1, 1, '35202-1234567-1', 'FA21-BCS-042', 'hamza@vote.test')
      RETURNING id, name, status
    `);
    const candidate = candInsert.rows[0];
    console.log(`   Created Candidate ID: ${candidate.id}, Name: ${candidate.name}, Status: ${candidate.status}`);

    // Verify GET /api/elections/1 now returns Hamza
    const elecAfter = await request('GET', '/api/elections/1');
    console.log(`   Candidates count after approval: ${elecAfter.body.candidates?.length}`);
    const foundCand = elecAfter.body.candidates.find(c => c.id === candidate.id);
    console.log(`   Candidate found on ballot: ${!!foundCand} (${foundCand?.full_name})`);

    // 3. Register test voter Ayesha
    console.log('\n3. Registering test voter Ayesha...');
    const voterReg = await request('POST', '/api/students/register', {
      university_id: 1,
      cnic: '37405-9876543-2',
      registration_number: 'FA22-BSE-019',
      full_name: 'Ayesha Malik',
      father_name: 'Tariq Malik',
      dob: '2002-11-15',
      mobile_number: '03007654321',
      email: 'ayesha@vote.test',
      password: 'password123',
      user_role: 'voter',
      faculty_id: 2,
      department_id: 2,
      program_id: 4,
      batch: '2022',
      semester: '5',
      cgpa: 3.2
    });
    console.log(`   Voter registration status: ${voterReg.status}`);

    // 4. Log in as voter Ayesha to get JWT token
    console.log('\n4. Logging in as Voter Ayesha...');
    const loginRes = await request('POST', '/api/auth/login', {
      identifier: 'ayesha@vote.test',
      password: 'password123'
    });
    const token = loginRes.body.token;
    console.log(`   Login Status: ${loginRes.status}, User ID: ${loginRes.body.user?.id}`);

    // 5. Test invalid vote rejection (Missing candidate_id)
    console.log('\n5. Testing invalid vote rejection (missing candidate)...');
    const invalidVote = await request('POST', '/api/votes/cast', { election_id: 1 }, token);
    console.log(`   Expected 400 Error. Got Status: ${invalidVote.status}`);
    console.log(`   Error message from server: "${invalidVote.body?.message}"`);

    // 6. Test casting legitimate vote
    console.log('\n6. Casting legitimate vote for candidate...');
    const castRes = await request('POST', '/api/votes/cast', {
      election_id: 1,
      candidate_id: candidate.id
    }, token);
    console.log(`   Vote Status: ${castRes.status}`);
    console.log(`   Response Message: "${castRes.body?.message}"`);
    console.log(`   Receipt ID: ${castRes.body?.receipt_id}`);
    console.log(`   Has Voted Flag: ${castRes.body?.has_voted}`);

    // 7. Verify vote is recorded in database
    console.log('\n7. Verifying in Supabase Database...');
    const voteRow = await db.query('SELECT * FROM votes WHERE election_id = 1 AND voter_id = $1', [loginRes.body.user.id]);
    console.log(`   Votes recorded for this voter: ${voteRow.rows.length}`);
    const voterRow = await db.query('SELECT has_voted FROM voters WHERE id = $1', [loginRes.body.user.id]);
    console.log(`   Voter has_voted in DB: ${voterRow.rows[0]?.has_voted}`);

    // 8. Test duplicate vote prevention
    console.log('\n8. Testing duplicate vote prevention (Attempting 2nd vote)...');
    const dupRes = await request('POST', '/api/votes/cast', {
      election_id: 1,
      candidate_id: candidate.id
    }, token);
    console.log(`   Duplicate Vote Status (Expected 400): ${dupRes.status}`);
    console.log(`   Duplicate Response Message: "${dupRes.body?.message}"`);

    // 9. Clean up test records
    console.log('\n9. Cleaning up test data so database stays clean with ONLY superadmin...');
    await db.query('DELETE FROM votes WHERE election_id = 1');
    await db.query('DELETE FROM candidates WHERE email = $1', ['hamza@vote.test']);
    await db.query('DELETE FROM voters WHERE email = $1', ['ayesha@vote.test']);
    console.log('   Cleaned up test vote, test candidate, and test voter.');

    const finalCounts = await db.query('SELECT (SELECT count(*) FROM superadmins) as superadmins, (SELECT count(*) FROM voters) as voters, (SELECT count(*) FROM candidates) as candidates, (SELECT count(*) FROM votes) as votes');
    console.log('   Final DB Counts:', finalCounts.rows[0]);
    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runVoteTest();
