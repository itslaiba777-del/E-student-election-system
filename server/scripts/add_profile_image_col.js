require('dotenv').config();
const db = require('../config/db');

async function migrate() {
  try {
    await db.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_image_url TEXT');
    await db.query('ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_image_url TEXT');
    console.log('✅ Added profile_image_url column to students and candidates tables.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
