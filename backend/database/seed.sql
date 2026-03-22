-- ============================================
-- Seed Data for Temporary Staff Coordination System
-- PostgreSQL Version
-- ============================================

-- ============================================
-- SAMPLE USERS WITH PRE-HASHED PASSWORDS
-- Password for all users: "Password123"
-- Hash generated using bcrypt with cost factor 12
-- ============================================

INSERT INTO users (id, email, password_hash, full_name, mobile, role, department, status) VALUES
-- Head of Department
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'hod@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Dr. Samantha Perera', '0771234567', 'hod', 'Industrial Management', 'approved'),

-- Coordinator
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'coordinator@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Mr. Kamal Fernando', '0772345678', 'coordinator', 'Industrial Management', 'approved'),

-- Mentors
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'mentor1@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Dr. Nisha Jayawardena', '0773456789', 'mentor', 'Marketing Management', 'approved'),
('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'mentor2@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Dr. Ruwan Silva', '0774567890', 'mentor', 'Operations Management', 'approved'),

-- Temporary Staff
('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'staff1@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Mr. Saman Perera', '0775678901', 'staff', 'Marketing Management', 'approved'),
('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'staff2@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Ms. Priya Wickramasinghe', '0776789012', 'staff', 'Human Resource Management', 'approved'),
('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'staff3@kln.ac.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4gUHpJhYJQ6K6S3.', 'Mr. Dilshan Bandara', '0777890123', 'staff', 'Operations Management', 'pending');

-- Assign mentors to staff
UPDATE users SET mentor_id = 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f' WHERE id = 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b';
UPDATE users SET mentor_id = 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f' WHERE id = 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c';
UPDATE users SET mentor_id = 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a' WHERE id = 'a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d';

-- Set contract dates for staff
UPDATE users SET 
    contract_start_date = '2025-01-01',
    contract_end_date = '2025-12-31'
WHERE role = 'staff';

-- ============================================
-- MODULES
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
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SE101', 'Software Engineering', 'Industrial Management', 3);

-- Assign subjects to staff
INSERT INTO user_subjects (user_id, module_id, is_preferred, assigned_date) VALUES
('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', '11111111-1111-1111-1111-111111111111', TRUE, '2025-01-15'),
('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', '22222222-2222-2222-2222-222222222222', FALSE, '2025-01-15'),
('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', '44444444-4444-4444-4444-444444444444', TRUE, '2025-01-15'),
('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', '55555555-5555-5555-5555-555555555555', FALSE, '2025-01-15'),
('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', '66666666-6666-6666-6666-666666666666', TRUE, '2025-01-15');

-- ============================================
-- SAMPLE INTERVIEWS
-- ============================================

INSERT INTO interviews (id, interview_number, scheduled_date, status, location, created_by, approval_status) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'INT-2025-001', '2025-02-15 09:00:00', 'upcoming', 'Conference Room A', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'approved'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'INT-2025-002', '2025-01-10 10:00:00', 'ended', 'Conference Room B', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'approved');

INSERT INTO marking_schemes (interview_id, part1_name, part1_max_marks, part2_name, part2_max_marks, part3_name, part3_max_marks, passing_percentage) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Subject Knowledge', 40, 'Communication Skills', 30, 'Teaching Demo', 30, 50),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Subject Knowledge', 40, 'Communication Skills', 30, 'Teaching Demo', 30, 50);

INSERT INTO candidates (interview_id, name, email, phone, marks_part1, marks_part2, marks_part3, is_shortlisted) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'K.M. Perera', 'km.perera@gmail.com', '0771111111', 35, 25, 28, TRUE),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'N.P. Fernando', 'np.fernando@gmail.com', '0772222222', 30, 22, 20, TRUE),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'S.R. Jayasuriya', 'sr.jayasuriya@gmail.com', '0773333333', 20, 15, 18, FALSE);

-- ============================================
-- SAMPLE SYSTEM NOTICES
-- ============================================

INSERT INTO system_notices (title, message, notice_type, target_roles, is_dismissible, created_by) VALUES
('System Maintenance', 'Scheduled maintenance on Feb 1, 2025, 2:00 AM - 4:00 AM.', 'info', NULL, TRUE, 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'),
('Contract Expiry Alert', '3 staff contracts expiring within 30 days.', 'urgent', '["hod", "coordinator"]', FALSE, 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e'),
('Monthly Report Due', 'Please submit monthly reports by Jan 31, 2025.', 'deadline', '["hod"]', TRUE, 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');

-- ============================================
-- SAMPLE RESEARCH OPPORTUNITY
-- ============================================

INSERT INTO research_opportunities (id, title, description, created_by, status, deadline) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'AI in Marketing Research', 'Research opportunity to study the impact of AI on marketing strategies.', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'open', '2025-03-01');

-- ============================================
SELECT 'Seed data inserted successfully!' AS message;
SELECT 'Total users: ' || COUNT(*) AS summary FROM users;
