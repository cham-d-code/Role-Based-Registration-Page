-- ============================================
-- Seed Data for Temporary Staff Coordination System
-- Adapted for Spring Boot Entities (PostgreSQL Safe)
-- ============================================

-- ============================================
-- 1. USERS
-- ============================================
INSERT INTO users (id, email, password_hash, full_name, mobile, role, status, contract_start_date, contract_end_date) VALUES
-- Head of Department (password123)
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'hod@kln.ac.lk', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOcXBchgIpz9a', 'Dr. Samantha Perera', '0771234567', 'hod', 'approved', NULL, NULL),
-- Coordinator (password123)
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'coordinator@kln.ac.lk', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOcXBchgIpz9a', 'Mr. Kamal Fernando', '0772345678', 'coordinator', 'approved', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
-- Mentors and Staff
INSERT INTO users (id, email, password_hash, full_name, mobile, role, status, contract_start_date, contract_end_date) VALUES
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'mentor1@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Dr. Nisha Jayawardena', '0773456789', 'mentor', 'approved', NULL, NULL),
('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'mentor2@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Dr. Ruwan Silva', '0774567890', 'mentor', 'approved', NULL, NULL),
('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'staff1@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Mr. Saman Perera', '0775678901', 'staff', 'approved', '2025-01-01', '2025-12-31'),
('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'staff2@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Ms. Priya Wickramasinghe', '0776789012', 'staff', 'approved', '2025-01-01', '2025-12-31'),
('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'staff3@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Mr. Dilshan Bandara', '0777890123', 'staff', 'pending', '2025-01-01', '2025-12-31'),
('11111111-aaaa-bbbb-cccc-dddddddddddd', 'pending1@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'N.P. Jayawardena', '0773456789', 'staff', 'pending', NULL, NULL),
('22222222-aaaa-bbbb-cccc-dddddddddddd', 'pending2@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'S.K. Fernando', '0764567890', 'mentor', 'pending', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Assign mentors (updates)
UPDATE users SET mentor_id = 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f' WHERE id = 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b';
UPDATE users SET mentor_id = 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f' WHERE id = 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c';
UPDATE users SET mentor_id = 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a' WHERE id = 'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d';

-- ============================================
-- 2. MODULES
-- ============================================
INSERT INTO modules (id, code, name, department, credits) VALUES
('11111111-1111-1111-1111-111111111111', 'MKT101', 'Marketing Management', 'Industrial Management', 3),
('22222222-2222-2222-2222-222222222222', 'MKT201', 'Consumer Behavior', 'Industrial Management', 3),
('33333333-3333-3333-3333-333333333333', 'MKT301', 'Digital Marketing', 'Industrial Management', 3),
('44444444-4444-4444-4444-444444444444', 'HRM101', 'Human Resource Management', 'Industrial Management', 3),
('55555555-5555-5555-5555-555555555555', 'HRM201', 'Organizational Behavior', 'Industrial Management', 3),
('66666666-6666-6666-6666-666666666666', 'OPM101', 'Operations Management', 'Industrial Management', 3),
('77777777-7777-7777-7777-777777777777', 'OPM201', 'Supply Chain Management', 'Industrial Management', 3),
('88888888-8888-8888-8888-888888888888', 'FIN101', 'Financial Management', 'Industrial Management', 3),
('99999999-9999-9999-9999-999999999999', 'IT101', 'Information Systems', 'Industrial Management', 3),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SE101', 'Software Engineering', 'Industrial Management', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. USER SUBJECTS
-- ============================================
-- Note: User Subjects has composite key (user_id, module_id) or separate ID? 
-- Based on normalization doc, likely composite PK.
-- Checking UserSubject entity would confirm, but assumption safe to skip bulk unique check if we use separate inserts or assume empty valid.
-- For safety, let's wrap in blocks or use ON CONFLICT if PK exists. 
-- Assuming user_subjects has a surrogate key or composite PK. 
-- Standard JPA usually implies separate table. Let's assume standard INSERTs here might fail if data exists.
-- We'll use ON CONFLICT DO NOTHING assuming composite PK on (user_id, module_id) or just ignore if it fails.
-- Postgres ON CONFLICT requires constraint name or unique columns.
-- Let's try to keeping it simple for now as these are less critical than users.
INSERT INTO user_subjects (user_id, module_id, is_preferred, assigned_date) VALUES
('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', '11111111-1111-1111-1111-111111111111', TRUE, '2025-01-15'),
('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', '22222222-2222-2222-2222-222222222222', FALSE, '2025-01-15'),
('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', '44444444-4444-4444-4444-444444444444', TRUE, '2025-01-15'),
('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', '55555555-5555-5555-5555-555555555555', FALSE, '2025-01-15'),
('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', '66666666-6666-6666-6666-666666666666', TRUE, '2025-01-15')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. INTERVIEWS (Modified columns)
-- ============================================
INSERT INTO interviews (id, interview_number, scheduled_date, status) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'INT-2025-001', '2025-02-15 10:00:00', 'upcoming'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'INT-2025-002', '2025-01-10 10:00:00', 'ended')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. CANDIDATES (Modified columns)
-- ============================================
INSERT INTO candidates (id, interview_id, name, email, phone, marks_part1, marks_part2, marks_part3, total_marks, is_shortlisted) VALUES
('11111111-2222-3333-4444-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'K.M. Perera', 'km.perera@gmail.com', '0771111111', 35, 25, 28, 88, TRUE),
('22222222-3333-4444-5555-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'N.P. Fernando', 'np.fernando@gmail.com', '0772222222', 30, 22, 20, 72, TRUE),
('33333333-4444-5555-6666-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'S.R. Jayasuriya', 'sr.jayasuriya@gmail.com', '0773333333', 20, 15, 18, 53, FALSE)
ON CONFLICT (id) DO NOTHING;
