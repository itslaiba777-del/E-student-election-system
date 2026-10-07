const db = require('../config/db');

async function ensureVotesSchema() {
  try {
    await db.query(`ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_id integer;`);
    await db.query(`ALTER TABLE votes ADD COLUMN IF NOT EXISTS student_id integer;`);
    console.log('✅ votes table schema columns verified/added.');
  } catch (err) {
    console.warn('votes table schema warning:', err.message);
  }
  process.exit(0);
}

ensureVotesSchema();
