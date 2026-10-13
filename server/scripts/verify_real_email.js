const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('Testing Nodemailer with user:', process.env.EMAIL_USER);
console.log('Testing Nodemailer with pass length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function run() {
  try {
    const info = await transporter.sendMail({
      from: `Campus Vote <${process.env.EMAIL_USER}>`,
      to: 'itslaiba.777@gmail.com',
      subject: '🎉 Test OTP Verification - Campus Vote System',
      text: 'Congratulations! Your real email delivery is working perfectly. Your test OTP code is 987654.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #1B5E20;">🎉 Real Email Verification Successful!</h2>
          <p>Congratulations! Your real Gmail email delivery is now 100% active and working.</p>
          <p>Your Test Verification OTP Code is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1B5E20; background: #e8f5e9; padding: 10px 20px; display: inline-block; border-radius: 8px;">
            987654
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">This email was sent from the University Student E-Election System.</p>
        </div>
      `,
    });
    console.log('✅ NODEMAILER TEST SUCCEEDED 100%!');
    console.log('Response:', info.response);
    console.log('Message ID:', info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('❌ Nodemailer test failed:', err);
    process.exit(1);
  }
}

run();
