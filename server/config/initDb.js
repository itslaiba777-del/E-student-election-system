const bcrypt = require('bcrypt');
const db = require('./db');

/**
 * Auto-initialize database tables, default SuperAdmin, and System Branding settings
 */
const initDb = async () => {
  try {
    // 1. Ensure system_settings columns exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        university_name VARCHAR(255) DEFAULT '',
        campus_name VARCHAR(255) DEFAULT '',
        logo_url VARCHAR(500) DEFAULT '',
        registration_number_pattern VARCHAR(255) DEFAULT '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
        otp_expiry_minutes INT DEFAULT 10,
        session_timeout_minutes INT DEFAULT 30,
        face_attempt_limit INT DEFAULT 1,
        otp_attempt_limit INT DEFAULT 5,
        enforce_mfa BOOLEAN DEFAULT true,
        ip_restriction BOOLEAN DEFAULT false,
        support_email VARCHAR(255) DEFAULT '',
        emergency_phone VARCHAR(50) DEFAULT '',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns if system_settings already existed
    await db.query(`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS university_name VARCHAR(255) DEFAULT 'COMSATS University'`);
    await db.query(`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS campus_name VARCHAR(255) DEFAULT 'Main Campus'`);
    await db.query(`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) DEFAULT '/uploads/default-logo.png'`);
    await db.query(`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS registration_number_pattern VARCHAR(255) DEFAULT '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$'`);

    // Ensure at least one row exists in system_settings
    const settingsCheck = await db.query('SELECT COUNT(*) FROM system_settings');
    if (parseInt(settingsCheck.rows[0].count, 10) === 0) {
      await db.query(`
        INSERT INTO system_settings (university_name, campus_name, logo_url, registration_number_pattern)
        VALUES ('', '', '', '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$')
      `);
    }

    // 2. Ensure departments table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        university_id INT DEFAULT 1,
        faculty_id INT,
        department_name VARCHAR(255) NOT NULL,
        department_code VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Ensure elections table has position, scope, CGPA limit, Terms, and Voter Register End columns
    await db.query(`ALTER TABLE elections ADD COLUMN IF NOT EXISTS position_title VARCHAR(255) DEFAULT 'President'`);
    await db.query(`ALTER TABLE elections ADD COLUMN IF NOT EXISTS scope_type VARCHAR(50) DEFAULT 'all_departments'`);
    await db.query(`ALTER TABLE elections ADD COLUMN IF NOT EXISTS department_id INT`);
    await db.query(`ALTER TABLE elections ADD COLUMN IF NOT EXISTS min_cgpa_criteria NUMERIC(3,2) DEFAULT 3.00`);
    await db.query(`ALTER TABLE elections ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT`);
    await db.query(`ALTER TABLE elections ADD COLUMN IF NOT EXISTS total_seats INT DEFAULT 1`);
    await db.query(`ALTER TABLE elections ADD COLUMN IF NOT EXISTS voter_register_end TIMESTAMP WITH TIME ZONE`);

    // 4. Ensure default SuperAdmin exists (Username: superadmin, Password: superadmin123)
    const superCheck = await db.query("SELECT * FROM superadmins WHERE email = 'superadmin@system.com' OR name = 'superadmin'");
    if (superCheck.rows.length === 0) {
      const hash = await bcrypt.hash('superadmin123', 10);
      await db.query(
        `INSERT INTO superadmins (name, email, password_hash)
         VALUES ('superadmin', 'superadmin@system.com', $1)`,
        [hash]
      );
      console.log('✅ Default SuperAdmin created: superadmin / superadmin123');
    }

    // 5. Ensure election_schedule_logs table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS election_schedule_logs (
        id SERIAL PRIMARY KEY,
        election_id INT NOT NULL,
        action_type VARCHAR(100) DEFAULT 'INITIAL_SCHEDULE',
        voting_start TIMESTAMP WITH TIME ZONE,
        voting_end TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database initialization, departments & election criteria verified successfully.');
  } catch (err) {
    console.warn('⚠️ Database init check warning:', err.message);
  }
};

module.exports = initDb;
