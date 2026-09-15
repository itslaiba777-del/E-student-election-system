const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

let rawConnectionString = process.env.DATABASE_URL;

const poolConfig = rawConnectionString
  ? {
      connectionString: rawConnectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
    };

const pool = new Pool(poolConfig);

// In-Memory Database Store Fallback if PostgreSQL cloud service is offline
const memoryDb = {
  superadmins: [
    {
      id: 1,
      name: 'superadmin',
      email: 'superadmin@system.com',
      password_hash: '$2b$10$3n9g3sN00x0G/7.Xj3O68.d.tJ2cE6pXp80Z9k0w5n1Y0O.O0O0O0', // bcrypt superadmin123
    },
  ],
  admins: [
    {
      id: 1,
      name: 'Laiba Khan',
      email: 'laiba@comsats.edu.pk',
      password_hash: '$2b$10$3n9g3sN00x0G/7.Xj3O68.d.tJ2cE6pXp80Z9k0w5n1Y0O.O0O0O0', // bcrypt laiba123
      level: 'department',
      university_id: 1,
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ],
  system_settings: [
    {
      id: 1,
      university_name: '',
      campus_name: '',
      logo_url: '',
      registration_number_pattern: '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
      support_email: '',
      emergency_phone: '',
    },
  ],
  universities: [
    {
      id: 1,
      university_name: 'COMSATS University',
      logo_url: '/uploads/default-logo.png',
    },
  ],
  students: [],
  elections: [
    {
      id: 1,
      title: 'University Executive Union Election 2026',
      position_title: 'President',
      university_id: 1,
      scope: 'university-wide',
      scope_type: 'all_departments',
      min_semester: 3,
      min_cgpa_criteria: 3.0,
      terms_and_conditions: 'Must be active student with clean academic record.',
      candidate_apply_start: '2026-08-01T00:00',
      candidate_apply_end: '2026-09-01T23:59',
      voter_register_start: '2026-08-01T00:00',
      voter_register_end: '2026-09-03T23:59',
      voting_start: '2026-08-01T00:00',
      voting_end: '2026-09-30T23:59',
      status: 'active',
    },
  ],
  candidates: [
    {
      id: 1,
      name: 'Sara Khan',
      father_name: 'Muhammad Aslam Khan',
      party: 'Student Unity Front',
      slogan: 'Empowering Student Voices & Smart Campus Facilities',
      aim_and_mission: 'To modernize university labs, expand digital research access, and establish transparent student representation.',
      post_election_plan: '1. 24/7 Library & AI Computer Lab Access\n2. Subsidized campus shuttle service\n3. Direct student helpline & monthly townhall meetings',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      symbol_image_url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=150',
      symbol_name: 'Eagle Mark (Shaheen)',
      registration_number: 'SP22-BSE-019',
      cnic: '35202-7654321-2',
      email: 'sara@student.edu.pk',
      cgpa: 3.72,
      department_name: 'Software Engineering',
      position_title: 'President',
      election_id: 1,
      status: 'pending',
    },
    {
      id: 2,
      name: 'Ali Raza',
      father_name: 'Tariq Mehmood Raza',
      party: 'Techno Alliance',
      slogan: 'Digital Innovation & Next-Gen Tech Labs',
      aim_and_mission: 'Focusing on high-speed campus Wi-Fi, industrial internship placements, and hackathon sponsorships.',
      post_election_plan: '1. Campus-wide high-speed Wi-Fi 6 upgrade\n2. $10,000 Annual Tech Innovation Fund for students\n3. Automated online fee submission & portal fixes',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      symbol_image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150',
      symbol_name: 'Laptop & Torch Mark',
      registration_number: 'FA21-BCS-042',
      cnic: '35202-1234567-1',
      email: 'ali@student.edu.pk',
      cgpa: 3.85,
      department_name: 'Computer Science',
      position_title: 'President',
      election_id: 1,
      status: 'approved',
    },
  ],
  votes: [],
};

// Initialize synchronous bcrypt hash for fallback
(async () => {
  try {
    const hashSuper = await bcrypt.hash('superadmin123', 10);
    const hashAdmin = await bcrypt.hash('laiba123', 10);
    memoryDb.superadmins[0].password_hash = hashSuper;
    memoryDb.admins[0].password_hash = hashAdmin;
  } catch (e) {}
})();

let isDbConnected = false;

pool.on('connect', () => {
  isDbConnected = true;
});

pool.on('error', (err) => {
  isDbConnected = false;
});

const safeQuery = async (text, params = []) => {
  try {
    const res = await pool.query(text, params);
    isDbConnected = true;
    return res;
  } catch (err) {
    // If remote connection fails, handle with safe memory fallback
    const queryStr = text.trim().toLowerCase();

    // 1. SELECT COUNT
    if (queryStr.startsWith('select count(*)')) {
      if (queryStr.includes('from universities')) return { rows: [{ count: memoryDb.universities.length }] };
      if (queryStr.includes('from admins')) return { rows: [{ count: memoryDb.admins.length }] };
      if (queryStr.includes('from students')) return { rows: [{ count: memoryDb.students.length }] };
      if (queryStr.includes('from elections')) return { rows: [{ count: memoryDb.elections.length }] };
      if (queryStr.includes('from system_settings')) return { rows: [{ count: memoryDb.system_settings.length }] };
      return { rows: [{ count: 0 }] };
    }

    // 2. SELECT FROM superadmins
    if (queryStr.includes('from superadmins')) {
      const match = memoryDb.superadmins.find((s) => {
        if (!params || params.length === 0) return true;
        const val = (params[0] || '').toString().toLowerCase();
        return s.email.toLowerCase() === val || s.name.toLowerCase() === val;
      });
      return { rows: match ? [match] : [] };
    }

    // 3. SELECT FROM admins
    if (queryStr.includes('from admins')) {
      if (params && params.length > 0) {
        const val = (params[0] || '').toString().toLowerCase();
        const match = memoryDb.admins.find(
          (a) =>
            a.email.toLowerCase() === val ||
            a.name.toLowerCase() === val ||
            a.name.toLowerCase().split(' ')[0] === val
        );
        return { rows: match ? [match] : [] };
      }
      return { rows: memoryDb.admins };
    }

    // 4. SELECT FROM system_settings
    if (queryStr.includes('from system_settings')) {
      return { rows: memoryDb.system_settings };
    }

    // 5. SELECT FROM departments
    if (queryStr.includes('from departments')) {
      return { rows: memoryDb.departments || [] };
    }

    // 6. INSERT INTO departments
    if (queryStr.startsWith('insert into departments')) {
      const newDept = {
        id: (memoryDb.departments || []).length + 1,
        department_name: params[0] || 'New Department',
        department_code: params[1] || 'DEPT',
        created_at: new Date().toISOString(),
      };
      if (!memoryDb.departments) memoryDb.departments = [];
      memoryDb.departments.unshift(newDept);
      return { rows: [newDept] };
    }

    // 7. SELECT FROM students
    if (queryStr.includes('from students')) {
      return { rows: memoryDb.students || [] };
    }

    // 8. INSERT INTO admins
    if (queryStr.startsWith('insert into admins')) {
      const newAdmin = {
        id: memoryDb.admins.length + 1,
        name: params[0] || 'Admin',
        email: params[1] || 'admin@university.edu',
        password_hash: params[2],
        level: params[3] || 'university',
        university_id: params[4] || 1,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      memoryDb.admins.unshift(newAdmin);
      return { rows: [newAdmin] };
    }

    // 6. UPDATE admins
    if (queryStr.startsWith('update admins set password_hash')) {
      const id = params[1];
      const admin = memoryDb.admins.find((a) => a.id == id);
      if (admin) {
        admin.password_hash = params[0];
        return { rows: [admin] };
      }
      return { rows: [] };
    }

    // 7. UPDATE system_settings
    if (queryStr.startsWith('update system_settings') || queryStr.startsWith('insert into system_settings')) {
      if (params[0]) memoryDb.system_settings[0].university_name = params[0];
      if (params[1]) memoryDb.system_settings[0].campus_name = params[1];
      if (params[2]) memoryDb.system_settings[0].logo_url = params[2];
      if (params[3]) memoryDb.system_settings[0].registration_number_pattern = params[3];
      return { rows: memoryDb.system_settings };
    }

    // 8. INSERT INTO elections
    if (queryStr.startsWith('insert into elections')) {
      const newElec = {
        id: (memoryDb.elections || []).length + 1,
        title: params[0],
        position_title: params[1],
        total_seats: params[2] || 20,
        university_id: params[3],
        scope: params[4],
        scope_type: params[5],
        department_id: params[6],
        min_semester: params[7],
        min_cgpa_criteria: params[8],
        terms_and_conditions: params[9],
        candidate_apply_start: params[10],
        candidate_apply_end: params[11],
        voter_register_start: params[12],
        voter_register_end: params[13],
        voting_start: params[14],
        voting_end: params[15],
        status: 'upcoming',
        created_at: new Date().toISOString(),
      };
      if (!memoryDb.elections) memoryDb.elections = [];
      memoryDb.elections.unshift(newElec);
      return { rows: [newElec] };
    }

    // 8b. UPDATE elections
    if (queryStr.startsWith('update elections')) {
      const id = params[params.length - 1];
      const elec = (memoryDb.elections || []).find((e) => e.id == id);
      if (elec) {
        if (params[0]) elec.candidate_apply_end = params[0];
        if (params[1]) elec.voter_register_end = params[1];
        if (params[2]) elec.voting_start = params[2];
        if (params[3]) elec.voting_end = params[3];
        return { rows: [elec] };
      }
      return { rows: [] };
    }

    // 9. SELECT FROM elections
    if (queryStr.includes('from elections')) {
      return { rows: memoryDb.elections || [] };
    }

    // 10. SELECT FROM candidates
    if (queryStr.includes('from candidates')) {
      return { rows: memoryDb.candidates || [] };
    }

    // 11. INSERT INTO election_schedule_logs
    if (queryStr.includes('insert into election_schedule_logs')) {
      if (!memoryDb.election_schedule_logs) memoryDb.election_schedule_logs = [];
      const newLog = {
        id: memoryDb.election_schedule_logs.length + 1,
        election_id: parseInt(params[0], 10),
        action_type: params[1] || 'INITIAL_SCHEDULE',
        voting_start: params[2],
        voting_end: params[3],
        created_at: new Date().toISOString(),
      };
      memoryDb.election_schedule_logs.unshift(newLog);
      return { rows: [newLog] };
    }

    // 12. SELECT FROM election_schedule_logs
    if (queryStr.includes('from election_schedule_logs')) {
      const elecId = params[0];
      const logs = (memoryDb.election_schedule_logs || []).filter(
        (l) => l.election_id == elecId
      );
      return { rows: logs };
    }

    return { rows: [] };
  }
};

module.exports = {
  query: safeQuery,
  pool,
};
