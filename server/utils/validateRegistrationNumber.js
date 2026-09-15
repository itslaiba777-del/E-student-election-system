/**
 * Validates student registration number against stored university Regex pattern
 * @param {string} registrationNumber 
 * @param {string} pattern Regex string e.g. "^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$"
 * @returns {boolean}
 */
const validateRegistrationNumber = (registrationNumber, pattern) => {
  if (!registrationNumber || !pattern) return false;
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(registrationNumber.trim());
  } catch (error) {
    console.error('Invalid Regex pattern provided for registration number validation:', error);
    return false;
  }
};

module.exports = validateRegistrationNumber;
