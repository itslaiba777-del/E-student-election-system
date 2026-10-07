require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connStr = process.env.DATABASE_URL;

async function inspect() {
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL successfully!');

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('\nTables in Supabase:');
  for (const t of tablesRes.rows) {
    const countRes = await client.query(`SELECT count(*) FROM "${t.table_name}"`);
    console.log(` - ${t.table_name}: ${countRes.rows[0].count} rows`);
  }

  await client.end();
}

inspect().catch(err => {
  console.error('Inspection error:', err.message);
  process.exit(1);
});
