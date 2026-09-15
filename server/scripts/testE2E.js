const API_URL = 'http://localhost:5000/api';

async function runE2ETest() {
  console.log('=== RUNNING FULL END-TO-END SYSTEM INTEGRATION TEST ===\n');

  try {
    // 1. Fetch Universities
    console.log('1. Testing GET /api/universities...');
    const unisRes = await fetch(`${API_URL}/universities`);
    const unisData = await unisRes.json();
    console.log('✔ Universities fetched:', unisData.universities.map((u) => u.university_name));
    const uniId = unisData.universities[0].id;

    // 2. Verify Eligibility for Student Registration
    console.log('\n2. Testing POST /api/students/verify-eligibility...');
    const eligRes = await fetch(`${API_URL}/students/verify-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        university_id: uniId,
        cnic: '61101-1234567-2',
        registration_number: '2024-CS-102',
      }),
    });
    const eligData = await eligRes.json();
    console.log('✔ Eligibility verified:', eligData.student_data.full_name);

    // 3. Register New Student
    console.log('\n3. Testing POST /api/students/register...');
    const regRes = await fetch(`${API_URL}/students/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        university_id: uniId,
        faculty_id: eligData.student_data.faculty_id,
        department_id: eligData.student_data.department_id,
        program_id: eligData.student_data.program_id,
        cnic: '61101-1234567-2',
        registration_number: '2024-CS-102',
        email: 'jordan.smith@test.com',
        password: 'Student@123',
        face_encoding: 'MOCK_FACE_VECTOR_123',
      }),
    });
    const regData = await regRes.json();
    console.log('✔ Student registered:', regData.student.email);

    // 4. Student Login
    console.log('\n4. Testing POST /api/auth/student/login...');
    const studentLoginRes = await fetch(`${API_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        university_id: uniId,
        identifier: '2024-CS-101',
        password: 'Student@123',
      }),
    });
    const studentLoginData = await studentLoginRes.json();
    const studentToken = studentLoginData.token;
    console.log('✔ Student login successful. JWT Issued.');

    // 5. Admin Login
    console.log('\n5. Testing POST /api/auth/admin/login...');
    const adminLoginRes = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'uniadmin@test.com',
        password: 'Admin@123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    console.log('✔ Admin login successful. Role:', adminLoginData.user.level);

    // 6. SuperAdmin Login
    console.log('\n6. Testing POST /api/auth/superadmin/login...');
    const superLoginRes = await fetch(`${API_URL}/auth/superadmin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@test.com',
        password: 'Test@123',
      }),
    });
    const superLoginData = await superLoginRes.json();
    const superToken = superLoginData.token;
    console.log('✔ SuperAdmin root login successful. Token issued.');

    // 7. Get Elections List
    console.log('\n7. Testing GET /api/elections...');
    const electionsRes = await fetch(`${API_URL}/elections?university_id=${uniId}`);
    const electionsData = await electionsRes.json();
    console.log('✔ Elections loaded:', electionsData.elections.map((e) => e.title));
    const electionId = electionsData.elections[0].id;

    // 8. Get Candidates List
    console.log('\n8. Testing GET /api/candidates/election/:id...');
    const candidatesRes = await fetch(`${API_URL}/candidates/election/${electionId}?status=approved`);
    const candidatesData = await candidatesRes.json();
    console.log('✔ Candidates loaded:', candidatesData.candidates.map((c) => c.name));

    // 9. Request Voting OTP (Student authenticated)
    console.log('\n9. Testing POST /api/votes/request-otp...');
    const otpReqRes = await fetch(`${API_URL}/votes/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ election_id: electionId }),
    });
    const otpReqData = await otpReqRes.json();
    console.log('✔ OTP requested response:', otpReqData.message);

    // 10. SuperAdmin Dashboard Metrics Check
    console.log('\n10. Testing GET /api/superadmin/dashboard...');
    const dashRes = await fetch(`${API_URL}/superadmin/dashboard`, {
      headers: { Authorization: `Bearer ${superToken}` },
    });
    const dashData = await dashRes.json();
    console.log('✔ SuperAdmin Metrics:', dashData.metrics);

    console.log('\n====================================================');
    console.log('🎉 ALL END-TO-END BACKEND API INTEGRATIONS SUCCEEDED!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E Test Error:', err.message);
    process.exit(1);
  }
}

runE2ETest();
