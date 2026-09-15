const { Client } = require('pg');

async function testConnection(connStr, label) {
  console.log(`Testing connection: ${label}...`);
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`SUCCESS: ${label}`);
    const res = await client.query('SELECT NOW();');
    console.log('Result:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED: ${label} ->`, err.message);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function runTests() {
  const password = 'itslaiba777%40';
  
  // 1. Direct IPv6 address
  const connIPv6 = `postgresql://postgres:${password}@[2406:da1c:16f1:f602:e054:2c0a:42ca:29c9]:5432/postgres`;
  if (await testConnection(connIPv6, 'IPv6 Direct IP')) return;

  // 2. Supabase Pooler regional hosts (port 5432 or 6543)
  const regions = [
    'aws-0-ap-south-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com',
    'aws-0-sa-east-1.pooler.supabase.com'
  ];

  for (const host of regions) {
    // Session pooler on port 5432 with project ref prepended to username
    const connPooler5432 = `postgresql://postgres.ohdqjnvsakiiojekuciv:${password}@${host}:5432/postgres`;
    if (await testConnection(connPooler5432, `Pooler ${host}:5432`)) return;

    const connPooler6543 = `postgresql://postgres.ohdqjnvsakiiojekuciv:${password}@${host}:6543/postgres`;
    if (await testConnection(connPooler6543, `Pooler ${host}:6543`)) return;
  }
}

runTests();
