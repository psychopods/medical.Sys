SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `role_permissions`;
DELETE FROM `staff_users`;
DELETE FROM `child_locations`;
DELETE FROM `permissions`;
DELETE FROM `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- A. Children Profiles Domain (CRUD)
INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('p-child-c', 'children:create', 'Authorizes registering a new child profile (POST)'),
('p-child-r', 'children:read',   'Authorizes viewing individual profiles, search results, and charts (GET)'),
('p-child-u', 'children:update', 'Authorizes modifying existing fields on a child record (PUT/PATCH)'),
('p-child-d', 'children:delete', 'Authorizes removing or archiving a child profile from active indexes (DELETE)');

-- B. Biometric Fingerprints Domain (CRUD)
INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('p-bio-c', 'biometrics:create', 'Authorizes scanning and capturing initial minutiae templates (POST)'),
('p-bio-r', 'biometrics:read',   'Authorizes retrieving template data or verifying existing prints (GET)'),
('p-bio-u', 'biometrics:update', 'Authorizes re-scanning, updating quality scores, or overriding status (PUT/PATCH)'),
('p-bio-d', 'biometrics:delete', 'Authorizes purging a biometric asset or fingerprint record from the system (DELETE)');

-- C. Clinical Outreach Locations Domain (CRUD)
INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('p-loc-c', 'locations:create', 'Authorizes provisioning a new outreach center or base terminal (POST)'),
('p-loc-r', 'locations:read',   'Authorizes viewing location lists and active settlement maps (GET)'),
('p-loc-u', 'locations:update', 'Authorizes changing descriptions or status configurations of local bases (PUT/PATCH)'),
('p-loc-d', 'locations:delete', 'Authorizes removing an outreach settlement hub from rotation options (DELETE)');

-- D. Staff & Security Administration Domain (CRUD)
INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('p-adm-c', 'admin:staff_create', 'Authorizes creating new staff user profiles and setting initial roles (POST)'),
('p-adm-r', 'admin:staff_read',   'Authorizes auditing staff registry logs, logs of active tokens, and profiles (GET)'),
('p-adm-u', 'admin:staff_update', 'Authorizes resetting staff passwords or upgrading dynamic roles (PUT/PATCH)'),
('p-adm-d', 'admin:staff_delete', 'Authorizes deactivating or removing an internal staff account from access (DELETE)');

INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('p-rbac-r', 'rbac:read', 'Read RBAC resources'),
('p-rbac-w', 'rbac:write', 'Write RBAC resources');


INSERT INTO `roles` (`id`, `name`, `description`, `version`) VALUES
('role-su-777', 'Super User', 'System Administrator with complete organizational access keys across all modules', 1),
('role-nu-888', 'Nurse', 'Field operator handling full patient intake lifecycles, tracking metrics, and biometric assets', 1);


-- A. Super User Mapping (Full System CRUD Control over EVERYTHING)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES 
('role-su-777', 'p-child-c'), 
('role-su-777', 'p-child-r'), 
('role-su-777', 'p-child-u'), 
('role-su-777', 'p-child-d'),
('role-su-777', 'p-bio-c'),   
('role-su-777', 'p-bio-r'),   
('role-su-777', 'p-bio-u'),   
('role-su-777', 'p-bio-d'),
('role-su-777', 'p-loc-c'),   
('role-su-777', 'p-loc-r'),   
('role-su-777', 'p-loc-u'),   
('role-su-777', 'p-loc-d'),
('role-su-777', 'p-adm-c'),   
('role-su-777', 'p-adm-r'),   
('role-su-777', 'p-adm-u'),   
('role-su-777', 'p-adm-d'),
('role-su-777', 'p-rbac-r'),
('role-su-777', 'p-rbac-w');

-- B. Nurse Mapping (Operational Field CRUD + Read-Only Location Reference)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES 
('role-nu-888', 'p-child-c'), 
('role-nu-888', 'p-child-r'), 
('role-nu-888', 'p-child-u'), 
('role-nu-888', 'p-bio-c'),   
('role-nu-888', 'p-bio-r'),   
('role-nu-888', 'p-bio-u'),   
('role-nu-888', 'p-bio-d'),   
('role-nu-888', 'p-loc-r');

INSERT INTO `staff_users` (`id`, `username`, `email`, `password_hash`, `role_id`, `version`) VALUES
('staff-admin-001', 'droidgrim', 'droidgrim@gmail.com', '$2b$10$H1f75Y.zyeXDYG4HouLL6uH8cJ4XKb4/3ItcC97ViedozwoNETjTu', 'role-su-777', 1);

INSERT INTO `child_locations` (`id`, `name`, `description`, `version`) VALUES
('loc-hub-001', 'Nyegezi Center', 'Outreach clinic base located at Nyegezi terminal point', 1),
('loc-hub-002', 'Kirumba Center', 'Street outreach clinic setup near Kirumba market area', 1);

