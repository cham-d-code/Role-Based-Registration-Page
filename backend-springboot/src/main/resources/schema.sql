-- ============================================
-- Temporary Staff Coordination System
-- PostgreSQL Schema — Idempotent (safe to re-run)
-- Statement separator: ;; (double semicolon)
-- Required because Spring ScriptUtils splits on ; which breaks
-- PostgreSQL dollar-quoted DO blocks.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";;

-- ============================================
-- CUSTOM TYPES (ENUMS) — idempotent
-- ============================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('hod', 'coordinator', 'mentor', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('upcoming', 'in_progress', 'ended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'casual', 'duty', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE salary_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE salary_report_status AS ENUM ('draft', 'sent_to_hod', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE task_category AS ENUM ('academic', 'administrative');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE research_status AS ENUM ('open', 'closed', 'filled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('applied', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE notice_type AS ENUM ('info', 'warning', 'urgent', 'deadline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('research_new', 'research_applied', 'research_accepted', 'research_rejected', 'info');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

-- Extend notification_type enum safely (idempotent)
DO $$ BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'mentor_assigned';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

-- Module preference request notifications
DO $$ BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'module_preferences_requested';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

DO $$ BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'interview_scheduled';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    role user_role NOT NULL,
    status user_status DEFAULT 'pending',
    mentor_id UUID,
    specialization TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    profile_image_url TEXT,
    preferences_requested BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    remember_token VARCHAR(255)
);;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);;
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);;

DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT fk_users_mentor
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);;
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);;

-- ============================================
-- 2. MODULES & SUBJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    credits INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(code);;
CREATE INDEX IF NOT EXISTS idx_modules_active ON modules(is_active);;

CREATE TABLE IF NOT EXISTS user_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT FALSE,
    assigned_date DATE,
    UNIQUE(user_id, module_id)
);;

CREATE INDEX IF NOT EXISTS idx_user_subjects_user ON user_subjects(user_id);;
CREATE INDEX IF NOT EXISTS idx_user_subjects_module ON user_subjects(module_id);;

CREATE TABLE IF NOT EXISTS module_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    preference_order INT DEFAULT 1,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_module_prefs_user ON module_preferences(user_id);;

-- ============================================
-- 3. INTERVIEWS & CANDIDATES
-- ============================================

CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_number VARCHAR(50) NOT NULL UNIQUE,
    scheduled_date DATE NOT NULL,
    status interview_status DEFAULT 'upcoming',
    location VARCHAR(255),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_status request_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);;
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(scheduled_date);;

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id VARCHAR(50),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    cv_url VARCHAR(500),
    marks_part1 DECIMAL(5,2) DEFAULT 0,
    marks_part2 DECIMAL(5,2) DEFAULT 0,
    marks_part3 DECIMAL(5,2) DEFAULT 0,
    total_marks DECIMAL(5,2) DEFAULT 0,
    is_shortlisted BOOLEAN DEFAULT FALSE,
    is_passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_candidates_interview ON candidates(interview_id);;
CREATE INDEX IF NOT EXISTS idx_candidates_shortlisted ON candidates(is_shortlisted);;

CREATE TABLE IF NOT EXISTS marking_schemes (
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
);;

-- ============================================
-- 4. LEAVE MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS leave_requests (
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
);;

CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id);;
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);;
CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date);;

-- ============================================
-- 5. ATTENDANCE & SALARY
-- ============================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status attendance_status DEFAULT 'present',
    check_in_time TIME,
    check_out_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, attendance_date)
);;

CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);;
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);;

CREATE TABLE IF NOT EXISTS salary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL,
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
);;

CREATE INDEX IF NOT EXISTS idx_salary_user ON salary_records(user_id);;
CREATE INDEX IF NOT EXISTS idx_salary_month ON salary_records(month_year);;

-- Coordinator-managed salary templates (per pay period)
CREATE TABLE IF NOT EXISTS salary_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_key VARCHAR(7) NOT NULL, -- YYYY-MM (period start month)
    period_start DATE NOT NULL,      -- usually 10th
    period_end DATE NOT NULL,        -- next month 10th
    day_rate DECIMAL(12,2) NOT NULL,
    extra_leave_day_deduction DECIMAL(12,2) NOT NULL,
    total_workable_days INT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_key)
);;

CREATE INDEX IF NOT EXISTS idx_salary_templates_period ON salary_templates(period_key);;

-- Generated salary reports per staff per pay period
CREATE TABLE IF NOT EXISTS salary_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES salary_templates(id) ON DELETE SET NULL,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_key VARCHAR(7) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_workable_days INT NOT NULL,
    present_days DECIMAL(6,2) NOT NULL DEFAULT 0,
    leave_days DECIMAL(6,2) NOT NULL DEFAULT 0,
    absent_days DECIMAL(6,2) NOT NULL DEFAULT 0,
    free_leave_days DECIMAL(6,2) NOT NULL DEFAULT 2,
    extra_leave_days DECIMAL(6,2) NOT NULL DEFAULT 0,
    day_rate DECIMAL(12,2) NOT NULL,
    gross_salary DECIMAL(12,2) NOT NULL,
    deduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    status salary_report_status DEFAULT 'draft',
    sent_to_hod_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, period_key)
);;

CREATE INDEX IF NOT EXISTS idx_salary_reports_period ON salary_reports(period_key);;
CREATE INDEX IF NOT EXISTS idx_salary_reports_staff ON salary_reports(staff_id);;
CREATE INDEX IF NOT EXISTS idx_salary_reports_status ON salary_reports(status);;

-- ============================================
-- 6. TASKS & JOB DESCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
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
);;

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);;

-- Weekly tasks created by staff (repeated every week by day)
CREATE TABLE IF NOT EXISTS weekly_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week day_of_week NOT NULL,
    time_from TIME NOT NULL,
    time_to TIME NOT NULL,
    title TEXT NOT NULL,
    status task_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_weekly_tasks_user ON weekly_tasks(user_id);;

CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

-- Payload storage for structured JD page (idempotent migration)
ALTER TABLE IF EXISTS job_descriptions ADD COLUMN IF NOT EXISTS content TEXT;;

CREATE INDEX IF NOT EXISTS idx_job_desc_user ON job_descriptions(user_id);;

CREATE TABLE IF NOT EXISTS job_description_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_description_id UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    task_type task_category DEFAULT 'academic'
);;

CREATE INDEX IF NOT EXISTS idx_job_tasks_desc ON job_description_tasks(job_description_id);;

-- ============================================
-- 7. RESEARCH OPPORTUNITIES
-- ============================================

CREATE TABLE IF NOT EXISTS research_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status research_status DEFAULT 'open',
    deadline DATE,
    max_applicants INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_research_status ON research_opportunities(status);;
CREATE INDEX IF NOT EXISTS idx_research_deadline ON research_opportunities(deadline);;

CREATE TABLE IF NOT EXISTS research_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES research_opportunities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status application_status DEFAULT 'applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(opportunity_id, user_id)
);;

CREATE INDEX IF NOT EXISTS idx_research_apps_opportunity ON research_applications(opportunity_id);;
CREATE INDEX IF NOT EXISTS idx_research_apps_user ON research_applications(user_id);;

-- ============================================
-- 8. SYSTEM NOTICES
-- ============================================

CREATE TABLE IF NOT EXISTS system_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notice_type notice_type DEFAULT 'info',
    target_roles JSONB,
    is_dismissible BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_notices_type ON system_notices(notice_type);;
CREATE INDEX IF NOT EXISTS idx_notices_expires ON system_notices(expires_at);;

CREATE TABLE IF NOT EXISTS notice_dismissals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notice_id UUID NOT NULL REFERENCES system_notices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notice_id, user_id)
);;

CREATE INDEX IF NOT EXISTS idx_dismissals_notice ON notice_dismissals(notice_id);;
CREATE INDEX IF NOT EXISTS idx_dismissals_user ON notice_dismissals(user_id);;

-- ============================================
-- 8b. USER NOTIFICATIONS (per-user inbox)
-- ============================================

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_opportunity_id UUID,
    related_application_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_user_notifications_recipient ON user_notifications(recipient_id);;
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(recipient_id, is_read);;
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(recipient_id, created_at);;

-- ============================================
-- 9. INTERVIEW LIVE SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    started_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);;

CREATE INDEX IF NOT EXISTS idx_sessions_interview ON interview_sessions(interview_id);;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON interview_sessions(is_active);;

CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);;

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);;
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);;

-- ============================================
-- 10. MARKING SCHEME
-- ============================================

CREATE TABLE IF NOT EXISTS marking_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(interview_id)
);;

CREATE TABLE IF NOT EXISTS marking_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id UUID NOT NULL REFERENCES marking_schemes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    max_marks INTEGER NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0
);;

CREATE INDEX IF NOT EXISTS idx_criteria_scheme ON marking_criteria(scheme_id);;

CREATE TABLE IF NOT EXISTS candidate_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    marker_id UUID NOT NULL REFERENCES users(id),
    criterion_id UUID NOT NULL REFERENCES marking_criteria(id) ON DELETE CASCADE,
    marks_given INTEGER NOT NULL,
    comments TEXT,
    marked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, candidate_id, marker_id, criterion_id)
);;

CREATE INDEX IF NOT EXISTS idx_candidate_marks_session ON candidate_marks(session_id);;
CREATE INDEX IF NOT EXISTS idx_candidate_marks_candidate ON candidate_marks(candidate_id);;

-- ============================================
-- SAFE COLUMN MIGRATIONS
-- ============================================
ALTER TABLE IF EXISTS candidates ADD COLUMN IF NOT EXISTS candidate_id VARCHAR(50);;
ALTER TABLE IF EXISTS session_participants ADD COLUMN IF NOT EXISTS left_session BOOLEAN NOT NULL DEFAULT FALSE;;
ALTER TABLE IF EXISTS research_opportunities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS specialization TEXT;;
-- Profile pictures are stored as base64 data URLs; VARCHAR(500) is too small.
ALTER TABLE IF EXISTS users ALTER COLUMN profile_image_url TYPE TEXT;;

-- Deleting a user must not fail when they started interview sessions (historical rows)
ALTER TABLE interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_started_by_fkey;;
ALTER TABLE interview_sessions ALTER COLUMN started_by DROP NOT NULL;;
ALTER TABLE interview_sessions
    ADD CONSTRAINT interview_sessions_started_by_fkey
    FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE SET NULL;;

-- ============================================
-- CURRICULUM MODULES (B.Sc. programme – coordinator notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS curriculum_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    academic_level INT NOT NULL,
    semester_label VARCHAR(20) NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    compulsory_optional VARCHAR(1) NOT NULL DEFAULT 'C',
    chief_tutor VARCHAR(255),
    program_kind VARCHAR(3) NOT NULL,
    mit_track VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE INDEX IF NOT EXISTS idx_curriculum_modules_level ON curriculum_modules(academic_level);;
CREATE INDEX IF NOT EXISTS idx_curriculum_modules_kind ON curriculum_modules(program_kind);;

-- ============================================
-- MODULE PREFERENCES (staff selections for curriculum modules)
-- ============================================

CREATE TABLE IF NOT EXISTS module_preference_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_staff_id UUID,
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);;

-- Safe migration for existing DBs
ALTER TABLE IF EXISTS module_preference_requests ADD COLUMN IF NOT EXISTS target_staff_id UUID;;

CREATE TABLE IF NOT EXISTS module_preference_request_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES module_preference_requests(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
    UNIQUE(request_id, module_id)
);;

CREATE INDEX IF NOT EXISTS idx_modpref_req_created_at ON module_preference_requests(created_at);;
CREATE INDEX IF NOT EXISTS idx_modpref_req_target_staff ON module_preference_requests(target_staff_id);;
CREATE INDEX IF NOT EXISTS idx_modpref_req_modules_req ON module_preference_request_modules(request_id);;

CREATE TABLE IF NOT EXISTS module_preference_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES module_preference_requests(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(request_id, staff_id)
);;

CREATE TABLE IF NOT EXISTS module_preference_submission_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES module_preference_submissions(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES curriculum_modules(id) ON DELETE CASCADE,
    UNIQUE(submission_id, module_id)
);;

CREATE INDEX IF NOT EXISTS idx_modpref_sub_staff ON module_preference_submissions(staff_id);;
CREATE INDEX IF NOT EXISTS idx_modpref_sub_req ON module_preference_submissions(request_id);;
