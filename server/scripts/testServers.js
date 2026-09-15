async function testServers() {
  try {
    console.log('Testing Backend Health Check: http://localhost:5000/api/health');
    const backendRes = await fetch('http://localhost:5000/api/health');
    const backendData = await backendRes.json();
    console.log('Backend Status:', backendRes.status, backendData);

    console.log('\nTesting Frontend App: http://localhost:3000');
    const frontendRes = await fetch('http://localhost:3000');
    console.log('Frontend Status:', frontendRes.status);

    if (backendRes.ok && frontendRes.ok) {
      console.log('\n🎉 BOTH BACKEND AND FRONTEND SERVERS ARE ACTIVE AND RUNNING PROPERLY!');
      process.exit(0);
    } else {
      console.error('❌ Server check failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    process.exit(1);
  }
}

testServers();
