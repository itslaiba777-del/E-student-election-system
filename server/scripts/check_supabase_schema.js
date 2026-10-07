require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connStr = process.env.DATABASE_URL;

async function checkCols() {
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  const tables = ['universities', 'faculties', 'departments', 'programs', 'elections', 'superadmins', 'admins', 'admin_permissions', 'candidates', 'students', 'student_records', 'system_settings'];
  
  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [t]);
    console.log(`\nTable ${t}:`);
    console.log(res.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }

  await client.end();
}

checkCols().catch(console.error);
