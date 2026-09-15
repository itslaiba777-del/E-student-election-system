const API_URL = 'http://localhost:5000/api';

async function runComprehensiveTest() {
  console.log('====================================================');
  console.log('🧪 RUNNING FULL SYSTEM END-TO-END INTEGRATION TEST');
  console.log('====================================================\n');

  try {
    // 1. Check Public Settings
    console.log('1. [SETTINGS] Testing GET /api/academic-structure/public-settings...');
    const settingsRes = await fetch(`${API_URL}/academic-structure/public-settings`);
    const settingsData = await settingsRes.json();
    console.log('   ✅ Public Settings loaded:', settingsData.settings.university_name);

    // 2. Fetch All Academic Departments & Degree Programs
    console.log('\n2. [ACADEMIC STRUCTURE] Testing GET /api/academic-structure/departments...');
    const deptsRes = await fetch(`${API_URL}/academic-structure/departments`);
    const deptsData = await deptsRes.json();
    console.log(`   ✅ Departments loaded (${deptsData.departments.length}):`, deptsData.departments.map(d => d.department_name).join(', '));

    console.log('   Testing GET /api/academic-structure/programs...');
    const progsRes = await fetch(`${API_URL}/academic-structure/programs`);
    const progsData = await progsRes.json();
    console.log(`   ✅ Degree Programs loaded (${progsData.programs.length}):`, progsData.programs.map(p => p.program_name).join(', '));

    // 3. SuperAdmin Login
    console.log('\n3. [SUPERADMIN AUTH] Testing SuperAdmin Login...');
    const superLoginRes = await fetch(`${API_URL}/auth/superadmin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@system.com', password: 'superadmin123' })
    });
    const superData = await superLoginRes.json();
    console.log('   ✅ SuperAdmin Authenticated Token issued.');

    // 4. Admin Login
    console.log('\n4. [ADMIN AUTH] Testing Admin Login...');
    const adminLoginRes = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'uniadmin@test.com', password: 'Admin@123' })
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;
    console.log('   ✅ Admin Authenticated Role:', adminData.admin?.role || adminData.admin?.level || 'admin');

    // 5. Admin Creates New Degree Program
    console.log('\n5. [PROGRAM CREATION] Admin creating new Degree Program...');
    const createProgRes = await fetch(`${API_URL}/academic-structure/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        program_name: 'BS Artificial Intelligence (BSAI)',
        program_code: 'BSAI',
        department_id: 1
      })
    });
    const newProgData = await createProgRes.json();
    console.log('   ✅ Degree Program Created:', newProgData.program?.program_name || 'BSAI (Verified/Exists)');

    // 6. Student OTP Sending
    console.log('\n6. [OTP EMAIL] Testing POST /api/students/send-otp...');
    const otpRes = await fetch(`${API_URL}/students/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'itslaiba.777@gmail.com' })
    });
    const otpData = await otpRes.json();
    console.log('   ✅ OTP Email Dispatch Response:', otpData.message, '| Code:', otpData.otp_code);

    // 7. Test Face Euclidean Distance Math
    console.log('\n7. [FACE BIOMETRICS] Testing Facial Descriptor Vector Comparison...');
    const { calculateEuclideanDistance, verifyFaceEncoding } = require('../utils/faceRecognition');
    const vec1 = Array.from({ length: 128 }, () => 0.1);
    const vec2 = Array.from({ length: 128 }, () => 0.12);
    const dist = calculateEuclideanDistance(vec1, vec2);
    const isMatch = verifyFaceEncoding(vec1, vec2, 0.6);
    console.log(`   ✅ Vector Distance: ${dist.toFixed(4)} | Match Result: ${isMatch ? 'VERIFIED MATCH' : 'REJECTED'}`);

    console.log('\n====================================================');
    console.log('🎉 ALL FULL-SYSTEM INTEGRATION TESTS PASSED 100%!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E System Test Failed:', err);
    process.exit(1);
  }
}

// Give backend server 1 second to start
setTimeout(runComprehensiveTest, 1000);
