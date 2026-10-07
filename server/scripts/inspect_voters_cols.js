const db = require('../config/db');

async function test() {
  const r = await db.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('voters', 'votes', 'candidates')
    ORDER BY table_name, ordinal_position
  `);
  console.log(r.rows);
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
