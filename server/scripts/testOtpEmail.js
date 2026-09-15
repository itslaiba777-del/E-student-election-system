require('dotenv').config();
const db = require('../config/db');
const { requestVotingOTP } = require('../controllers/voteController');

async function testOtpEmail() {
  try {
    console.log('--- STARTING LIVE OTP EMAIL TEST FOR ALEX@TEST.COM ---');
    
    // Find student alex@test.com
    const studentRes = await db.query("SELECT * FROM students WHERE email = 'alex@test.com'");
    if (studentRes.rows.length === 0) {
      console.error('Student alex@test.com not found in database. Please run node scripts/seedData.js first.');
      process.exit(1);
    }
    const student = studentRes.rows[0];
    console.log(`Found student: ID=${student.id}, CNIC=${student.cnic}, Email=${student.email}`);

    // Find active election
    const electionRes = await db.query("SELECT id, title FROM elections WHERE status = 'active' LIMIT 1");
    if (electionRes.rows.length === 0) {
      console.error('No active election found in database. Please run node scripts/seedData.js first.');
      process.exit(1);
    }
    const election = electionRes.rows[0];
    console.log(`Found active election: ID=${election.id}, Title="${election.title}"`);

    // Reset voting_status for this student and election to avoid "max attempts" or "already voted" lock during test
    await db.query("DELETE FROM voting_status WHERE student_id = $1 AND election_id = $2", [student.id, election.id]);
    await db.query("DELETE FROM otp_records WHERE student_id = $1", [student.id]);

    // Mock Express req & res objects
    const req = {
      user: {
        id: student.id,
        email: student.email,
        role: 'student'
      },
      body: {
        election_id: election.id
      }
    };

    let responseData = null;
    let statusCode = null;

    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      }
    };

    console.log('\n--- INVOKING requestVotingOTP ---');
    await requestVotingOTP(req, res);

    console.log('\n--- CONTROLLER RESPONSE ---');
    console.log(`HTTP Status: ${statusCode}`);
    console.log('Response Data:', JSON.stringify(responseData, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Execution error:', err);
    process.exit(1);
  }
}

testOtpEmail();
