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
  admins: [],
  system_settings: [
    {
      id: 1,
      university_name: 'COMSATS University Islamabad',
      campus_name: 'Main Campus',
      logo_url: '/uploads/default-logo.png',
      registration_number_pattern: '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
      support_email: 'support@campusvote.edu',
      emergency_phone: '+1 (555) 012-3456',
    },
  ],
  universities: [
    {
      id: 1,
      university_name: 'COMSATS University Islamabad',
      logo_url: '/uploads/default-logo.png',
    },
  ],
  faculties: [],
  departments: [],
  programs: [],
  students: [],
  elections: [],
  candidates: [],
  votes: [],
};

// Initialize synchronous bcrypt hash for fallback
(async () => {
  try {
    const hashSuper = await bcrypt.hash('superadmin123', 10);
    memoryDb.superadmins[0].password_hash = hashSuper;
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
      if (queryStr.includes('from superadmins')) return { rows: [{ count: memoryDb.superadmins.length }] };
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

    // DELETE FROM departments
    if (queryStr.startsWith('delete from departments')) {
      const id = params[0];
      if (memoryDb.departments) {
        memoryDb.departments = memoryDb.departments.filter((d) => d.id != id);
      }
      if (memoryDb.faculties) {
        memoryDb.faculties = memoryDb.faculties.filter((f) => f.id != id);
      }
      if (memoryDb.programs) {
        memoryDb.programs = memoryDb.programs.filter((p) => p.department_id != id);
      }
      return { rows: [] };
    }

    // DELETE FROM programs
    if (queryStr.startsWith('delete from programs')) {
      const id = params[0];
      if (queryStr.includes('where department_id')) {
        if (memoryDb.programs) {
          memoryDb.programs = memoryDb.programs.filter((p) => p.department_id != id);
        }
      } else {
        if (memoryDb.programs) {
          memoryDb.programs = memoryDb.programs.filter((p) => p.id != id);
        }
      }
      return { rows: [] };
    }

    // DELETE FROM faculties
    if (queryStr.startsWith('delete from faculties')) {
      const id = params[0];
      if (memoryDb.faculties) {
        memoryDb.faculties = memoryDb.faculties.filter((f) => f.id != id);
      }
      return { rows: [] };
    }

    // INSERT INTO faculties
    if (queryStr.startsWith('insert into faculties')) {
      const name = params[0] || 'New Faculty';
      const uniId = params[1] || 1;
      const newFac = {
        id: (memoryDb.faculties || []).length + 1,
        faculty_name: name,
        university_id: uniId,
        created_at: new Date().toISOString(),
      };
      if (!memoryDb.faculties) memoryDb.faculties = [];
      memoryDb.faculties.push(newFac);
      return { rows: [newFac] };
    }

    // INSERT INTO departments
    if (queryStr.startsWith('insert into departments')) {
      const name = params[0] || 'New Department';
      const code = typeof params[1] === 'string' ? params[1] : (typeof params[2] === 'string' ? params[2] : name.substring(0, 4).toUpperCase());
      const facId = typeof params[1] === 'number' ? params[1] : (typeof params[2] === 'number' ? params[2] : (typeof params[3] === 'number' ? params[3] : 1));
      const newDept = {
        id: (memoryDb.departments || []).length + 1,
        department_name: name,
        department_code: code,
        faculty_id: facId,
        university_id: 1,
        created_at: new Date().toISOString(),
      };
      if (!memoryDb.departments) memoryDb.departments = [];
      memoryDb.departments.push(newDept);
      if (!memoryDb.faculties) memoryDb.faculties = [];
      if (!memoryDb.faculties.some((f) => f.id == newDept.id)) {
        memoryDb.faculties.push({ id: newDept.id, faculty_name: name, university_id: 1 });
      }
      return { rows: [newDept] };
    }

    // INSERT INTO programs
    if (queryStr.startsWith('insert into programs')) {
      const pName = params[0] || 'New Program';
      const dId = parseInt(params[1], 10) || 1;
      const newProg = {
        id: (memoryDb.programs || []).length + 100,
        program_name: pName,
        department_id: dId,
        created_at: new Date().toISOString(),
      };
      if (!memoryDb.programs) memoryDb.programs = [];
      memoryDb.programs.push(newProg);
      return { rows: [newProg] };
    }

    // SELECT FROM faculties
    if (queryStr.includes('from faculties')) {
      return { rows: memoryDb.faculties || [] };
    }

    // SELECT FROM departments
    if (queryStr.includes('from departments')) {
      if (queryStr.includes('where faculty_id')) {
        const facId = params[0];
        return { rows: (memoryDb.departments || []).filter((d) => d.faculty_id == facId) };
      }
      return { rows: memoryDb.departments || [] };
    }

    // SELECT FROM programs
    if (queryStr.includes('from programs')) {
      if (queryStr.includes('where department_id')) {
        const deptId = params[0];
        return { rows: (memoryDb.programs || []).filter((p) => p.department_id == deptId) };
      }
      return { rows: memoryDb.programs || [] };
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
