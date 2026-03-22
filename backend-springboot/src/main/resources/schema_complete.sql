-- ============================================
-- Temporary Staff Coordination System
-- PostgreSQL Database Schema (Complete - 18 Tables)
-- Normalized to 1NF, 2NF, and 3NF
-- ============================================

-- Drop tables if they exist to allow clean recreation
DROP TABLE IF EXISTS notice_dismissals CASCADE;
DROP TABLE IF EXISTS system_notices CASCADE;
DROP TABLE IF EXISTS research_applications CASCADE;
DROP TABLE IF EXISTS research_opportunities CASCADE;
DROP TABLE IF EXISTS job_description_tasks CASCADE;
DROP TABLE IF EXISTS job_descriptions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS salary_records CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS marking_schemes CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS module_preferences CASCADE;
DROP TABLE IF EXISTS user_subjects CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS interview_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS salary_status CASCADE;
DROP TYPE IF EXISTS task_category CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS day_of_week CASCADE;
DROP TYPE IF EXISTS research_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS notice_type CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

CREATE TYPE user_role AS ENUM ('hod', 'coordinator', 'mentor', 'staff');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
CREATE TYPE interview_status AS ENUM ('upcoming', 'in_progress', 'ended', 'cancelled');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'casual', 'duty', 'other');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave');
CREATE TYPE salary_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
CREATE TYPE task_category AS ENUM ('academic', 'administrative');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
CREATE TYPE research_status AS ENUM ('open', 'closed', 'filled');
CREATE TYPE application_status AS ENUM ('applied', 'accepted', 'rejected');
CREATE TYPE notice_type AS ENUM ('info', 'warning', 'urgent', 'deadline');

-- ============================================
-- 1. USERS & AUTHENTICATION (2 tables)
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    role user_role NOT NULL,
    department VARCHAR(255),
    status user_status DEFAULT 'pending',
    mentor_id UUID,
    contract_start_date DATE,
    contract_end_date DATE,
    profile_image_url VARCHAR(500),
    preferences_requested BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    remember_token VARCHAR(255)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Add self-referencing foreign key after table creation
ALTER TABLE users
ADD CONSTRAINT fk_users_mentor 
FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);

-- ============================================
-- 2. MODULES & SUBJECTS (3 tables)
-- ============================================

CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    credits INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modules_code ON modules(code);
CREATE INDEX idx_modules_active ON modules(is_active);

CREATE TABLE user_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT FALSE,
    assigned_date DATE,
    UNIQUE(user_id, module_id)
);

CREATE INDEX idx_user_subjects_user ON user_subjects(user_id);
CREATE INDEX idx_user_subjects_module ON user_subjects(module_id);

CREATE TABLE module_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    preference_order INT DEFAULT 1,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_module_prefs_user ON module_preferences(user_id);

-- ============================================
-- 3. INTERVIEWS & CANDIDATES (3 tables)
-- ============================================

CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_number VARCHAR(50) NOT NULL UNIQUE,
    scheduled_date TIMESTAMP NOT NULL,
    status interview_status DEFAULT 'upcoming',
    location VARCHAR(255),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_status request_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_date ON interviews(scheduled_date);

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cv_url VARCHAR(500),
    marks_part1 DECIMAL(5,2) DEFAULT 0,
    marks_part2 DECIMAL(5,2) DEFAULT 0,
    marks_part3 DECIMAL(5,2) DEFAULT 0,
    total_marks DECIMAL(5,2) GENERATED ALWAYS AS (marks_part1 + marks_part2 + marks_part3) STORED,
    is_shortlisted BOOLEAN DEFAULT FALSE,
    is_passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_candidates_interview ON candidates(interview_id);
CREATE INDEX idx_candidates_shortlisted ON candidates(is_shortlisted);

CREATE TABLE marking_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
    part1_name VARCHAR(100) DEFAULT 'Part 1',
    part1_max_marks DECIMAL(5,2) DEFAULT 100,
    part2_name VARCHAR(100) DEFAULT 'Part 2',
    part2_max_marks DECIMAL(5,2) DEFAULT 100,
    part3_name VARCHAR(100) DEFAULT 'Part 3',
    part3_max_marks DECIMAL(5,2) DEFAULT 100,
    passing_percentage DECIMAL(5,2) DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. LEAVE MANAGEMENT (1 table)
-- ============================================

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    substitute_id UUID REFERENCES users(id) ON DELETE SET NULL,
    leave_type leave_type DEFAULT 'casual',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status request_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leave_user ON leave_requests(user_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);

-- ============================================
-- 5. ATTENDANCE & SALARY (2 tables)
-- ============================================

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status attendance_status DEFAULT 'present',
    check_in_time TIME,
    check_out_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, attendance_date)
);

CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

CREATE TABLE salary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL,  -- Format: YYYY-MM
    total_days INT NOT NULL,
    present_days INT NOT NULL,
    absent_days INT NOT NULL,
    attendance_rate DECIMAL(5,2),
    base_salary DECIMAL(12,2),
    deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2),
    status salary_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month_year)
);

CREATE INDEX idx_salary_user ON salary_records(user_id);
CREATE INDEX idx_salary_month ON salary_records(month_year);

-- ============================================
-- 6. TASKS & JOB DESCRIPTIONS (3 tables)
-- ============================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    category task_category DEFAULT 'academic',
    day_of_week day_of_week,
    time_from TIME,
    time_to TIME,
    status task_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);

CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_desc_user ON job_descriptions(user_id);

CREATE TABLE job_description_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    task_type task_category DEFAULT 'academic'
);

CREATE INDEX idx_job_tasks_desc ON job_description_tasks(job_description_id);

-- ============================================
-- 7. RESEARCH OPPORTUNITIES (2 tables)
-- ============================================

CREATE TABLE research_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status research_status DEFAULT 'open',
    deadline DATE,
    max_applicants INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_research_status ON research_opportunities(status);
CREATE INDEX idx_research_deadline ON research_opportunities(deadline);

CREATE TABLE research_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES research_opportunities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status application_status DEFAULT 'applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(opportunity_id, user_id)
);

CREATE INDEX idx_research_apps_opportunity ON research_applications(opportunity_id);
CREATE INDEX idx_research_apps_user ON research_applications(user_id);

-- ============================================
-- 8. SYSTEM NOTICES (2 tables)
-- ============================================

CREATE TABLE system_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notice_type notice_type DEFAULT 'info',
    target_roles JSONB,  -- e.g., ["hod", "coordinator"] or null for all
    is_dismissible BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notices_type ON system_notices(notice_type);
CREATE INDEX idx_notices_expires ON system_notices(expires_at);

CREATE TABLE notice_dismissals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notice_id UUID NOT NULL REFERENCES system_notices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notice_id, user_id)
);

CREATE INDEX idx_dismissals_notice ON notice_dismissals(notice_id);
CREATE INDEX idx_dismissals_user ON notice_dismissals(user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCHEMA CREATION COMPLETE
-- ============================================
-- Total Tables: 18
-- Normalization: 1NF, 2NF, 3NF compliant
-- ============================================
