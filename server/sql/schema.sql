-- Full Schema for University Student E-Voting System (PostgreSQL)

DROP TABLE IF EXISTS login_audit_log CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS otp_records CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS voting_status CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS elections CASCADE;
DROP TABLE IF EXISTS admin_permissions CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS superadmins CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS student_records CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS universities CASCADE;

-- 1. Universities
CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    university_name VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    registration_number_pattern VARCHAR(255) DEFAULT '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Faculties / Schools
CREATE TABLE faculties (
    id SERIAL PRIMARY KEY,
    faculty_name VARCHAR(255) NOT NULL,
    university_id INT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_name, university_id)
);

-- 3. Departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL,
    faculty_id INT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department_name, faculty_id)
);

-- 4. Programs (Optional/Nullable)
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_name, department_id)
);

-- 5. Student Records (Simulated Official University Student Database)
CREATE TABLE student_records (
    id SERIAL PRIMARY KEY,
    university_id INT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    cnic VARCHAR(15) NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    dob DATE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    program_id INT REFERENCES programs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(university_id, cnic),
    UNIQUE(university_id, registration_number)
);

-- 6. Registered Students & Candidates
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    cnic VARCHAR(15) NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    mobile_number VARCHAR(50),
    user_role VARCHAR(50) DEFAULT 'voter' CHECK (user_role IN ('voter', 'candidate')),
    university_id INT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    faculty_id INT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    program_id INT REFERENCES programs(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    face_encoding TEXT, -- JSON descriptor vector for face recognition
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'locked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(university_id, cnic),
    UNIQUE(university_id, registration_number)
);

-- 7. SuperAdmins
CREATE TABLE superadmins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Admins
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('university', 'faculty', 'department')),
    university_id INT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    faculty_id INT REFERENCES faculties(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Admin Permissions (Granular level-based actions)
CREATE TABLE admin_permissions (
    id SERIAL PRIMARY KEY,
    admin_id INT UNIQUE NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    can_view_candidates BOOLEAN DEFAULT false,
    can_approve_candidates BOOLEAN DEFAULT false,
    can_view_students BOOLEAN DEFAULT false,
    can_approve_students BOOLEAN DEFAULT false,
    can_view_results BOOLEAN DEFAULT false,
    can_submit_results BOOLEAN DEFAULT false,
    can_extend_voting_time BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Elections
CREATE TABLE elections (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    university_id INT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL CHECK (scope IN ('university-wide', 'faculty', 'department')),
    scope_reference_id INT, -- NULL for university-wide, or faculty_id / department_id
    candidate_apply_start TIMESTAMP WITH TIME ZONE NOT NULL,
    candidate_apply_end TIMESTAMP WITH TIME ZONE NOT NULL,
    voting_start TIMESTAMP WITH TIME ZONE NOT NULL,
    voting_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'active', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Candidates
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(255),
    manifesto TEXT,
    photo_url VARCHAR(500),
    symbol_image_url VARCHAR(500),
    faculty_id INT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    program_id INT REFERENCES programs(id) ON DELETE SET NULL,
    election_id INT NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Voting Status (Per-student election status tracking)
CREATE TABLE voting_status (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    election_id INT NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    otp_attempts_used INT DEFAULT 0,
    otp_status VARCHAR(50) DEFAULT 'pending' CHECK (otp_status IN ('pending', 'verified', 'failed', 'locked')),
    face_status VARCHAR(50) DEFAULT 'pending' CHECK (face_status IN ('pending', 'verified', 'failed', 'locked')),
    has_voted BOOLEAN DEFAULT false,
    final_status VARCHAR(50) DEFAULT 'pending' CHECK (final_status IN ('pending', 'completed', 'locked')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, election_id)
);

-- 13. Votes (ANONYMOUS TABLE: No student_id or voter identification column)
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    election_id INT NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. OTP Records
CREATE TABLE otp_records (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. System Settings (Single-row system configuration parameters)
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    otp_expiry_minutes INT DEFAULT 10,
    session_timeout_minutes INT DEFAULT 30,
    face_attempt_limit INT DEFAULT 1,
    otp_attempt_limit INT DEFAULT 5,
    enforce_mfa BOOLEAN DEFAULT true,
    ip_restriction BOOLEAN DEFAULT false,
    support_email VARCHAR(255) DEFAULT 'support@campusvote.edu',
    emergency_phone VARCHAR(50) DEFAULT '+1 (555) 012-3456',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default single row in system_settings
INSERT INTO system_settings (otp_expiry_minutes, session_timeout_minutes, face_attempt_limit, otp_attempt_limit, enforce_mfa, ip_restriction, support_email, emergency_phone)
VALUES (10, 30, 1, 5, true, false, 'support@campusvote.edu', '+1 (555) 012-3456');

-- 16. Login Audit Log (Root & Portal Access Attempt Monitoring)
CREATE TABLE login_audit_log (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(50) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    ip_address VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal lookup performance
CREATE INDEX idx_students_reg ON students(registration_number);
CREATE INDEX idx_students_cnic ON students(cnic);
CREATE INDEX idx_elections_uni ON elections(university_id);
CREATE INDEX idx_votes_election ON votes(election_id);
CREATE INDEX idx_votes_candidate ON votes(candidate_id);
CREATE INDEX idx_login_audit_timestamp ON login_audit_log(timestamp);
