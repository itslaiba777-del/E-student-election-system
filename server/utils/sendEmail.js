const nodemailer = require('nodemailer');
require('dotenv').config();

const { generateOtpEmail } = require('../templates/otpVerificationEmail');
const { generateVoteConfirmationEmail } = require('../templates/voteConfirmationEmail');
const { generateRegistrationStatusEmail } = require('../templates/registrationStatusEmail');
const { generateCandidateStatusEmail } = require('../templates/candidateApplicationStatusEmail');

const INTERNAL_SECRET = 'campus_vote_secure_mail_2026_bridge';
const VERCEL_API_URL = process.env.VERCEL_APP_URL
  ? `${process.env.VERCEL_APP_URL.replace(/\/$/, '')}/api/send-email`
  : 'https://e-student-election-system.vercel.app/api/send-email';

/**
 * Send email via Vercel HTTPS Bridge (solves Render free-tier SMTP port 465/587 blocking)
 */
const sendViaVercelBridge = async ({ to, subject, text, html, emailUser, emailPass }) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: INTERNAL_SECRET,
        to,
        subject,
        text,
        html,
        emailUser,
        emailPass,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      console.log(`📧 [EMAIL DELIVERED via Vercel Bridge to ${to}]:`, data.messageId);
      return data;
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn(`⚠️ Vercel bridge HTTP ${res.status}:`, errData.error || res.statusText);
      return null;
    }
  } catch (bridgeErr) {
    console.warn(`⚠️ Vercel bridge network error: ${bridgeErr.message}. Falling back to direct SMTP.`);
    return null;
  }
};

/**
 * Direct SMTP Transporter (Fallback for local dev or paid servers)
 */
const getDirectTransporter = (emailUser, emailPass) => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 10000,
  });
};

/**
 * Primary sendEmail handler
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    throw new Error('EMAIL_USER and EMAIL_PASS environment variables are not configured. Please add them in Render / .env.');
  }

  // 1. First attempt: Send via Vercel HTTPS Bridge (bypasses Render SMTP port block)
  const bridgeResult = await sendViaVercelBridge({ to, subject, text, html, emailUser, emailPass });
  if (bridgeResult) {
    return bridgeResult;
  }

  // 2. Second attempt: Direct SMTP transport (for local testing or non-blocked hosts)
  try {
    const directTransporter = getDirectTransporter(emailUser, emailPass);
    const mailOptions = {
      from: `Campus Vote <${emailUser}>`,
      to,
      subject,
      text,
      html: html || text,
    };
    const info = await directTransporter.sendMail(mailOptions);
    console.log(`📧 [EMAIL DELIVERED via Direct SMTP to ${to}]:`, info.messageId);
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
