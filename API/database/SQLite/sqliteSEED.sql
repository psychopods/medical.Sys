-- Disable foreign key constraints during baseline cache creation
PRAGMA foreign_keys = OFF;

-- Clear any old local metadata states safely
DELETE FROM notification_reads;
DELETE FROM notifications;
DELETE FROM local_auth_sessions;
DELETE FROM role_permissions;
DELETE FROM biometric_fingerprints;
DELETE FROM children_profiles;
DELETE FROM staff_users;
DELETE FROM child_locations;
DELETE FROM permissions;
DELETE FROM permission_categories;
DELETE FROM roles;
DELETE FROM volunteer_applications;
DELETE FROM reports_impact_metrics;
DELETE FROM reports_success_stories;
DELETE FROM reports_quarterly;
DELETE FROM reports_annual;
DELETE FROM gallery_items;
DELETE FROM gallery_categories;
DELETE FROM contact_submissions;

PRAGMA foreign_keys = ON;

-- Seed permission categories
INSERT INTO permission_categories (id, name, description) VALUES
(1, 'Patients CRUD', 'Manage child profiles and records'),
(2, 'Biometrics Enroll/Verify', 'Capture and verify fingerprint biometric templates'),
(3, 'Outreach Locations', 'Configure outreach settlement bases'),
(4, 'System administration', 'Access system auditing, logs, roles, permissions, and staff registration'),
(5, 'Notifications & Announcements', 'Manage notifications and global announcement updates'),
(6, 'Website Content Management', 'Manage gallery, reports, impact data, and volunteer applications');

-- A. Children Profiles Domain (CRUD)
INSERT INTO permissions (id, slug, description, category_id) VALUES
('11111111-1111-4111-8111-111111111111', 'children:create', 'Authorizes registering a new child profile (POST)', 1),
('11111111-1111-4111-8111-111111111112', 'children:read',   'Authorizes viewing individual profiles, search results, and charts (GET)', 1),
('11111111-1111-4111-8111-111111111113', 'children:update', 'Authorizes modifying existing fields on a child record (PUT/PATCH)', 1),
('11111111-1111-4111-8111-111111111114', 'children:delete', 'Authorizes removing or archiving a child profile from active indexes (DELETE)', 1);

-- B. Biometric Fingerprints Domain (CRUD)
INSERT INTO permissions (id, slug, description, category_id) VALUES
('11111111-1111-4111-8111-111111111121', 'biometrics:create', 'Authorizes scanning and capturing initial minutiae templates (POST)', 2),
('11111111-1111-4111-8111-111111111122', 'biometrics:read',   'Authorizes retrieving template data or verifying existing prints (GET)', 2),
('11111111-1111-4111-8111-111111111123', 'biometrics:update', 'Authorizes re-scanning, updating quality scores, or overriding status (PUT/PATCH)', 2),
('11111111-1111-4111-8111-111111111124', 'biometrics:delete', 'Authorizes purging a biometric asset or fingerprint record from the system (DELETE)', 2);

-- C. Clinical Outreach Locations Domain (CRUD)
INSERT INTO permissions (id, slug, description, category_id) VALUES
('11111111-1111-4111-8111-111111111131', 'locations:create', 'Authorizes provisioning a new outreach center or base terminal (POST)', 3),
('11111111-1111-4111-8111-111111111132', 'locations:read',   'Authorizes viewing location lists and active settlement maps (GET)', 3),
('11111111-1111-4111-8111-111111111133', 'locations:update', 'Authorizes changing descriptions or status configurations of local bases (PUT/PATCH)', 3),
('11111111-1111-4111-8111-111111111134', 'locations:delete', 'Authorizes removing an outreach settlement hub from rotation options (DELETE)', 3);

-- D. Staff & Security Administration Domain (CRUD)
INSERT INTO permissions (id, slug, description, category_id) VALUES
('11111111-1111-4111-8111-111111111141', 'admin:create', 'Authorizes creating new staff user profiles and setting initial roles (POST)', 4),
('11111111-1111-4111-8111-111111111142', 'admin:read',   'Authorizes auditing staff registry logs, logs of active tokens, and profiles (GET)', 4),
('11111111-1111-4111-8111-111111111143', 'admin:update', 'Authorizes resetting staff passwords or upgrading dynamic roles (PUT/PATCH)', 4),
('11111111-1111-4111-8111-111111111144', 'admin:delete', 'Authorizes deactivating or removing an internal staff account from access (DELETE)', 4),
('11111111-1111-4111-8111-111111111151', 'rbac:read',         'Read RBAC resources', 4),
('11111111-1111-4111-8111-111111111152', 'rbac:write',        'Write RBAC resources', 4),
('11111111-1111-4111-8111-111111111161', 'notifications:create', 'Authorizes creating new system or admin notifications (POST)', 5),
('11111111-1111-4111-8111-111111111162', 'notifications:read',   'Authorizes viewing notifications targeted at the user (GET)', 5),
('11111111-1111-4111-8111-111111111163', 'notifications:update', 'Authorizes marking notifications as read/dismissed (PUT)', 5),
('11111111-1111-4111-8111-111111111164', 'notifications:delete', 'Authorizes deleting notification records from the system (DELETE)', 5);

-- F. Website Content Management (Gallery, Reports, Support)
INSERT INTO permissions (id, slug, description, category_id) VALUES
('11111111-1111-4111-8111-111111111201', 'gallery:create', 'Create gallery items or categories', 6),
('11111111-1111-4111-8111-111111111202', 'gallery:read', 'Read gallery items or categories', 6),
('11111111-1111-4111-8111-111111111203', 'gallery:update', 'Update gallery items or categories', 6),
('11111111-1111-4111-8111-111111111204', 'gallery:delete', 'Delete gallery items or categories', 6),
('11111111-1111-4111-8111-111111111211', 'reports:create', 'Create annual, quarterly reports, success stories, and metrics', 6),
('11111111-1111-4111-8111-111111111212', 'reports:read', 'Read annual, quarterly reports, success stories, and metrics', 6),
('11111111-1111-4111-8111-111111111213', 'reports:update', 'Update annual, quarterly reports, success stories, and metrics', 6),
('11111111-1111-4111-8111-111111111214', 'reports:delete', 'Delete annual, quarterly reports, success stories, and metrics', 6),
('11111111-1111-4111-8111-111111111221', 'support:create', 'Create support options or config', 6),
('11111111-1111-4111-8111-111111111222', 'support:read', 'Read support / volunteer applications list', 6),
('11111111-1111-4111-8111-111111111223', 'support:update', 'Update support options or applications', 6),
('11111111-1111-4111-8111-111111111224', 'support:delete', 'Delete support options or applications', 6);

-- E. Seed System Roles (With Tracking Metadata Flags)
INSERT INTO roles (id, name, description, version, is_dirty, sync_status) VALUES
('22222222-2222-4222-8222-222222222221', 'Super User', 'System Administrator with complete organizational access keys across all modules', 1, 0, 'synced'),
('22222222-2222-4222-8222-222222222222', 'Nurse', 'Field operator handling full patient intake lifecycles, tracking metrics, and biometric assets', 1, 0, 'synced');

-- F. Intersect Roles & Permissions (role_permissions Bridge)
INSERT INTO role_permissions (role_id, permission_id, is_dirty) VALUES 
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111112', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111113', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111114', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111121', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111122', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111123', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111124', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111131', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111132', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111133', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111134', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111141', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111142', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111143', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111144', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111151', 0), ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111152', 0);

INSERT INTO role_permissions (role_id, permission_id, is_dirty) VALUES 
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 0), 
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111112', 0), 
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111113', 0), 
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111121', 0),   
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111122', 0),   
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111123', 0),   
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111124', 0),   
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111132', 0);

INSERT INTO role_permissions (role_id, permission_id, is_dirty) VALUES 
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111161', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111162', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111163', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111164', 0),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111162', 0),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111163', 0);

-- Map website management permissions to Super User in SQLite
INSERT INTO role_permissions (role_id, permission_id, is_dirty) VALUES
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111201', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111202', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111203', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111204', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111211', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111212', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111213', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111214', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111221', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111222', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111223', 0),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111224', 0);

-- Map website management reads to Nurse in SQLite
INSERT INTO role_permissions (role_id, permission_id, is_dirty) VALUES
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111202', 0),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111212', 0),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111222', 0);

-- G. Seed Staff Accounts (For initial development/offline testing validation)
INSERT INTO staff_users (id, username, email, password_hash, role_id, first_name, last_name, phone_number, version, is_dirty, sync_status) VALUES
('33333333-3333-4333-8333-333333333331', 'droidgrim', 'droidgrim@gmail.com', '$2b$10$H1f75Y.zyeXDYG4HouLL6uH8cJ4XKb4/3ItcC97ViedozwoNETjTu', '22222222-2222-4222-8222-222222222221', 'Paschal', 'Timoth', '+255000000000', 1, 0, 'synced');

-- H. Seed Initial Clinical Outreach Locations
INSERT INTO child_locations (id, name, description, version, is_dirty, sync_status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Nyegezi Center', 'Outreach clinic base located at Nyegezi terminal point', 1, 0, 'synced'),
('550e8400-e29b-41d4-a716-446655440002', 'Kirumba Center', 'Street outreach clinic setup near Kirumba market area', 1, 0, 'synced');

-- Seed Gallery Categories in SQLite
INSERT INTO gallery_categories (category_key, category_name, category_icon) VALUES
('outreach', 'Outreach', 'outreach'),
('medical', 'Medical', 'medical'),
('healthcare', 'Healthcare', 'healthcare'),
('campaign', 'Campaign', 'campaign'),
('team', 'Team', 'team'),
('impact', 'Impact', 'impact');

-- Seed Gallery Items in SQLite
INSERT INTO gallery_items (id, media_type, category_key, title, description, image_url, thumbnail_url, video_url) VALUES
('a0000000-0000-0000-0000-000000000001', 'image', 'outreach', 'Nyegezi Outreach Drive', 'Providing medical assistance and essential supplies during the Nyegezi outreach camp.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800', NULL, NULL),
('a0000000-0000-0000-0000-000000000002', 'video', 'campaign', 'Annual Healthcare Campaign Walkthrough', 'A video summary highlighting our achievements and healthcare campaigns throughout the year.', NULL, 'https://images.unsplash.com/photo-1516841273335-e39b37888115?w=800', 'https://www.youtube.com/embed/dQw4w9WgXcQ');

-- Seed Annual Reports in SQLite
INSERT INTO reports_annual (id, year, title, description, file_size, page_count, download_url) VALUES
('b0000000-0000-0000-0000-000000000001', 2025, 'Annual Impact Report 2025', 'Detailed layout of our community outreaches, financial status, and child care program metrics in 2025.', '2.4 MB', 24, 'https://example.com/reports/annual-2025.pdf');

-- Seed Quarterly Reports in SQLite
INSERT INTO reports_quarterly (id, quarter, title, period, description, file_size, download_url) VALUES
('c0000000-0000-0000-0000-000000000001', 'Q1 2026', 'Quarter 1 Progress Report 2026', 'January - March 2026', 'First quarter report detailing medical treatments dispensed and active children registration.', '1.1 MB', 'https://example.com/reports/progress-q1-2026.pdf');

-- Seed Success Stories in SQLite
INSERT INTO reports_success_stories (id, title, description, impact, date, category) VALUES
('d0000000-0000-0000-0000-000000000001', 'John''s Recovery Journey', 'John received critical medical treatment and nutrition plans at Nyegezi Center and has now returned to school.', 'Reintegrated into school and stable health status', 'May 12, 2026', 'healthcare');

-- Seed Impact Metrics in SQLite (for current year 2026)
INSERT INTO reports_impact_metrics (id, label, q1_value, q2_value, q3_value, q4_value, color, year) VALUES
('e0000000-0000-0000-0000-000000000001', 'Children Served', 340, 450, 600, 750, '#0066cc', 2026),
('e0000000-0000-0000-0000-000000000002', 'Medical Treatments', 210, 280, 410, 520, '#28a745', 2026);
