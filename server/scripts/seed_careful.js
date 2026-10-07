const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, '../data/persistent_db.json');
const BACKUP_PATH = path.join(__dirname, '../data/persistent_db.backup.json');

async function seedCarefully() {
  console.log('🔄 Starting careful database seeding...');

  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ persistent_db.json not found!');
    process.exit(1);
  }

  // 1. Create a backup
  const rawData = fs.readFileSync(DB_PATH, 'utf8');
  fs.writeFileSync(BACKUP_PATH, rawData, 'utf8');
  console.log('💾 Backup created successfully at:', BACKUP_PATH);

  const db = JSON.parse(rawData);

  // Standard Hashes
  const PASS_112233 = '$2b$10$.T8.el.H4I0YlLWX4drwyO1QBm2aiZks7O68s7xFeURbGtWjzOqS2';
  const PASS_ADMIN123 = '$2b$10$Ij5cz2mIaUT7fBly0NAqX.t4uuyqtcQwDSB0KNqz/tQ1MpojA2VKq';
  const PASS_SUPERADMIN123 = '$2b$10$pnM5vG1srZ1FokGv0dGdje2.MmdqroQQg6E4OAETlycj2k.9gGWkG';

  // 1. Universities
  db.universities = [
    {
      id: 1,
      university_name: 'COMSATS University Islamabad',
      logo_url: '/uploads/default-logo.png',
      registration_number_pattern: '^[A-Za-z0-9-]{5,20}$'
    }
  ];

  // 2. System Settings
  db.system_settings = [
    {
      id: 1,
      university_name: 'COMSATS University Islamabad',
      campus_name: 'Main Campus',
      logo_url: '/uploads/default-logo.png',
      registration_number_pattern: '^[A-Za-z0-9-]{5,20}$',
      support_email: 'support@comsats.edu.pk',
      emergency_phone: '+92 51 9247000',
      min_candidate_cgpa: 3.0
    }
  ];

  // 3. Faculties (Clean 1-4)
  db.faculties = [
    { id: 1, faculty_name: 'Department of Computer Science', university_id: 1 },
    { id: 2, faculty_name: 'Department of Software Engineering', university_id: 1 },
    { id: 3, faculty_name: 'Department of Electrical Engineering', university_id: 1 },
    { id: 4, faculty_name: 'Department of Business Administration', university_id: 1 }
  ];

  // 4. Departments (Clean 1-4)
  db.departments = [
    { id: 1, department_name: 'Department of Computer Science', department_code: 'CS', faculty_id: 1, university_id: 1 },
    { id: 2, department_name: 'Department of Software Engineering', department_code: 'SE', faculty_id: 2, university_id: 1 },
    { id: 3, department_name: 'Department of Electrical Engineering', department_code: 'EE', faculty_id: 3, university_id: 1 },
    { id: 4, department_name: 'Department of Business Administration', department_code: 'BA', faculty_id: 4, university_id: 1 }
  ];

  // 5. Programs (Clean 1-6)
  db.programs = [
    { id: 1, program_name: 'BS Computer Science', department_id: 1 },
    { id: 2, program_name: 'BS Artificial Intelligence', department_id: 1 },
    { id: 3, program_name: 'BS Cyber Security', department_id: 1 },
    { id: 4, program_name: 'BS Software Engineering', department_id: 2 },
    { id: 5, program_name: 'BS Electrical Engineering', department_id: 3 },
    { id: 6, program_name: 'BBA Business Administration', department_id: 4 }
  ];

  // 6. Superadmins (Preserve)
  if (!db.superadmins || db.superadmins.length === 0) {
    db.superadmins = [
      {
        id: 1,
        name: 'superadmin',
        email: 'superadmin@system.com',
        password_hash: PASS_SUPERADMIN123
      }
    ];
  } else {
    db.superadmins[0].password_hash = PASS_SUPERADMIN123;
  }

  // 7. Admins (Preserve existing Admin 1, add CS Admin 2)
  const existingAdmin1 = (db.admins || []).find(a => a.id === 1) || {
    id: 1,
    name: 'Department Admin',
    email: 'admin@university.edu',
    password_hash: PASS_ADMIN123,
    level: 'university',
    university_id: 1,
    status: 'active',
    can_approve_candidates: true,
    can_approve_students: true
  };
  existingAdmin1.password_hash = PASS_ADMIN123;
  existingAdmin1.can_approve_candidates = true;
  existingAdmin1.can_approve_students = true;

  const csAdmin = {
    id: 2,
    name: 'CS Faculty Admin',
    email: 'csadmin@university.edu',
    password_hash: PASS_ADMIN123,
    level: 'department',
    university_id: 1,
    faculty_id: 1,
    department_id: 1,
    status: 'active',
    can_approve_candidates: true,
    can_approve_students: true
  };

  db.admins = [existingAdmin1, csAdmin];

  // 8. Elections
  db.elections = [
    {
      id: 1,
      title: 'Fall 2026 General Election',
      position_title: 'President',
      total_seats: 20,
      university_id: 1,
      scope: 'university-wide',
      scope_type: 'all_departments',
      department_id: null,
      min_semester: 3,
      min_cgpa_criteria: 3.0,
      terms_and_conditions: 'Candidates must be active regular students with minimum 3.0 CGPA and clean disciplinary record.',
      candidate_apply_start: '2026-01-01T00:00:00.000Z',
      candidate_apply_end: '2026-12-31T23:59:59.000Z',
      voter_register_start: '2026-01-01T00:00:00.000Z',
      voter_register_end: '2026-12-31T23:59:59.000Z',
      voting_start: '2026-01-01T00:00:00.000Z',
      voting_end: '2026-12-31T23:59:59.000Z',
      status: 'active',
      created_at: '2026-10-04T10:00:00.000Z'
    },
    {
      id: 2,
      title: 'Fall 2026 Vice President Election',
      position_title: 'Vice President',
      total_seats: 1,
      university_id: 1,
      scope: 'university-wide',
      scope_type: 'all_departments',
      department_id: null,
      min_semester: 3,
      min_cgpa_criteria: 3.0,
      terms_and_conditions: 'Candidates must be active regular students with minimum 3.0 CGPA.',
      candidate_apply_start: '2026-01-01T00:00:00.000Z',
      candidate_apply_end: '2026-12-31T23:59:59.000Z',
      voter_register_start: '2026-01-01T00:00:00.000Z',
      voter_register_end: '2026-12-31T23:59:59.000Z',
      voting_start: '2026-01-01T00:00:00.000Z',
      voting_end: '2026-12-31T23:59:59.000Z',
      status: 'active',
      created_at: '2026-10-05T10:00:00.000Z'
    }
  ];

  // 9. Student Records (Official Registrar DB)
  db.student_records = [
    {
      id: 1,
      university_id: 1,
      cnic: '4567898765',
      registration_number: 'FA22BCS056',
      full_name: 'Abdullah',
      father_name: 'Muhammad Akram',
      dob: '2002-05-14',
      faculty_id: 3,
      faculty_name: 'Department of Electrical Engineering',
      department_id: 3,
      department_name: 'Department of Electrical Engineering',
      program_id: 5,
      program_name: 'BS Electrical Engineering'
    },
    {
      id: 2,
      university_id: 1,
      cnic: '34567-8765456-7',
      registration_number: 'FA22-BCS-056',
      full_name: 'Abdullah',
      father_name: 'Muhammad Akram',
      dob: '2002-05-14',
      faculty_id: 3,
      faculty_name: 'Department of Electrical Engineering',
      department_id: 3,
      department_name: 'Department of Electrical Engineering',
      program_id: 5,
      program_name: 'BS Electrical Engineering'
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
      program_name: 'BS Computer Science'
    },
    {
      id: 4,
      university_id: 1,
      cnic: '37405-9876543-2',
      registration_number: 'FA22-BSE-019',
      full_name: 'Ayesha Malik',
      father_name: 'Tariq Malik',
      dob: '2002-11-15',
      faculty_id: 2,
      faculty_name: 'Department of Software Engineering',
      department_id: 2,
      department_name: 'Department of Software Engineering',
      program_id: 4,
      program_name: 'BS Software Engineering'
    },
    {
      id: 5,
      university_id: 1,
      cnic: '35201-1122334-1',
      registration_number: 'FA22-BCS-101',
      full_name: 'Bilal Tariq',
      father_name: 'Tariq Mahmood',
      dob: '2002-03-10',
      faculty_id: 1,
      faculty_name: 'Department of Computer Science',
      department_id: 1,
      department_name: 'Department of Computer Science',
      program_id: 1,
      program_name: 'BS Computer Science'
    },
    {
      id: 6,
      university_id: 1,
      cnic: '35202-2233445-2',
      registration_number: 'FA22-BSE-088',
      full_name: 'Zainab Fatima',
      father_name: 'Muhammad Aslam',
      dob: '2003-01-22',
      faculty_id: 2,
      faculty_name: 'Department of Software Engineering',
      department_id: 2,
      department_name: 'Department of Software Engineering',
      program_id: 4,
      program_name: 'BS Software Engineering'
    },
    {
      id: 7,
      university_id: 1,
      cnic: '35201-3344556-3',
      registration_number: 'SP21-BEE-015',
      full_name: 'Usman Ghani',
      father_name: 'Abdul Ghani',
      dob: '2001-09-05',
      faculty_id: 3,
      faculty_name: 'Department of Electrical Engineering',
      department_id: 3,
      department_name: 'Department of Electrical Engineering',
      program_id: 5,
      program_name: 'BS Electrical Engineering'
    },
    {
      id: 8,
      university_id: 1,
      cnic: '35201-4455667-4',
      registration_number: 'FA23-BBA-033',
      full_name: 'Sara Khan',
      father_name: 'Javed Khan',
      dob: '2003-07-18',
      faculty_id: 4,
      faculty_name: 'Department of Business Administration',
      department_id: 4,
      department_name: 'Department of Business Administration',
      program_id: 6,
      program_name: 'BBA Business Administration'
    },
    {
      id: 9,
      university_id: 1,
      cnic: '35201-5566778-5',
      registration_number: 'FA22-BAI-012',
      full_name: 'Muhammad Daniyal',
      father_name: 'Rashid Ali',
      dob: '2002-12-01',
      faculty_id: 1,
      faculty_name: 'Department of Computer Science',
      department_id: 1,
      department_name: 'Department of Computer Science',
      program_id: 2,
      program_name: 'BS Artificial Intelligence'
    },
    {
      id: 10,
      university_id: 1,
      cnic: '35201-9988776-9',
      registration_number: 'FA23-BCS-099',
      full_name: 'Saad Rafique',
      father_name: 'Rafique Ahmed',
      dob: '2003-04-12',
      faculty_id: 1,
      faculty_name: 'Department of Computer Science',
      department_id: 1,
      department_name: 'Department of Computer Science',
      program_id: 1,
      program_name: 'BS Computer Science'
    },
    {
      id: 11,
      university_id: 1,
      cnic: '35201-8877665-8',
      registration_number: 'FA23-BSE-045',
      full_name: 'Hira Naveed',
      father_name: 'Naveed Akhtar',
      dob: '2003-09-28',
      faculty_id: 2,
      faculty_name: 'Department of Software Engineering',
      department_id: 2,
      department_name: 'Department of Software Engineering',
      program_id: 4,
      program_name: 'BS Software Engineering'
    }
  ];

  // 10. Candidates
  // Preserve Abdullah (id: 1) completely
  const existingAbdullahCand = (db.candidates || []).find(c => c.name === 'Abdullah' || c.id === 1) || {
    id: 1,
    name: 'Abdullah',
    party: 'Insaaf Students',
    slogan: 'Dedication & Progress',
    motto: 'Youth Leadership',
    bio: 'BS Electrical Engineering student candidate.',
    manifesto: 'Dedicated to student welfare and academic excellence.',
    experience: 'Student Society Leader',
    photo_url: '/uploads/photo-1791118066743-190751905.png',
    symbol_image_url: '/uploads/symbol-1791118066767-920278776.png',
    faculty_id: 3,
    department_id: 3,
    department_name: 'Department of Electrical Engineering',
    program_id: 5,
    election_id: 1,
    status: 'pending',
    created_at: '2026-10-04T12:47:46.000Z'
  };

  const hamzaCand = {
    id: 2,
    name: 'Hamza Ahmed',
    party: 'Tech Pioneers Society',
    slogan: 'Innovate & Empower',
    motto: 'Digital Campus for Everyone',
    bio: 'Senior BS Computer Science student with leadership experience in IEEE.',
    manifesto: 'Dedicated to technological innovation, open lab access, and modern career development for every student.',
    experience: 'President of Coding Guild 2024, IEEE Webmaster',
    photo_url: '/uploads/photo-1790877891696-350063210.png',
    symbol_image_url: '/uploads/symbol-1790877891703-507588362.png',
    faculty_id: 1,
    department_id: 1,
    department_name: 'Department of Computer Science',
    program_id: 1,
    election_id: 1,
    status: 'approved',
    created_at: '2026-10-04T12:00:00.000Z'
  };

  const ayeshaCand = {
    id: 3,
    name: 'Ayesha Malik',
    party: 'Student Unity Alliance',
    slogan: 'Your Voice, Our Mission',
    motto: 'Equal Opportunities for All',
    bio: 'Passionate Software Engineering student advocating student welfare.',
    manifesto: 'Fostering inclusivity, improved campus cafeteria standards, and enhanced academic tutoring support.',
    experience: 'Class Representative 2023-2025, Member of Debating Society',
    photo_url: '/uploads/photo-1791113533923-524449710.png',
    symbol_image_url: '/uploads/symbol-1791113533952-833565485.png',
    faculty_id: 2,
    department_id: 2,
    department_name: 'Department of Software Engineering',
    program_id: 4,
    election_id: 1,
    status: 'pending',
    created_at: '2026-10-04T14:30:00.000Z'
  };

  db.candidates = [existingAbdullahCand, hamzaCand, ayeshaCand];

  // 11. Students (Candidates + Registered Voters strictly separated)
  // Preserve Abdullah (id: 1) completely
  const existingAbdullahStudent = (db.students || []).find(s => s.registration_number === 'FA22BCS056' || s.id === 1) || {
    id: 1,
    full_name: 'Abdullah',
    father_name: 'Muhammad Akram',
    cnic: '4567898765',
    registration_number: 'FA22BCS056',
    mobile_number: '03096932637',
    user_role: 'candidate',
    university_id: 1,
    faculty_id: 3,
    faculty_name: 'Department of Electrical Engineering',
    department_id: 3,
    department_name: 'Department of Electrical Engineering',
    program_id: 5,
    program_name: 'BS Electrical Engineering',
    batch: '2022-2026',
    semester: '6th',
    cgpa: 3.3,
    email: 'abdullahakram.official.810@gmail.com',
    password_hash: PASS_112233,
    profile_image_url: '/uploads/profile_pics/profile_1791117829023_870.jpg',
    party_name: 'Insaaf Students',
    symbol_url: '/uploads/symbol-1791118066767-920278776.png',
    manifesto: 'Dedicated to student welfare and academic excellence.',
    status: 'active',
    created_at: '2026-10-04T12:47:09.000Z'
  };
  // Ensure Abdullah is strictly candidate
  existingAbdullahStudent.user_role = 'candidate';
  existingAbdullahStudent.password_hash = PASS_112233;

  const hamzaStudent = {
    id: 2,
    full_name: 'Hamza Ahmed',
    father_name: 'Ahmed Hassan',
    cnic: '35202-1234567-1',
    registration_number: 'FA21-BCS-042',
    mobile_number: '03009876543',
    user_role: 'candidate',
    university_id: 1,
    faculty_id: 1,
    faculty_name: 'Department of Computer Science',
    department_id: 1,
    department_name: 'Department of Computer Science',
    program_id: 1,
    program_name: 'BS Computer Science',
    batch: '2021-2025',
    semester: '7th',
    cgpa: 3.65,
    email: 'hamza.ahmed@student.edu',
    password_hash: PASS_112233,
    profile_image_url: '/uploads/profile_pics/profile_1790877767068_130.jpg',
    party_name: 'Tech Pioneers Society',
    symbol_url: '/uploads/symbol-1790877891703-507588362.png',
    manifesto: 'Dedicated to technological innovation, open lab access, and modern career development for every student.',
    status: 'active',
    created_at: '2026-10-04T12:00:00.000Z'
  };

  const ayeshaStudent = {
    id: 3,
    full_name: 'Ayesha Malik',
    father_name: 'Tariq Malik',
    cnic: '37405-9876543-2',
    registration_number: 'FA22-BSE-019',
    mobile_number: '03214567890',
    user_role: 'candidate',
    university_id: 1,
    faculty_id: 2,
    faculty_name: 'Department of Software Engineering',
    department_id: 2,
    department_name: 'Department of Software Engineering',
    program_id: 4,
    program_name: 'BS Software Engineering',
    batch: '2022-2026',
    semester: '5th',
    cgpa: 3.82,
    email: 'ayesha.malik@student.edu',
    password_hash: PASS_112233,
    profile_image_url: '/uploads/profile_pics/profile_1791113163923_609.jpg',
    party_name: 'Student Unity Alliance',
    symbol_url: '/uploads/symbol-1791113533952-833565485.png',
    manifesto: 'Fostering inclusivity, improved campus cafeteria standards, and enhanced academic tutoring support.',
    status: 'active',
    created_at: '2026-10-04T14:30:00.000Z'
  };

  // Pure Registered Voters (user_role = 'voter')
  const voters = [
    {
      id: 4,
      full_name: 'Bilal Tariq',
      father_name: 'Tariq Mahmood',
      cnic: '35201-1122334-1',
      registration_number: 'FA22-BCS-101',
      mobile_number: '03001234567',
      user_role: 'voter',
      university_id: 1,
      faculty_id: 1,
      faculty_name: 'Department of Computer Science',
      department_id: 1,
      department_name: 'Department of Computer Science',
      program_id: 1,
      program_name: 'BS Computer Science',
      batch: '2022-2026',
      semester: '5th',
      cgpa: 3.40,
      email: 'bilal.tariq@student.edu',
      password_hash: PASS_112233,
      profile_image_url: '/uploads/profile_pics/profile_1790644491487_548.jpg',
      status: 'active',
      has_voted: false,
      created_at: '2026-10-04T15:00:00.000Z'
    },
    {
      id: 5,
      full_name: 'Zainab Fatima',
      father_name: 'Muhammad Aslam',
      cnic: '35202-2233445-2',
      registration_number: 'FA22-BSE-088',
      mobile_number: '03012345678',
      user_role: 'voter',
      university_id: 1,
      faculty_id: 2,
      faculty_name: 'Department of Software Engineering',
      department_id: 2,
      department_name: 'Department of Software Engineering',
      program_id: 4,
      program_name: 'BS Software Engineering',
      batch: '2022-2026',
      semester: '5th',
      cgpa: 3.75,
      email: 'zainab.fatima@student.edu',
      password_hash: PASS_112233,
      profile_image_url: '/uploads/profile_pics/profile_1790511607183_928.jpg',
      status: 'active',
      has_voted: false,
      created_at: '2026-10-04T15:15:00.000Z'
    },
    {
      id: 6,
      full_name: 'Usman Ghani',
      father_name: 'Abdul Ghani',
      cnic: '35201-3344556-3',
      registration_number: 'SP21-BEE-015',
      mobile_number: '03023456789',
      user_role: 'voter',
      university_id: 1,
      faculty_id: 3,
      faculty_name: 'Department of Electrical Engineering',
      department_id: 3,
      department_name: 'Department of Electrical Engineering',
      program_id: 5,
      program_name: 'BS Electrical Engineering',
      batch: '2021-2025',
      semester: '7th',
      cgpa: 3.20,
      email: 'usman.ghani@student.edu',
      password_hash: PASS_112233,
      profile_image_url: '/uploads/profile_pics/profile_1790644491487_548.jpg',
      status: 'active',
      has_voted: false,
      created_at: '2026-10-04T15:30:00.000Z'
    },
    {
      id: 7,
      full_name: 'Sara Khan',
      father_name: 'Javed Khan',
      cnic: '35201-4455667-4',
      registration_number: 'FA23-BBA-033',
      mobile_number: '03034567890',
      user_role: 'voter',
      university_id: 1,
      faculty_id: 4,
      faculty_name: 'Department of Business Administration',
      department_id: 4,
      department_name: 'Department of Business Administration',
      program_id: 6,
      program_name: 'BBA Business Administration',
      batch: '2023-2027',
      semester: '3rd',
      cgpa: 3.55,
      email: 'sara.khan@student.edu',
      password_hash: PASS_112233,
      profile_image_url: '/uploads/profile_pics/profile_1790511607183_928.jpg',
      status: 'active',
      has_voted: false,
      created_at: '2026-10-04T15:45:00.000Z'
    },
    {
      id: 8,
      full_name: 'Muhammad Daniyal',
      father_name: 'Rashid Ali',
      cnic: '35201-5566778-5',
      registration_number: 'FA22-BAI-012',
      mobile_number: '03045678901',
      user_role: 'voter',
      university_id: 1,
      faculty_id: 1,
      faculty_name: 'Department of Computer Science',
      department_id: 1,
      department_name: 'Department of Computer Science',
      program_id: 2,
      program_name: 'BS Artificial Intelligence',
      batch: '2022-2026',
      semester: '5th',
      cgpa: 3.68,
      email: 'daniyal.rashid@student.edu',
      password_hash: PASS_112233,
      profile_image_url: '/uploads/profile_pics/profile_1790877767068_130.jpg',
      status: 'active',
      has_voted: false,
      created_at: '2026-10-04T16:00:00.000Z'
    }
  ];

  db.students = [existingAbdullahStudent, hamzaStudent, ayeshaStudent, ...voters];

  // 12. Votes (Empty to allow real voting)
  db.votes = [];
  db.election_schedule_logs = [];

  // Write updated database
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

  console.log('✔ Carefully seeded data saved to persistent_db.json!');
  console.log('--- Summary ---');
  console.log('Superadmins:', db.superadmins.length);
  console.log('Admins:', db.admins.length);
  console.log('Universities:', db.universities.length);
  console.log('Faculties:', db.faculties.length);
  console.log('Departments:', db.departments.length);
  console.log('Programs:', db.programs.length);
  console.log('Elections:', db.elections.length);
  console.log('Student Records (Registrar):', db.student_records.length);
  console.log('Total Students in Portal:', db.students.length);
  console.log(' - Candidates (user_role="candidate"):', db.students.filter(s => s.user_role === 'candidate').length);
  console.log(' - Voters (user_role="voter"):', db.students.filter(s => s.user_role === 'voter').length);
  console.log('Candidates in Elections:', db.candidates.length);
  console.log(' - Approved:', db.candidates.filter(c => c.status === 'approved').length);
  console.log(' - Pending:', db.candidates.filter(c => c.status === 'pending').length);
  console.log('Votes:', db.votes.length);
  console.log('----------------');
}

seedCarefully().catch(err => {
  console.error('❌ Error during careful seeding:', err);
  process.exit(1);
});
