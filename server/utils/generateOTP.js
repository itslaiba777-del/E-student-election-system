const crypto = require('crypto');

/**
 * Generate 6-digit numeric OTP code
 * @returns {string} 6-digit OTP code string
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateOTP;
