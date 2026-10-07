const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL!');

  const tablesQuery = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('--- Current Counts ---');
  for (const row of tablesQuery.rows) {
    const t = row.table_name;
    try {
      const c = await client.query(`SELECT count(*) FROM "${t}"`);
      console.log(`${t}: ${c.rows[0].count}`);
    } catch (e) {
      console.log(`${t}: error (${e.message})`);
    }
  }

  await client.end();
}

run().catch(console.error);
