const nodemailer = require('nodemailer');
require('dotenv').config();

const { generateOtpEmail } = require('../templates/otpVerificationEmail');
const { generateVoteConfirmationEmail } = require('../templates/voteConfirmationEmail');
const { generateRegistrationStatusEmail } = require('../templates/registrationStatusEmail');
const { generateCandidateStatusEmail } = require('../templates/candidateApplicationStatusEmail');

const getTransporter = () => {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    throw new Error('EMAIL_USER and EMAIL_PASS environment variables are not configured on Render. Please add them in Render Dashboard -> Environment.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

/**
 * Send email via Nodemailer
 * @param {string} to Recipient email
 * @param {string} subject Subject line
 * @param {string} text Plain text content
 * @param {string} html HTML body content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const transporter = getTransporter();

  const mailOptions = {
    from: `Campus Vote <${emailUser}>`,
    to,
    subject,
    text,
    html: html || text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 [EMAIL DELIVERED to ${to}]`, info.messageId);
    return info;
  } catch (err) {
    console.error(`❌ [EMAIL DELIVERY FAILED to ${to}]:`, err);
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
