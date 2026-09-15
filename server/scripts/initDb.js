const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runSchema() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    
    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql on Supabase...');
    await db.query(sql);
    console.log('Schema executed successfully!');

    // Query all created tables in the public schema
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n--- VERIFIED CREATED TABLES IN SUPABASE DATABASE ---');
    tablesRes.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.table_name}`);
    });
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

runSchema();
