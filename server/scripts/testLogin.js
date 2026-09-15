async function testSuperAdminLogin() {
  try {
    console.log('Testing SuperAdmin Login API Endpoint (superadmin@gmail.com / superadmin@)...');
    const res = await fetch('http://localhost:5000/api/auth/superadmin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@gmail.com',
        password: 'superadmin@'
      })
    });

    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response Body:', data);

    if (res.ok && data.token) {
      console.log('✔ LOGIN TEST PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error('❌ LOGIN TEST FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error during login test:', err.message);
    process.exit(1);
  }
}

testSuperAdminLogin();
