const cron = require('node-cron');
const db = require('../config/db');

/**
 * Scheduled cron job to check and auto-close elections whose voting_end time has passed
 */
const initAutoCloseElectionsJob = () => {
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date().toISOString();
      const updateResult = await db.query(
        `UPDATE elections 
         SET status = 'closed', updated_at = NOW() 
         WHERE status = 'active' AND voting_end <= $1 
         RETURNING id, title`,
        [now]
      );

      if (updateResult.rowCount > 0) {
        updateResult.rows.forEach((election) => {
          console.log(`[CRON] Auto-closed election ID ${election.id}: "${election.title}"`);
        });
      }
    } catch (error) {
      console.error('[CRON] Error auto-closing elections:', error);
    }
  });

  console.log('[CRON] Auto-close elections scheduled job initialized.');
};

module.exports = initAutoCloseElectionsJob;
