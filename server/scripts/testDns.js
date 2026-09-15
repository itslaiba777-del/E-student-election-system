const dns = require('dns').promises;

async function testDns() {
  const host = 'db.ohdqjnvsakiiojekuciv.supabase.co';
  console.log('Testing DNS lookup for:', host);

  try {
    const aaaa = await dns.resolve6(host);
    console.log('AAAA (IPv6) records:', aaaa);
  } catch (err) {
    console.log('AAAA lookup failed:', err.message);
  }

  try {
    const a = await dns.resolve4(host);
    console.log('A (IPv4) records:', a);
  } catch (err) {
    console.log('A lookup failed:', err.message);
  }
}

testDns();
