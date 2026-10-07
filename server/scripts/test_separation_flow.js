const http = require('http');
const db = require('../config/db');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function runTest() {
  console.log('1. Registering Candidate Hamza...');
  const candReg = await post('http://localhost:5000/api/students/register', {
    university_id: 1,
    cnic: '35202-1234567-1',
    registration_number: 'FA21-BCS-042',
    full_name: 'Hamza Ahmed',
    father_name: 'Ahmed Hassan',
    dob: '2001-08-20',
    mobile_number: '03001234567',
    email: 'hamza@test.com',
    password: 'password123',
    user_role: 'candidate',
    faculty_id: 1,
    department_id: 1,
    program_id: 1,
    batch: '2021',
    semester: '7',
    cgpa: 3.5,
    party_name: 'Tech Leaders Party',
    manifesto: 'Digital transparency and campus growth'
  });
  console.log('Candidate Reg Status:', candReg.status, candReg.body);

  console.log('\n2. Registering Voter Ayesha...');
  const voterReg = await post('http://localhost:5000/api/students/register', {
    university_id: 1,
    cnic: '37405-9876543-2',
    registration_number: 'FA22-BSE-019',
    full_name: 'Ayesha Malik',
    father_name: 'Tariq Malik',
    dob: '2002-11-15',
    mobile_number: '03007654321',
    email: 'ayesha@test.com',
    password: 'password123',
    user_role: 'voter',
    faculty_id: 2,
    department_id: 2,
    program_id: 4,
    batch: '2022',
    semester: '5',
    cgpa: 3.2
  });
  console.log('Voter Reg Status:', voterReg.status, voterReg.body);

  const candCount = await db.query('SELECT count(*) FROM candidates');
  const voterCount = await db.query('SELECT count(*) FROM voters');
  const candInVoters = await db.query("SELECT * FROM voters WHERE email = 'hamza@test.com'");
  const voterInCands = await db.query("SELECT * FROM candidates WHERE email = 'ayesha@test.com'");

  console.log('\n--- Separation Check ---');
  console.log('Candidates in db:', candCount.rows[0].count);
  console.log('Voters in db:', voterCount.rows[0].count);
  console.log('Is Hamza in voters? (Should be 0):', candInVoters.rows.length);
  console.log('Is Ayesha in candidates? (Should be 0):', voterInCands.rows.length);

  // Clean back up so ONLY superadmin remains
  await db.query('DELETE FROM candidates;');
  await db.query('DELETE FROM voters;');
  await db.query('DELETE FROM students;');
  console.log('\nCleaned test users! Only SuperAdmin remains in database.');
  process.exit(0);
}

runTest().catch(console.error);
