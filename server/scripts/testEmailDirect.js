require('dotenv').config();
const { sendOtpEmail } = require('../utils/sendEmail');

async function testRealEmail() {
  try {
    console.log('Testing sending real OTP email...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    const result = await sendOtpEmail('itslaiba.777@gmail.com', '123456');
    console.log('✅ Email sent successfully:', result);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
}

testRealEmail();
