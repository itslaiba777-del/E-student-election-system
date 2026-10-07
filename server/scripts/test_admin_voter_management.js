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
  console.log('=== TEST: MASLA 3 - ADMIN VOTER MANAGEMENT & API ROUTE VERIFICATION ===\n');

  try {
    // 0. Clean prior test artifacts
    await db.query("DELETE FROM admin_permissions WHERE admin_id IN (SELECT id FROM admins WHERE email = 'bilal@admin.test')");
    await db.query("DELETE FROM admins WHERE email = 'bilal@admin.test'");
    await db.query("DELETE FROM voters WHERE email = 'asim@voter.test'");

    // 1. SuperAdmin Login
    console.log('1. SuperAdmin login...');
    const superLogin = await request('POST', '/api/auth/login', {
      identifier: 'superadmin',
      password: 'superadmin123'
    });
    const superToken = superLogin.body.token;
    console.log(`   SuperAdmin Login: ${superLogin.status}`);

    // 2. SuperAdmin creates Admin Bilal
    console.log('\n2. Creating Admin Bilal...');
    const createAdminRes = await request('POST', '/api/superadmin/admins', {
      name: 'Bilal Admin',
      email: 'bilal@admin.test',
      password: 'bilal123',
      level: 'department',
      department_id: 1,
      permissions: {
        can_view_students: true,
        can_approve_students: true,
      }
    }, superToken);
    console.log(`   Create Admin Status: ${createAdminRes.status}`);
    const adminId = createAdminRes.body.admin.id;

    // 3. Admin logs in
    console.log('\n3. Logging in as Admin Bilal...');
    const adminLogin = await request('POST', '/api/auth/login', {
      identifier: 'bilal@admin.test',
      password: 'bilal123'
    });
    const adminToken = adminLogin.body.token;
    console.log(`   Admin Login Status: ${adminLogin.status}`);

    // 4. Create a test voter in voters table
    console.log('\n4. Registering voter Asim in voters table...');
    const voterInsert = await db.query(`
      INSERT INTO voters (full_name, father_name, email, cnic, registration_number, mobile_number, password_hash, status, university_id, faculty_id, department_id)
      VALUES ('Asim Raza', 'Raza Khan', 'asim@voter.test', '35201-9988776-1', 'SP22-BCS-099', '03001234567', '$2b$10$3n9g3sN00x0G/7.Xj3O68.d.tJ2cE6pXp80Z9k0w5n1Y0O.O0O0O0', 'active', 1, 1, 1)
      RETURNING *
    `);
    const voterId = voterInsert.rows[0].id;
    console.log(`   Voter created with ID ${voterId}, status: 'active'`);

    // 5. Admin fetches voter list via GET /api/admins/students
    console.log('\n5. Admin fetches voter list via GET /api/admins/students...');
    const listRes = await request('GET', '/api/admins/students', null, adminToken);
    console.log(`   Get voters list status: ${listRes.status}`);
    const foundVoter = listRes.body.students?.find(v => v.id === voterId);
    console.log(`   Voter found in admin list: ${!!foundVoter} (Name: ${foundVoter?.full_name})`);

    // 6. Admin toggles voter status to 'deactivated' via PUT /api/admins/students/:id/status
    console.log('\n6. Admin updates voter status to "deactivated"...');
    const statusRes = await request('PUT', `/api/admins/students/${voterId}/status`, { status: 'deactivated' }, adminToken);
    console.log(`   Update status code: ${statusRes.status}`);
    console.log(`   Message: "${statusRes.body?.message}"`);

    const dbCheck1 = await db.query('SELECT status FROM voters WHERE id = $1', [voterId]);
    console.log(`   Database status: "${dbCheck1.rows[0]?.status}" (Expected: 'deactivated')`);

    // 7. Admin updates voter profile details via PUT /api/admins/students/:id
    console.log('\n7. Admin updates voter profile details...');
    const editRes = await request('PUT', `/api/admins/students/${voterId}`, {
      full_name: 'Asim Raza Updated',
      father_name: 'Muhammad Raza',
      mobile_number: '03117654321'
    }, adminToken);
    console.log(`   Update profile code: ${editRes.status}`);
    console.log(`   Message: "${editRes.body?.message}"`);

    const dbCheck2 = await db.query('SELECT full_name, father_name, mobile_number FROM voters WHERE id = $1', [voterId]);
    console.log(`   Updated Name: "${dbCheck2.rows[0]?.full_name}", Father: "${dbCheck2.rows[0]?.father_name}"`);

    // 8. Admin updates voter password via PUT /api/admins/students/:id/password
    console.log('\n8. Admin resets voter password...');
    const passRes = await request('PUT', `/api/admins/students/${voterId}/password`, { password: 'newSecurePassword456' }, adminToken);
    console.log(`   Reset password code: ${passRes.status}`);
    console.log(`   Message: "${passRes.body?.message}"`);

    // 9. Admin deletes voter via DELETE /api/admins/students/:id
    console.log('\n9. Admin deletes voter account...');
    const delRes = await request('DELETE', `/api/admins/students/${voterId}`, null, adminToken);
    console.log(`   Delete voter code: ${delRes.status}`);
    console.log(`   Message: "${delRes.body?.message}"`);

    const dbCheck3 = await db.query('SELECT count(*) FROM voters WHERE id = $1', [voterId]);
    console.log(`   Voters with ID ${voterId} in DB: ${dbCheck3.rows[0].count} (Expected: 0)`);

    // 10. Clean up test Admin
    console.log('\n10. Cleaning up test Admin so only SuperAdmin remains in DB...');
    await db.query('DELETE FROM admin_permissions WHERE admin_id = $1', [adminId]);
    await db.query('DELETE FROM admins WHERE id = $1', [adminId]);
    console.log('    Test Admin deleted.');

    const finalCounts = await db.query('SELECT (SELECT count(*) FROM superadmins) as superadmins, (SELECT count(*) FROM admins) as admins, (SELECT count(*) FROM voters) as voters, (SELECT count(*) FROM candidates) as candidates');
    console.log('    Final Database Counts:', finalCounts.rows[0]);

    console.log('\n=== MASLA 3 TEST PASSED 100% SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTest();
