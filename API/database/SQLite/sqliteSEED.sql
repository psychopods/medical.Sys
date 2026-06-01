-- Disable foreign key constraints during baseline cache creation
PRAGMA foreign_keys = OFF;

-- Clear any old local metadata states safely
DELETE FROM role_permissions;
DELETE FROM child_locations;
DELETE FROM permissions;
DELETE FROM permission_categories;
DELETE FROM roles;
DELETE FROM staff_users;

PRAGMA foreign_keys = ON;

-- Seed permission categories
INSERT INTO permission_categories (id, name, description) VALUES
(1, 'Patients CRUD', 'Manage child profiles and records'),
(2, 'Biometrics Enroll/Verify', 'Capture and verify fingerprint biometric templates'),
(3, 'Outreach Locations', 'Configure outreach settlement bases'),
(4, 'System administration', 'Access system auditing, logs, roles, permissions, and staff registration');

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
('11111111-1111-4111-8111-111111111152', 'rbac:write',        'Write RBAC resources', 4);

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

-- G. Seed Staff Accounts (For initial development/offline testing validation)
INSERT INTO staff_users (id, username, email, password_hash, role_id, first_name, last_name, phone_number, version, is_dirty, sync_status) VALUES
('33333333-3333-4333-8333-333333333331', 'droidgrim', 'droidgrim@gmail.com', '$2b$10$H1f75Y.zyeXDYG4HouLL6uH8cJ4XKb4/3ItcC97ViedozwoNETjTu', '22222222-2222-4222-8222-222222222221', 'System', 'Admin', '+255000000000', 1, 0, 'synced');

-- H. Seed Initial Clinical Outreach Locations
INSERT INTO child_locations (id, name, description, version, is_dirty, sync_status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Nyegezi Center', 'Outreach clinic base located at Nyegezi terminal point', 1, 0, 'synced'),
('550e8400-e29b-41d4-a716-446655440002', 'Kirumba Center', 'Street outreach clinic setup near Kirumba market area', 1, 0, 'synced');
