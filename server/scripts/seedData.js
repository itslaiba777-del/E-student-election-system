const bcrypt = require('bcrypt');
const db = require('../config/db');

async function seed() {
  try {
    console.log('Seeding initial test data into Supabase PostgreSQL...');

    // Clear existing data in reverse order of foreign keys
    await db.query(`
      TRUNCATE login_audit_log, system_settings, otp_records, votes, voting_status, 
               candidates, elections, admin_permissions, admins, superadmins, 
               students, student_records, programs, departments, faculties, universities 
      RESTART IDENTITY CASCADE;
    `);

    // 1. System Settings
    await db.query(`
      INSERT INTO system_settings 
      (otp_expiry_minutes, session_timeout_minutes, face_attempt_limit, otp_attempt_limit, enforce_mfa, ip_restriction, support_email, emergency_phone)
      VALUES (5, 30, 1, 2, true, false, 'support@campusvote.edu', '+1 (555) 012-3456');
    `);
    console.log('✔ System Settings seeded.');

    // 2. Universities
    const uni1 = await db.query(`
      INSERT INTO universities (university_name, logo_url, registration_number_pattern)
      VALUES ('Central National University', 'https://via.placeholder.com/150', '^[0-9]{4}-[A-Z]{2,4}-[0-9]{3,5}$')
      RETURNING id;
    `);
    const uni1Id = uni1.rows[0].id;

    const uni2 = await db.query(`
      INSERT INTO universities (university_name, logo_url, registration_number_pattern)
      VALUES ('Metropolitan State University', 'https://via.placeholder.com/150', '^[A-Z]{3,4}/[0-9]{4}/[0-9]{3,5}$')
      RETURNING id;
    `);
    const uni2Id = uni2.rows[0].id;

    console.log('✔ Universities seeded.');

    // 3. Faculties
    const f1 = await db.query(`
      INSERT INTO faculties (faculty_name, university_id)
      VALUES ('Faculty of Engineering & Technology', $1::int) RETURNING id;
    `, [uni1Id]);
    const f1Id = f1.rows[0].id;

    const f2 = await db.query(`
      INSERT INTO faculties (faculty_name, university_id)
      VALUES ('Faculty of Arts & Humanities', $1::int) RETURNING id;
    `, [uni1Id]);
    const f2Id = f2.rows[0].id;

    const f3 = await db.query(`
      INSERT INTO faculties (faculty_name, university_id)
      VALUES ('School of Business & Economics', $1::int) RETURNING id;
    `, [uni2Id]);
    const f3Id = f3.rows[0].id;

    console.log('✔ Faculties seeded.');

    // 4. Departments
    const d1 = await db.query(`
      INSERT INTO departments (department_name, faculty_id)
      VALUES ('Department of Computer Science', $1::int) RETURNING id;
    `, [f1Id]);
    const d1Id = d1.rows[0].id;

    const d2 = await db.query(`
      INSERT INTO departments (department_name, faculty_id)
      VALUES ('Department of Electrical Engineering', $1::int) RETURNING id;
    `, [f1Id]);
    const d2Id = d2.rows[0].id;

    const d3 = await db.query(`
      INSERT INTO departments (department_name, faculty_id)
      VALUES ('Department of English Literature', $1::int) RETURNING id;
    `, [f2Id]);
    const d3Id = d3.rows[0].id;

    const d4 = await db.query(`
      INSERT INTO departments (department_name, faculty_id)
      VALUES ('Department of Finance & Accounting', $1::int) RETURNING id;
    `, [f3Id]);
    const d4Id = d4.rows[0].id;

    console.log('✔ Departments seeded.');

    // 5. Programs
    const p1 = await db.query(`
      INSERT INTO programs (program_name, department_id)
      VALUES ('BS Computer Science', $1::int) RETURNING id;
    `, [d1Id]);
    const p1Id = p1.rows[0].id;

    const p2 = await db.query(`
      INSERT INTO programs (program_name, department_id)
      VALUES ('BS Software Engineering', $1::int) RETURNING id;
    `, [d1Id]);

    const p3 = await db.query(`
      INSERT INTO programs (program_name, department_id)
      VALUES ('BBA Finance', $1::int) RETURNING id;
    `, [d4Id]);
    const p3Id = p3.rows[0].id;

    console.log('✔ Programs seeded.');

    // 6. Official Student Records (Simulated Registrar DB for registration validation)
    await db.query(`
      INSERT INTO student_records (university_id, cnic, registration_number, full_name, father_name, dob, department_id, program_id)
      VALUES 
      ($1::int, '61101-1234567-1', '2024-CS-101', 'Alexander Julian Sterling', 'James R. Sterling', '2002-05-14', $2::int, $3::int),
      ($1::int, '61101-1234567-2', '2024-CS-102', 'Jordan Taylor Smith', 'Robert Smith', '2001-11-20', $2::int, $3::int),
      ($1::int, '61101-1234567-3', '2024-EE-201', 'Samantha Lee Vance', 'Richard Vance', '2002-01-10', $4::int, NULL),
      ($5::int, '35202-9876543-1', 'MSU/2024/001', 'David Miller', 'George Miller', '2000-08-15', $6::int, $7::int),
      ($5::int, '35202-9876543-2', 'MSU/2024/002', 'Emily Watson', 'Thomas Watson', '2001-03-25', $6::int, $7::int);
    `, [uni1Id, d1Id, p1Id, d2Id, uni2Id, d4Id, p3Id]);

    console.log('✔ Official Student Records seeded.');

    // 7. SuperAdmin Account (superadmin@test.com / Test@123)
    const superadminPass = await bcrypt.hash('Test@123', 10);
    await db.query(`
      INSERT INTO superadmins (name, email, password_hash)
      VALUES ('System SuperAdmin', 'superadmin@test.com', $1);
    `, [superadminPass]);

    console.log('✔ SuperAdmin account seeded (superadmin@test.com / Test@123).');

    // 8. Admins (University, Faculty, Department) & Admin Permissions
    const adminPass = await bcrypt.hash('Admin@123', 10);

    // University Level Admin
    const adminUni = await db.query(`
      INSERT INTO admins (name, email, password_hash, level, university_id, status)
      VALUES ('Dr. Arthur Pendelton', 'uniadmin@test.com', $1, 'university', $2::int, 'active')
      RETURNING id;
    `, [adminPass, uni1Id]);
    await db.query(`
      INSERT INTO admin_permissions 
      (admin_id, can_view_candidates, can_approve_candidates, can_view_students, can_approve_students, can_view_results, can_submit_results, can_extend_voting_time)
      VALUES ($1::int, true, true, true, true, true, true, true);
    `, [adminUni.rows[0].id]);

    // Faculty Level Admin
    const adminFac = await db.query(`
      INSERT INTO admins (name, email, password_hash, level, university_id, faculty_id, status)
      VALUES ('Prof. Eleanor Vance', 'facultyadmin@test.com', $1, 'faculty', $2::int, $3::int, 'active')
      RETURNING id;
    `, [adminPass, uni1Id, f1Id]);
    await db.query(`
      INSERT INTO admin_permissions 
      (admin_id, can_view_candidates, can_approve_candidates, can_view_students, can_approve_students, can_view_results, can_submit_results, can_extend_voting_time)
      VALUES ($1::int, true, true, true, true, true, false, false);
    `, [adminFac.rows[0].id]);

    // Department Level Admin
    const adminDept = await db.query(`
      INSERT INTO admins (name, email, password_hash, level, university_id, faculty_id, department_id, status)
      VALUES ('Dr. Alan Turing', 'deptadmin@test.com', $1, 'department', $2::int, $3::int, $4::int, 'active')
      RETURNING id;
    `, [adminPass, uni1Id, f1Id, d1Id]);
    await db.query(`
      INSERT INTO admin_permissions 
      (admin_id, can_view_candidates, can_approve_candidates, can_view_students, can_approve_students, can_view_results, can_submit_results, can_extend_voting_time)
      VALUES ($1::int, true, true, true, true, true, false, false);
    `, [adminDept.rows[0].id]);

    console.log('✔ Admins & Permissions seeded (uniadmin@test.com, facultyadmin@test.com, deptadmin@test.com / Admin@123).');

    // 9. Pre-register 1 Active Approved Student for immediate voting testing
    const studentPass = await bcrypt.hash('Student@123', 10);
    const approvedStudent = await db.query(`
      INSERT INTO students 
      (cnic, registration_number, university_id, faculty_id, department_id, program_id, email, password_hash, status)
      VALUES ('61101-1234567-1', '2024-CS-101', $1::int, $2::int, $3::int, $4::int, 'alex@test.com', $5, 'active')
      RETURNING id;
    `, [uni1Id, f1Id, d1Id, p1Id, studentPass]);

    console.log('✔ Approved Student account seeded (alex@test.com / Student@123).');

    // 10. Elections & Candidates
    const now = new Date();
    const futureApplyEnd = new Date(now.getTime() - 24 * 3600 * 1000); // Ended yesterday
    const futureVotingStart = new Date(now.getTime() - 2 * 3600 * 1000); // Started 2h ago
    const futureVotingEnd = new Date(now.getTime() + 24 * 3600 * 1000); // Ends tomorrow

    const election = await db.query(`
      INSERT INTO elections 
      (title, university_id, scope, scope_reference_id, candidate_apply_start, candidate_apply_end, voting_start, voting_end, status)
      VALUES ('2026 CS Departmental Council Election', $1::int, 'department', $2::int, $3, $4, $5, $6, 'active')
      RETURNING id;
    `, [uni1Id, d1Id, new Date(now.getTime() - 7 * 24 * 3600 * 1000), futureApplyEnd, futureVotingStart, futureVotingEnd]);

    const electionId = election.rows[0].id;

    // Seed Candidates
    await db.query(`
      INSERT INTO candidates (name, party, manifesto, faculty_id, department_id, program_id, election_id, status)
      VALUES 
      ('Alex Rivera', 'Campus Innovation Party', 'Prioritizing lab upgrades and student research grants.', $1::int, $2::int, $3::int, $4::int, 'approved'),
      ('Jordan Smith', 'Student Welfare Alliance', 'Improving 24/7 library access and transparent funding.', $1::int, $2::int, $3::int, $4::int, 'approved');
    `, [f1Id, d1Id, p1Id, electionId]);

    console.log('✔ Active Election & Candidates seeded.');
    console.log('\n--- SEED COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
