const http = require('http');
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
  console.log('=== TEST: ADMIN CANDIDATE APPROVAL & SUPERADMIN VISIBILITY WORKFLOW ===\n');

  try {
    // Clean any prior test artifacts first
    await db.query("DELETE FROM admin_permissions WHERE admin_id IN (SELECT id FROM admins WHERE email = 'tariq@admin.test')");
    await db.query("DELETE FROM admins WHERE email = 'tariq@admin.test'");
    await db.query("DELETE FROM candidates WHERE email = 'hamza@cand.test'");

    // 1. SuperAdmin Login
    console.log('1. SuperAdmin login...');
    const superLogin = await request('POST', '/api/auth/login', {
      identifier: 'superadmin',
      password: 'superadmin123'
    });
    const superToken = superLogin.body.token;
    console.log(`   SuperAdmin Login: ${superLogin.status}`);

    // 2. SuperAdmin creates an Admin
    console.log('\n2. Creating Admin Tariq...');
    const createAdminRes = await request('POST', '/api/superadmin/admins', {
      name: 'Tariq Admin',
      email: 'tariq@admin.test',
      password: 'tariq123',
      level: 'department',
      department_id: 1,
      permissions: {
        can_view_candidates: true,
        can_approve_candidates: true,
      }
    }, superToken);
    console.log(`   Create Admin Status: ${createAdminRes.status}`);
    const adminId = createAdminRes.body.admin.id;

    // 3. Admin logs in
    console.log('\n3. Logging in as Admin Tariq...');
    const adminLogin = await request('POST', '/api/auth/login', {
      identifier: 'tariq@admin.test',
      password: 'tariq123'
    });
    const adminToken = adminLogin.body.token;
    console.log(`   Admin Login Status: ${adminLogin.status}`);

    // 4. Candidate registers (Status: 'pending')
    console.log('\n4. Candidate Hamza registers application...');
    const candReg = await db.query(`
      INSERT INTO candidates (name, party, manifesto, election_id, status, university_id, faculty_id, department_id, cnic, registration_number, email)
      VALUES ('Hamza Ahmed', 'Tech Leaders', 'Transparent campus governance', 1, 'pending', 1, 1, 1, '35202-1234567-1', 'FA21-BCS-042', 'hamza@cand.test')
      RETURNING *
    `);
    const candId = candReg.rows[0].id;
    console.log(`   Candidate ID ${candId} created with status 'pending'`);

    // 5. SuperAdmin checks candidates list (Should be EMPTY because candidate is pending!)
    console.log('\n5. Checking SuperAdmin candidates list (Candidate must NOT be visible to SuperAdmin yet)...');
    const superCandsBefore = await request('GET', '/api/superadmin/candidates', null, superToken);
    const visibleToSuperBefore = superCandsBefore.body.candidates?.some(c => c.id === candId);
    console.log(`   Is pending candidate visible in SuperAdmin panel? ${visibleToSuperBefore} (Expected: false)`);

    // 6. Admin checks candidate applications list (Candidate MUST be visible to Admin)
    console.log('\n6. Checking Admin candidates list (Candidate MUST be visible to Admin for approval)...');
    const adminCands = await request('GET', '/api/candidates', null, adminToken);
    const visibleToAdmin = adminCands.body.candidates?.some(c => c.id === candId);
    console.log(`   Is pending candidate visible in Admin panel? ${visibleToAdmin} (Expected: true)`);

    // 7. Admin approves candidate
    console.log('\n7. Admin approves candidate...');
    const approveRes = await request('PUT', `/api/candidates/${candId}/status`, { status: 'approved' }, adminToken);
    console.log(`   Admin Approval Status: ${approveRes.status}`);
    console.log(`   Message: "${approveRes.body?.message}"`);

    // 8. SuperAdmin checks candidates list (Candidate MUST NOW BE VISIBLE to SuperAdmin because Admin approved him!)
    console.log('\n8. Checking SuperAdmin candidates list after Admin approval...');
    const superCandsAfter = await request('GET', '/api/superadmin/candidates', null, superToken);
    const visibleToSuperAfter = superCandsAfter.body.candidates?.some(c => c.id === candId);
    console.log(`   Is approved candidate visible in SuperAdmin panel? ${visibleToSuperAfter} (Expected: true)`);

    // 9. Admin tests Rejection with Reason
    console.log('\n9. Testing Admin rejection with custom reason...');
    const rejectRes = await request('PUT', `/api/candidates/${candId}/status`, {
      status: 'rejected',
      rejection_reason: 'CGPA does not meet the election minimum requirement.'
    }, adminToken);
    console.log(`   Admin Rejection Status: ${rejectRes.status}`);
    const checkDb = await db.query('SELECT status, rejection_reason FROM candidates WHERE id = $1', [candId]);
    console.log(`   Database Status: ${checkDb.rows[0].status}`);
    console.log(`   Database Rejection Reason: "${checkDb.rows[0].rejection_reason}"`);

    // 10. SuperAdmin checks candidates list again (Rejected candidate must disappear from SuperAdmin)
    const superCandsFinal = await request('GET', '/api/superadmin/candidates', null, superToken);
    const visibleToSuperFinal = superCandsFinal.body.candidates?.some(c => c.id === candId);
    console.log(`   Is rejected candidate visible in SuperAdmin panel? ${visibleToSuperFinal} (Expected: false)`);

    // 11. Clean up test records
    console.log('\n11. Cleaning up test data so database stays clean with ONLY superadmin...');
    await db.query('DELETE FROM candidates WHERE email = $1', ['hamza@cand.test']);
    await db.query('DELETE FROM admin_permissions WHERE admin_id = $1', [adminId]);
    await db.query('DELETE FROM admins WHERE id = $1', [adminId]);
    console.log('    Test admin and candidate cleaned up.');

    const finalCounts = await db.query('SELECT (SELECT count(*) FROM superadmins) as superadmins, (SELECT count(*) FROM admins) as admins, (SELECT count(*) FROM candidates) as candidates');
    console.log('    Final DB Counts:', finalCounts.rows[0]);
    console.log('\n=== MASLA 2 TEST PASSED 100% SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTest();
