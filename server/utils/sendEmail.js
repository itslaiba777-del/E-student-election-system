const nodemailer = require('nodemailer');
require('dotenv').config();

const { generateOtpEmail } = require('../templates/otpVerificationEmail');
const { generateVoteConfirmationEmail } = require('../templates/voteConfirmationEmail');
const { generateRegistrationStatusEmail } = require('../templates/registrationStatusEmail');
const { generateCandidateStatusEmail } = require('../templates/candidateApplicationStatusEmail');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email via Nodemailer
 * @param {string} to Recipient email
 * @param {string} subject Subject line
 * @param {string} text Plain text content
 * @param {string} html HTML body content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (
    !process.env.EMAIL_USER ||
    process.env.EMAIL_USER.includes('your_email') ||
    process.env.EMAIL_USER.includes('placeholder')
  ) {
    console.log(`\n📧 [SIMULATED EMAIL DELIVERED]`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text: ${text}\n`);
    return true;
  }

  const mailOptions = {
    from: `Campus Vote <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: html || text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 [NODEMAILER RESULT]', info);
    return info;
  } catch (err) {
    console.error('❌ [NODEMAILER ERROR]', err);
    throw err;
  }
};

/**
 * Helper: Send 6-digit OTP Verification Email
 */
const sendOtpEmail = async (to, otpCode) => {
  const html = generateOtpEmail(otpCode);
  return await sendEmail({
    to,
    subject: 'Campus Vote - Verification Code',
    text: `Your Campus Vote verification code is ${otpCode}. It expires in 5 minutes.`,
    html,
  });
};

/**
 * Helper: Send Vote Confirmation Receipt Email
 */
const sendVoteConfirmationEmail = async (to, electionName, receiptId) => {
  const html = generateVoteConfirmationEmail(electionName, receiptId);
  return await sendEmail({
    to,
    subject: 'Campus Vote - Vote Receipt & Confirmation',
    text: `Your vote for ${electionName} has been recorded. Receipt ID: ${receiptId}.`,
    html,
  });
};

/**
 * Helper: Send Student Registration Status Email
 */
const sendRegistrationStatusEmail = async (to, status, reason, studentName, regNo) => {
  const html = generateRegistrationStatusEmail(status, reason, studentName, regNo);
  const subject = status === 'approved' ? 'Campus Vote - Registration Approved' : 'Campus Vote - Registration Action Required';
  return await sendEmail({
    to,
    subject,
    text: `Your voter registration status is: ${status.toUpperCase()}.`,
    html,
  });
};

/**
 * Helper: Send Candidate Application Status Email
 */
const sendCandidateStatusEmail = async (to, status, reason, symbolImageUrl, candidateName, positionName, symbolName) => {
  const html = generateCandidateStatusEmail(status, reason, symbolImageUrl, candidateName, positionName, symbolName);
  const subject = status === 'approved' ? 'Campus Vote - Candidate Application Approved' : 'Campus Vote - Candidate Application Update';
  return await sendEmail({
    to,
    subject,
    text: `Your candidate application for ${positionName} status: ${status.toUpperCase()}.`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendVoteConfirmationEmail,
  sendRegistrationStatusEmail,
  sendCandidateStatusEmail,
};
