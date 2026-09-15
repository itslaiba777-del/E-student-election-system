const db = require('../config/db');

async function runMigration() {
  try {
    console.log('Running database migrations...');
    await db.query(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS batch VARCHAR(50);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3,2);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS party_name VARCHAR(255);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS symbol_url VARCHAR(500);
      ALTER TABLE students ADD COLUMN IF NOT EXISTS manifesto TEXT;

      ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS min_candidate_cgpa NUMERIC(3,2) DEFAULT 3.50;
    `);
    console.log('✅ Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
