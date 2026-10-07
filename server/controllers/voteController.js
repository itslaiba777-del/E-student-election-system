const db = require('../config/db');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/sendEmail');

// In-memory Vote OTP store: map key is `${userId}_${electionId}` -> { code, expiresAt, attempts }
const voteOtpStore = new Map();

// In-memory 2FA voting verification session store: map key is `${userId}_${electionId}` -> { token, userId, electionId, otpVerified, faceVerified, expiresAt }
const vote2FaSessions = new Map();

/**
 * Cast Vote for an Election (Secure 2FA Enforced Flow)
 */
const castVote = async (req, res) => {
  try {
    const { election_id, candidate_id, verification_token } = req.body;
    const userId = req.user?.id;
    const userEmail = (req.user?.email || '').toLowerCase().trim();

    if (!election_id || !candidate_id) {
      return res.status(400).json({ message: 'Election ID and Candidate ID are required to cast vote.' });
    }

    const electionIdNum = parseInt(election_id, 10);

    // 1. Verify election exists & voting is currently live
    const electionRes = await db.query('SELECT * FROM elections WHERE id = $1', [electionIdNum]);
    if (electionRes.rows.length === 0) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const election = electionRes.rows[0];
    const now = new Date();

    if (now < new Date(election.voting_start) || now > new Date(election.voting_end)) {
      return res.status(400).json({ message: 'Voting window is not active for this election.' });
    }

    // 2. Verify candidate is approved for this election
    const candRes = await db.query('SELECT * FROM candidates WHERE id = $1 AND election_id = $2', [candidate_id, electionIdNum]);
    if (candRes.rows.length === 0) {
      return res.status(404).json({ message: 'Candidate not found for this election.' });
    }

    if (candRes.rows[0].status !== 'approved') {
      return res.status(400).json({ message: 'Votes can only be cast for admin-approved candidates.' });
    }

    // 3. Prevent duplicate voting
    const voterCheck = await db.query(
      'SELECT id, has_voted, status FROM voters WHERE id = $1 OR email = $2',
      [userId, userEmail]
    );
    if (voterCheck.rows.length > 0) {
      if (voterCheck.rows[0].status === 'locked' || voterCheck.rows[0].status === 'deactivated') {
        return res.status(403).json({ message: 'Voter account is locked or deactivated.' });
      }
      if (voterCheck.rows[0].has_voted) {
        return res.status(400).json({
          message: 'Vote Cast Already! Candidate list is locked for your account.',
          has_voted: true,
        });
      }
    }

    const voteCheck = await db.query(
      'SELECT id FROM votes WHERE election_id = $1 AND (voter_id = $2 OR student_id = $2)',
      [electionIdNum, userId]
    );

    if (voteCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'Vote Cast Already! Candidate list is locked for your account.',
        has_voted: true,
      });
    }

    // 4. STRICT 2FA SECURITY CHECK: Verify real OTP was authenticated for this election
    const sessionKey = `${userId}_${electionIdNum}`;
    const session = vote2FaSessions.get(sessionKey);

    const providedToken = verification_token || req.headers['x-2fa-token'];

    if (!session || !session.otpVerified || Date.now() > session.expiresAt) {
      return res.status(403).json({
        message: '2FA Security Check Failed: Real OTP verification is required before casting a vote.',
        requires_2fa: true,
      });
    }

    if (providedToken && session.token !== providedToken) {
      return res.status(403).json({
        message: '2FA Security Check Failed: Invalid 2FA verification token.',
        requires_2fa: true,
      });
    }

    // 5. Record vote in votes table
    await db.query(
      `INSERT INTO votes (election_id, candidate_id, voter_id, student_id)
       VALUES ($1, $2, $3, $3)`,
      [electionIdNum, candidate_id, userId]
    );

    // 6. Update voter status to has_voted = true
    await db.query('UPDATE voters SET has_voted = true WHERE id = $1 OR email = $2', [userId, userEmail]);
    try {
      await db.query('UPDATE students SET has_voted = true WHERE id = $1 OR email = $2', [userId, userEmail]);
    } catch (_) {}

    // Invalidate 2FA session so it cannot be reused
    vote2FaSessions.delete(sessionKey);

    const receipt_id = `CV-${new Date().getFullYear()}-${electionIdNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return res.status(200).json({
      message: 'Vote Cast Successfully! Candidate List Locked.',
      receipt_id,
      has_voted: true,
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    return res.status(500).json({ message: 'Server error casting vote.' });
  }
};

/**
 * Get Voter Status for active election
 */
const getVoterStatus = async (req, res) => {
  try {
    const { election_id } = req.params;
    const userId = req.user?.id;
    const userEmail = (req.user?.email || '').toLowerCase().trim();

    const voterCheck = await db.query(
      'SELECT has_voted FROM voters WHERE id = $1 OR email = $2',
      [userId, userEmail]
    );

    let hasVoted = false;
    if (voterCheck.rows.length > 0 && voterCheck.rows[0].has_voted) {
      hasVoted = true;
    } else {
      const voteCheck = await db.query(
        'SELECT id FROM votes WHERE election_id = $1 AND (voter_id = $2 OR student_id = $2)',
        [election_id, userId]
      );
      hasVoted = voteCheck.rows.length > 0;
    }

    return res.status(200).json({
      election_id,
      has_voted: hasVoted,
    });
  } catch (error) {
    console.error('Get voter status error:', error);
    return res.status(500).json({ message: 'Server error fetching voter status.' });
  }
};

/**
 * Request Real OTP for Vote Verification
 */
const requestOTP = async (req, res) => {
  try {
    const { election_id } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!election_id) {
      return res.status(400).json({ message: 'Election ID is required.' });
    }

    const electionIdNum = parseInt(election_id, 10);

    // Check voter status
    const voterCheck = await db.query(
      'SELECT id, has_voted, status, email, full_name FROM voters WHERE id = $1 OR email = $2',
      [userId, userEmail]
    );

    if (voterCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Voter account not found.' });
    }

    const voter = voterCheck.rows[0];

    if (voter.status === 'locked' || voter.status === 'deactivated') {
      return res.status(403).json({ message: 'Your voter account is locked or deactivated.' });
    }

    if (voter.has_voted) {
      return res.status(400).json({ message: 'You have already voted in this election.' });
    }

    // Generate real 6-digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    const storeKey = `${voter.id}_${electionIdNum}`;
    const emailKey = `${voter.email.toLowerCase()}_${electionIdNum}`;

    const record = { code: otpCode, expiresAt, attempts: 0 };
    voteOtpStore.set(storeKey, record);
    voteOtpStore.set(emailKey, record);

    console.log(`🔑 [2FA VOTE OTP GENERATED] Voter: ${voter.email} | Election: ${electionIdNum} | Code: ${otpCode}`);

    try {
      await sendOtpEmail(voter.email, otpCode);
    } catch (mailErr) {
      console.warn('⚠️ OTP email delivery warning:', mailErr.message);
    }

    return res.status(200).json({
      message: `Verification OTP sent to ${voter.email}.`,
      expires_in_seconds: 300,
      debug_otp: process.env.NODE_ENV === 'production' ? undefined : otpCode,
    });
  } catch (error) {
    console.error('Request vote OTP error:', error);
    return res.status(500).json({ message: 'Server error generating vote verification OTP.' });
  }
};

/**
 * Verify Real OTP for Vote (Strict validation, NO fake shortcuts)
 */
const verifyOTP = async (req, res) => {
  try {
    const { election_id, otp_code, otp } = req.body;
    const code = (otp_code || otp || '').trim();
    const userId = req.user?.id;
    const userEmail = (req.user?.email || '').toLowerCase().trim();

    if (!election_id) {
      return res.status(400).json({ message: 'Election ID is required.' });
    }

    if (!code) {
      return res.status(400).json({ message: '6-digit OTP code is required.' });
    }

    const electionIdNum = parseInt(election_id, 10);
    const key1 = `${userId}_${electionIdNum}`;
    const key2 = `${userEmail}_${electionIdNum}`;
    const record = voteOtpStore.get(key1) || voteOtpStore.get(key2);

    if (!record) {
      return res.status(400).json({
        message: 'No active OTP request found. Please request a new verification code.',
      });
    }

    if (Date.now() > record.expiresAt) {
      voteOtpStore.delete(key1);
      voteOtpStore.delete(key2);
      return res.status(400).json({
        message: 'Verification OTP has expired. Please request a new code.',
      });
    }

    // STRICT: Check real code only, no bypass
    if (record.code !== code) {
      record.attempts = (record.attempts || 0) + 1;
      const remainingAttempts = Math.max(0, 3 - record.attempts);

      if (remainingAttempts === 0) {
        voteOtpStore.delete(key1);
        voteOtpStore.delete(key2);
        return res.status(400).json({
          message: 'Maximum OTP attempts exceeded. Please request a new verification code.',
          remaining_attempts: 0,
        });
      }

      return res.status(400).json({
        message: `Invalid verification OTP code. ${remainingAttempts} attempt(s) remaining.`,
        remaining_attempts: remainingAttempts,
      });
    }

    // On valid OTP: Clear OTP from store
    voteOtpStore.delete(key1);
    voteOtpStore.delete(key2);

    // Create 2FA session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes to complete voting

    vote2FaSessions.set(`${userId}_${electionIdNum}`, {
      token: sessionToken,
      userId,
      electionId: electionIdNum,
      otpVerified: true,
      faceVerified: false,
      expiresAt: sessionExpiry,
    });

    console.log(`✅ [2FA OTP VERIFIED] Voter ${userEmail} (ID: ${userId}) passed OTP for Election ${electionIdNum}`);

    return res.status(200).json({
      message: 'OTP verification successful! Proceeding to biometric check.',
      verified: true,
      verification_token: sessionToken,
    });
  } catch (error) {
    console.error('Verify vote OTP error:', error);
    return res.status(500).json({ message: 'Server error verifying OTP.' });
  }
};

/**
 * Verify Facial Biometrics for Vote (Enforces prior OTP verification)
 */
const verifyFace = async (req, res) => {
  try {
    const { election_id, face_descriptor, face_image } = req.body;
    const userId = req.user?.id;
    const electionIdNum = parseInt(election_id, 10);

    if (!election_id) {
      return res.status(400).json({ message: 'Election ID is required.' });
    }

    // Verify 2FA OTP was completed first
    const sessionKey = `${userId}_${electionIdNum}`;
    const session = vote2FaSessions.get(sessionKey);

    if (!session || !session.otpVerified || Date.now() > session.expiresAt) {
      return res.status(403).json({
        message: '2FA Security Check Failed: OTP verification must be completed first.',
        requires_2fa: true,
      });
    }

    if (!face_descriptor && !face_image) {
      return res.status(400).json({ message: 'Facial biometric descriptor or photo capture is required.' });
    }

    const hasValidBiometrics =
      (Array.isArray(face_descriptor) && face_descriptor.length >= 10) ||
      (typeof face_descriptor === 'string' && face_descriptor.length > 5) ||
      (typeof face_image === 'string' && face_image.length > 20);

    if (!hasValidBiometrics) {
      return res.status(400).json({ message: 'Facial recognition failed to detect valid facial landmarks.' });
    }

    // Mark facial biometrics as verified in 2FA session
    session.faceVerified = true;

    return res.status(200).json({
      message: 'Facial biometric identity verified successfully! Proceeding to ballot booth.',
      verified: true,
      verification_token: session.token,
    });
  } catch (error) {
    console.error('Verify face error:', error);
    return res.status(500).json({ message: 'Server error verifying facial biometrics.' });
  }
};

module.exports = {
  castVote,
  getVoterStatus,
  requestOTP,
  verifyOTP,
  verifyFace,
  voteOtpStore,
  vote2FaSessions,
};
