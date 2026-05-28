SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `role_permissions`;
DELETE FROM `staff_users`;
DELETE FROM `child_locations`;
DELETE FROM `permissions`;
DELETE FROM `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- A. Children Profiles Domain (CRUD)
INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('11111111-1111-4111-8111-111111111111', 'children:create', 'Authorizes registering a new child profile (POST)'),
('11111111-1111-4111-8111-111111111112', 'children:read',   'Authorizes viewing individual profiles, search results, and charts (GET)'),
('11111111-1111-4111-8111-111111111113', 'children:update', 'Authorizes modifying existing fields on a child record (PUT/PATCH)'),
('11111111-1111-4111-8111-111111111114', 'children:delete', 'Authorizes removing or archiving a child profile from active indexes (DELETE)');

-- B. Biometric Fingerprints Domain (CRUD)
INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('11111111-1111-4111-8111-111111111121', 'biometrics:create', 'Authorizes scanning and capturing initial minutiae templates (POST)'),
('11111111-1111-4111-8111-111111111122', 'biometrics:read',   'Authorizes retrieving template data or verifying existing prints (GET)'),
('11111111-1111-4111-8111-111111111123', 'biometrics:update', 'Authorizes re-scanning, updating quality scores, or overriding status (PUT/PATCH)'),
('11111111-1111-4111-8111-111111111124', 'biometrics:delete', 'Authorizes purging a biometric asset or fingerprint record from the system (DELETE)');

-- C. Clinical Outreach Locations Domain (CRUD)
INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('11111111-1111-4111-8111-111111111131', 'locations:create', 'Authorizes provisioning a new outreach center or base terminal (POST)'),
('11111111-1111-4111-8111-111111111132', 'locations:read',   'Authorizes viewing location lists and active settlement maps (GET)'),
('11111111-1111-4111-8111-111111111133', 'locations:update', 'Authorizes changing descriptions or status configurations of local bases (PUT/PATCH)'),
('11111111-1111-4111-8111-111111111134', 'locations:delete', 'Authorizes removing an outreach settlement hub from rotation options (DELETE)');

-- D. Staff & Security Administration Domain (CRUD)
INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('11111111-1111-4111-8111-111111111141', 'admin:staff_create', 'Authorizes creating new staff user profiles and setting initial roles (POST)'),
('11111111-1111-4111-8111-111111111142', 'admin:staff_read',   'Authorizes auditing staff registry logs, logs of active tokens, and profiles (GET)'),
('11111111-1111-4111-8111-111111111143', 'admin:staff_update', 'Authorizes resetting staff passwords or upgrading dynamic roles (PUT/PATCH)'),
('11111111-1111-4111-8111-111111111144', 'admin:staff_delete', 'Authorizes deactivating or removing an internal staff account from access (DELETE)');

INSERT INTO `permissions` (`id`, `slug`, `description`) VALUES
('11111111-1111-4111-8111-111111111151', 'rbac:read', 'Read RBAC resources'),
('11111111-1111-4111-8111-111111111152', 'rbac:write', 'Write RBAC resources');


INSERT INTO `roles` (`id`, `name`, `description`, `version`) VALUES
('22222222-2222-4222-8222-222222222221', 'Super User', 'System Administrator with complete organizational access keys across all modules', 1),
('22222222-2222-4222-8222-222222222222', 'Nurse', 'Field operator handling full patient intake lifecycles, tracking metrics, and biometric assets', 1);


-- A. Super User Mapping (Full System CRUD Control over EVERYTHING)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES 
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111112'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111113'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111114'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111121'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111122'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111123'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111124'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111131'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111132'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111133'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111134'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111141'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111142'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111143'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111144'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111151'),
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111152');

-- B. Nurse Mapping (Operational Field CRUD + Read-Only Location Reference)
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES 
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111112'),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111113'),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111121'),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111122'),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111123'),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111124'),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111132');

INSERT INTO `staff_users` (`id`, `username`, `email`, `password_hash`, `role_id`, `version`) VALUES
('33333333-3333-4333-8333-333333333331', 'droidgrim', 'droidgrim@gmail.com', '$2b$10$H1f75Y.zyeXDYG4HouLL6uH8cJ4XKb4/3ItcC97ViedozwoNETjTu', '22222222-2222-4222-8222-222222222221', 1);

INSERT INTO `child_locations` (`id`, `name`, `description`, `version`) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Nyegezi Center', 'Outreach clinic base located at Nyegezi terminal point', 1),
('550e8400-e29b-41d4-a716-446655440002', 'Kirumba Center', 'Street outreach clinic setup near Kirumba market area', 1);
