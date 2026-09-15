/**
 * Face recognition helper utilities
 */

/**
 * Calculates Euclidean Distance between two feature vectors (descriptor arrays)
 * @param {Array<number>} desc1 
 * @param {Array<number>} desc2 
 * @returns {number} Distance score (lower score = higher similarity, threshold typically 0.6)
 */
const calculateEuclideanDistance = (desc1, desc2) => {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  return Math.sqrt(
    desc1.reduce((sum, val, idx) => sum + Math.pow(val - desc2[idx], 2), 0)
  );
};

/**
 * Verifies if face descriptor matches stored registration encoding
 * @param {string|Array} storedEncoding JSON string or array of facial landmark descriptors
 * @param {Array<number>} capturedEncoding Captured face descriptor vector
 * @param {number} threshold Similarity threshold (default 0.6)
 * @returns {boolean} True if matched
 */
const verifyFaceEncoding = (storedEncoding, capturedEncoding, threshold = 0.6) => {
  try {
    const desc1 = typeof storedEncoding === 'string' ? JSON.parse(storedEncoding) : storedEncoding;
    const desc2 = typeof capturedEncoding === 'string' ? JSON.parse(capturedEncoding) : capturedEncoding;
    const distance = calculateEuclideanDistance(desc1, desc2);
    return distance < threshold;
  } catch (error) {
    console.error('Error comparing face encodings:', error);
    return false;
  }
};

module.exports = {
  calculateEuclideanDistance,
  verifyFaceEncoding,
};
