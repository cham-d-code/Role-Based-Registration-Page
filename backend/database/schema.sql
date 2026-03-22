-- ============================================
-- Temporary Staff Coordination System
-- PostgreSQL Database Schema
-- Version: 2.0 (Updated to match Spring Boot Entities)
-- ============================================

-- Create database (run separately as superuser)
-- CREATE DATABASE temp_staff_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

CREATE TYPE user_role AS ENUM ('hod', 'coordinator', 'mentor', 'staff');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
CREATE TYPE interview_status AS ENUM ('upcoming', 'ended');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================
-- 1. USERS & AUTHENTICATION
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

-- Add foreign key after table creation
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

-- ============================================
-- 2. MODULES & SUBJECTS
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

CREATE TABLE user_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT FALSE,
    assigned_date DATE,
    UNIQUE(user_id, module_id)
);

-- ============================================
-- 3. INTERVIEWS & CANDIDATES
-- ============================================

CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status interview_status DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interviews_status ON interviews(status);

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    candidate_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    cv_url VARCHAR(500),
    marks_part1 INT,
    marks_part2 INT,
    marks_part3 INT,
    total_marks INT,
    shortlisted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_candidates_interview ON candidates(interview_id);
CREATE INDEX idx_candidates_shortlisted ON candidates(shortlisted);

-- ============================================
-- 4. LEAVE MANAGEMENT
-- ============================================

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(255) NOT NULL,
    substitute VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leave_user ON leave_requests(user_id);
CREATE INDEX idx_leave_status ON leave_requests(status);

-- ============================================
-- 5. JOB DESCRIPTIONS
-- ============================================

CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Triggers for updated_at
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
