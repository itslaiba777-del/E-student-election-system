const { Client } = require('pg');

const regions = [
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-0-ap-southeast-2.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-2.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-ca-central-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-me-central-1.pooler.supabase.com'
];

async function checkPooler(host) {
  const password = 'itslaiba777%40';
  const connStr = `postgresql://postgres.ohdqjnvsakiiojekuciv:${password}@${host}:6543/postgres`;
  
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000,
  });

  try {
    await client.connect();
    console.log(`\n🎉 WORKING POOLER FOUND: ${host}`);
    const res = await client.query('SELECT NOW();');
    console.log('QueryResult:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    if (!err.message.includes('tenant/user') && !err.message.includes('timeout')) {
      console.log(`Response from ${host}:`, err.message);
    }
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  console.log('Testing Supabase Pooler Regions...');
  for (const host of regions) {
    const ok = await checkPooler(host);
    if (ok) break;
  }
}

main();
