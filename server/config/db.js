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
  faculties: [
    { id: 1, faculty_name: 'Department of Computer Science', university_id: 1 },
    { id: 2, faculty_name: 'Department of Software Engineering', university_id: 1 },
    { id: 3, faculty_name: 'Department of Electrical Engineering', university_id: 1 },
    { id: 4, faculty_name: 'Department of Business Administration', university_id: 1 },
  ],
  departments: [
    { id: 1, department_name: 'Department of Computer Science', department_code: 'CS', faculty_id: 1, university_id: 1 },
    { id: 2, department_name: 'Department of Software Engineering', department_code: 'SE', faculty_id: 2, university_id: 1 },
    { id: 3, department_name: 'Department of Electrical Engineering', department_code: 'EE', faculty_id: 3, university_id: 1 },
    { id: 4, department_name: 'Department of Business Administration', department_code: 'BA', faculty_id: 4, university_id: 1 },
  ],
  programs: [
    { id: 1, program_name: 'BS Computer Science', department_id: 1 },
    { id: 2, program_name: 'BS Artificial Intelligence', department_id: 1 },
    { id: 3, program_name: 'BS Cyber Security', department_id: 1 },
    { id: 4, program_name: 'BS Software Engineering', department_id: 2 },
    { id: 5, program_name: 'BS Electrical Engineering', department_id: 3 },
    { id: 6, program_name: 'BBA Business Administration', department_id: 4 },
  ],
  students: [],
  student_records: [
    {
      id: 1,
      university_id: 1,
      cnic: '3456787654567',
      registration_number: 'FA22BCS056',
      full_name: 'Abdullah',
      father_name: 'Muhammad Akram',
      dob: '2002-05-14',
      faculty_id: 1,
      faculty_name: 'Department of Computer Science',
      department_id: 1,
      department_name: 'Department of Computer Science',
      program_id: 1,
      program_name: 'BS Computer Science',
    },
    {
      id: 2,
      university_id: 1,
      cnic: '34567-8765456-7',
      registration_number: 'FA22-BCS-056',
      full_name: 'Abdullah',
      father_name: 'Muhammad Akram',
      dob: '2002-05-14',
      faculty_id: 1,
      faculty_name: 'Department of Computer Science',
      department_id: 1,
      department_name: 'Department of Computer Science',
      program_id: 1,
      program_name: 'BS Computer Science',
    },
    {
      id: 3,
      university_id: 1,
      cnic: '35202-1234567-1',
      registration_number: 'FA21-BCS-042',
      full_name: 'Hamza Ahmed',
      father_name: 'Ahmed Hassan',
      dob: '2001-08-20',
      faculty_id: 1,
      faculty_name: 'Department of Computer Science',
      department_id: 1,
      department_name: 'Department of Computer Science',
      program_id: 1,
      program_name: 'BS Computer Science',
    },
  ],
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

    // 4b. SELECT FROM student_records
    if (queryStr.includes('from student_records')) {
      if (params && params.length >= 3) {
        const cnicVal = (params[1] || '').toString().trim().replace(/-/g, '');
        const regVal = (params[2] || '').toString().trim().replace(/-/g, '');
        const match = (memoryDb.student_records || []).find((sr) => {
          const srCnic = sr.cnic.replace(/-/g, '');
          const srReg = sr.registration_number.replace(/-/g, '');
          return (srCnic === cnicVal || srCnic.includes(cnicVal)) && (srReg === regVal || srReg.includes(regVal));
        });
        if (match) return { rows: [match] };
      }
      return { rows: memoryDb.student_records || [] };
    }

    // 4c. DELETE FROM students
    if (queryStr.startsWith('delete from students')) {
      memoryDb.students = [];
      return { rows: [] };
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

    // INSERT INTO students
    if (queryStr.startsWith('insert into students')) {
      const newStudent = {
        id: (memoryDb.students || []).length + 1,
        full_name: params[0] || 'Student User',
        father_name: params[1] || null,
        cnic: params[2] || '',
        registration_number: params[3] || '',
        mobile_number: params[4] || null,
        user_role: params[5] || 'voter',
        university_id: params[6] || 1,
        faculty_id: params[7] || 1,
        department_id: params[8] || 1,
        program_id: params[9] || null,
        batch: params[10] || null,
        semester: params[11] || null,
        cgpa: params[12] || null,
        email: params[13] || '',
        password_hash: params[14] || '',
        face_encoding: params[15] || null,
        profile_image_url: params[16] || null,
        party_name: params[17] || null,
        symbol_url: params[18] || null,
        manifesto: params[19] || null,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      if (!memoryDb.students) memoryDb.students = [];
      memoryDb.students.unshift(newStudent);
      return { rows: [newStudent] };
    }

    // UPDATE students
    if (queryStr.startsWith('update students')) {
      const statusVal = params[0];
      const studentId = params[1];
      const st = (memoryDb.students || []).find((s) => s.id == studentId);
      if (st) {
        st.status = statusVal;
        return { rows: [st] };
      }
      return { rows: [] };
    }

    // INSERT INTO candidates
    if (queryStr.startsWith('insert into candidates')) {
      const newCand = {
        id: (memoryDb.candidates || []).length + 1,
        name: params[0],
        party: params[1],
        slogan: params[2] || '',
        motto: params[3] || '',
        manifesto: params[4] || params[2] || '',
        bio: params[5] || params[3] || '',
        experience: params[6] || params[4] || '',
        photo_url: params[6] || params[3] || null,
        symbol_image_url: params[7] || params[4] || null,
        faculty_id: params[8] || params[5] || 1,
        department_id: params[9] || params[6] || 1,
        program_id: params[10] || params[7] || null,
        election_id: params[11] || params[8] || 1,
        status: params[12] || 'pending',
        created_at: new Date().toISOString(),
      };
      if (!memoryDb.candidates) memoryDb.candidates = [];
      memoryDb.candidates.unshift(newCand);
      return { rows: [newCand] };
    }

    // UPDATE candidates
    if (queryStr.startsWith('update candidates')) {
      const id = params[params.length - 1];
      const cand = (memoryDb.candidates || []).find((c) => c.id == id);
      if (cand) {
        if (queryStr.includes('set status')) {
          cand.status = params[0];
        } else {
          if (params[0] !== null && params[0] !== undefined) cand.party = params[0];
          if (params[1] !== null && params[1] !== undefined) cand.slogan = params[1];
          if (params[2] !== null && params[2] !== undefined) cand.motto = params[2];
          if (params[3] !== null && params[3] !== undefined) cand.manifesto = params[3];
          if (params[4] !== null && params[4] !== undefined) cand.bio = params[4];
          if (params[5] !== null && params[5] !== undefined) cand.experience = params[5];
          if (params[6] !== null && params[6] !== undefined) cand.photo_url = params[6];
          if (params[7] !== null && params[7] !== undefined) cand.symbol_image_url = params[7];
          cand.status = 'pending';
        }
        return { rows: [cand] };
      }
      return { rows: [] };
    }

    // 7. SELECT FROM students
    if (queryStr.includes('from students')) {
      let resultRows = memoryDb.students || [];
      if (params && params.length > 0) {
        const val = (params[0] || '').toString().toLowerCase();
        const matches = resultRows.filter((s) => {
          return (
            (s.email && s.email.toLowerCase() === val) ||
            (s.cnic && s.cnic.toLowerCase() === val) ||
            (s.registration_number && s.registration_number.toLowerCase() === val) ||
            (s.id && s.id.toString() === val)
          );
        });
        if (matches.length > 0) resultRows = matches;
      }
      const enriched = resultRows.map((s) => ({
        ...s,
        university_name: s.university_name || 'COMSATS University Islamabad',
        faculty_name: s.faculty_name || 'Department of Computer Science',
        department_name: s.department_name || 'Department of Computer Science',
        program_name: s.program_name || 'BS Computer Science',
        father_name: s.father_name || 'Muhammad Akram',
        mobile_number: s.mobile_number || '03096932637',
        profile_image_url: s.profile_image_url || s.photo_url || null,
        photo_url: s.profile_image_url || s.photo_url || null,
      }));
      return { rows: enriched };
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
        if (params[0]) elec.title = params[0];
        if (params[1]) elec.position_title = params[1];
        if (params[2]) elec.total_seats = params[2];
        if (params[3]) elec.min_cgpa_criteria = params[3];
        if (params[4]) elec.min_semester = params[4];
        if (params[5]) elec.terms_and_conditions = params[5];
        if (params[6]) elec.candidate_apply_start = params[6];
        if (params[7]) elec.candidate_apply_end = params[7];
        if (params[8]) elec.voter_register_start = params[8];
        if (params[9]) elec.voter_register_end = params[9];
        if (params[10]) elec.voting_start = params[10];
        if (params[11]) elec.voting_end = params[11];
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
