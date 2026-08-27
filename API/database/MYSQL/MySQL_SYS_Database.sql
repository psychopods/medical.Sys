DROP DATABASE IF EXISTS MySQL_SYS_Database;
CREATE DATABASE MySQL_SYS_Database;
USE MySQL_SYS_Database;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notification_reads`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `biometric_fingerprints`;
DROP TABLE IF EXISTS `children_profiles`;
DROP TABLE IF EXISTS `child_locations`;
DROP TABLE IF EXISTS `staff_sessions`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `staff_users`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `permission_categories`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `gallery_items`;
DROP TABLE IF EXISTS `gallery_categories`;
DROP TABLE IF EXISTS `reports_annual`;
DROP TABLE IF EXISTS `reports_quarterly`;
DROP TABLE IF EXISTS `reports_success_stories`;
DROP TABLE IF EXISTS `reports_impact_metrics`;
DROP TABLE IF EXISTS `volunteer_applications`;
DROP TABLE IF EXISTS `contact_submissions`;
DROP TABLE IF EXISTS `lookup_medications`;
DROP TABLE IF EXISTS `lookup_tests`;
DROP TABLE IF EXISTS `lookup_procedures`;
DROP TABLE IF EXISTS `lookup_education`;
DROP TABLE IF EXISTS `public_services`;
DROP TABLE IF EXISTS `clothing_provisions`;
DROP TABLE IF EXISTS `symptoms_recorded`;
DROP TABLE IF EXISTS `services_rendered`;
DROP TABLE IF EXISTS `laboratory_tests`;
DROP TABLE IF EXISTS `medications_given`;
DROP TABLE IF EXISTS `child_vitals`;
DROP TABLE IF EXISTS `medical_baselines`;
DROP TABLE IF EXISTS `procedure_reference`;
DROP TABLE IF EXISTS `test_reference`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- ROLES & PERMISSIONS TABLES
-- ============================================

CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permission_categories` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `category_id` INT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_perm_slug` (`slug`),
    CONSTRAINT `fk_mysql_perm_cat` FOREIGN KEY (`category_id`) REFERENCES `permission_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
    `role_id` VARCHAR(36) NOT NULL,
    `permission_id` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_mysql_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mysql_rp_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STAFF USERS TABLES
-- ============================================

CREATE TABLE `staff_users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role_id` VARCHAR(36) NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `security_status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_mysql_staff_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT,
    INDEX `idx_mysql_staff_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `staff_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `staff_user_id` VARCHAR(36) NOT NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `last_accessed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_sessions_staff` FOREIGN KEY (`staff_user_id`) REFERENCES `staff_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
    `id` CHAR(36) NOT NULL,
    `staff_user_id` CHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL UNIQUE,
    `requested_by_staff_id` CHAR(36) NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `used_at` TIMESTAMP NULL,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_reset_token_staff` FOREIGN KEY (`staff_user_id`) REFERENCES `staff_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reset_token_requester` FOREIGN KEY (`requested_by_staff_id`) REFERENCES `staff_users` (`id`) ON DELETE SET NULL,
    INDEX `idx_reset_token_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHILDREN PROFILES TABLES
-- ============================================

CREATE TABLE `child_locations` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `lat` DECIMAL(10, 8) NULL,
    `lng` DECIMAL(11, 8) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `children_profiles` (
    `id` CHAR(36) NOT NULL,
    `custom_serial_id` VARCHAR(20) NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `gender` ENUM('Male', 'Female') NOT NULL,
    `estimated_birth_year` INT NULL,
    `age_months_at_intake` INT NULL,
    `primary_location_id` CHAR(36) NOT NULL,
    `created_by_staff_id` CHAR(36) NOT NULL,
    `image1` MEDIUMTEXT NULL,
    `image2` MEDIUMTEXT NULL,
    `image3` MEDIUMTEXT NULL,
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_mysql_children_location` FOREIGN KEY (`primary_location_id`) REFERENCES `child_locations` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_mysql_children_staff` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff_users` (`id`) ON DELETE RESTRICT,
    INDEX `idx_mysql_child_name` (`full_name`),
    INDEX `idx_mysql_custom_serial` (`custom_serial_id`),
    INDEX `idx_mysql_child_location` (`primary_location_id`),
    INDEX `idx_mysql_child_last_modified` (`last_modified_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `biometric_fingerprints` (
    `id` CHAR(36) NOT NULL,
    `child_id` CHAR(36) NOT NULL,
    `finger_index` TINYINT NOT NULL CHECK (`finger_index` BETWEEN 1 AND 10),
    `template_data` MEDIUMTEXT NOT NULL,
    `quality_score` TINYINT NULL,
    `status` ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
    `version` INT NOT NULL DEFAULT 1,
    `image_data` MEDIUMTEXT NULL,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_fingerprints_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_child_finger` (`child_id`, `finger_index`),
    INDEX `idx_bio_last_modified` (`last_modified_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTIFICATIONS TABLES
-- ============================================

CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `target_type` VARCHAR(10) NOT NULL CHECK (`target_type` IN ('ALL', 'ROLE', 'USER')),
    `target_role_id` VARCHAR(36) NULL,
    `target_user_id` VARCHAR(36) NULL,
    `created_by_staff_id` VARCHAR(36) NULL,
    `expires_at` TIMESTAMP NULL,
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_notifications_role` FOREIGN KEY (`target_role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`target_user_id`) REFERENCES `staff_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_creator` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff_users` (`id`) ON DELETE SET NULL,
    INDEX `idx_notifications_last_modified` (`last_modified_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notification_reads` (
    `notification_id` CHAR(36) NOT NULL,
    `staff_user_id` CHAR(36) NOT NULL,
    `read_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`notification_id`, `staff_user_id`),
    CONSTRAINT `fk_reads_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reads_staff` FOREIGN KEY (`staff_user_id`) REFERENCES `staff_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GALLERY TABLES
-- ============================================

CREATE TABLE `gallery_categories` (
    `category_key` VARCHAR(50) NOT NULL UNIQUE,
    `category_name` VARCHAR(100) NOT NULL,
    `category_icon` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`category_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gallery_items` (
    `id` CHAR(36) NOT NULL,
    `media_type` VARCHAR(10) NOT NULL,
    `category_key` VARCHAR(50) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `thumbnail_url` VARCHAR(255) NULL,
    `video_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_gallery_cat` FOREIGN KEY (`category_key`) REFERENCES `gallery_categories` (`category_key`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REPORTS TABLES
-- ============================================

CREATE TABLE `reports_annual` (
    `id` CHAR(36) NOT NULL,
    `year` INT NOT NULL UNIQUE,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `file_size` VARCHAR(20) NOT NULL,
    `page_count` INT NOT NULL,
    `download_url` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports_quarterly` (
    `id` CHAR(36) NOT NULL,
    `quarter` VARCHAR(20) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `period` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `file_size` VARCHAR(20) NOT NULL,
    `download_url` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports_success_stories` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `impact` VARCHAR(150) NOT NULL,
    `date` VARCHAR(50) NOT NULL,
    `category` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports_impact_metrics` (
    `id` CHAR(36) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `q1_value` INT NOT NULL,
    `q2_value` INT NOT NULL,
    `q3_value` INT NOT NULL,
    `q4_value` INT NOT NULL,
    `color` VARCHAR(20) NOT NULL,
    `year` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PUBLIC TABLES
-- ============================================

CREATE TABLE `volunteer_applications` (
    `id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email_address` VARCHAR(150) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `volunteer_type` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contact_submissions` (
    `id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email_address` VARCHAR(150) NOT NULL,
    `message_subject` VARCHAR(150) NOT NULL,
    `message_content` TEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `public_services` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MEDICAL RECORDS TABLES (WITH is_dirty COLUMN)
-- ============================================

CREATE TABLE `medical_baselines` (
    `id` CHAR(36) NOT NULL,
    `child_id` CHAR(36) NOT NULL,
    `visit_date` DATE NOT NULL,
    `first_visit` TINYINT(1) NOT NULL DEFAULT 1,
    `recorded_by` CHAR(36) NULL,
    `recorded_by_name` VARCHAR(100) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `is_dirty` INT NOT NULL DEFAULT 0,
    `sync_status` VARCHAR(20) NOT NULL DEFAULT 'synced',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_baseline_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `child_vitals` (
    `id` CHAR(36) NOT NULL,
    `child_id` CHAR(36) NOT NULL,
    `weight` DECIMAL(5,2) NULL,
    `height` DECIMAL(5,2) NULL,
    `bmi` DECIMAL(4,2) NULL,
    `bmi_status` VARCHAR(50) NULL,
    `recorded_by` CHAR(36) NULL,
    `recorded_by_name` VARCHAR(100) NULL,
    `date` DATE NOT NULL,
    `version` INT NOT NULL DEFAULT 1,
    `is_dirty` INT NOT NULL DEFAULT 0,
    `sync_status` VARCHAR(20) NOT NULL DEFAULT 'synced',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_vitals_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `medications_given` (
    `id` CHAR(36) NOT NULL,
    `child_id` CHAR(36) NOT NULL,
    `ntds_meds` TEXT NULL,
    `antibiotics` TEXT NULL,
    `other_meds` TEXT NULL,
    `date_given` DATE NOT NULL,
    `recorded_by` CHAR(36) NULL,
    `recorded_by_name` VARCHAR(100) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `is_dirty` INT NOT NULL DEFAULT 0,
    `sync_status` VARCHAR(20) NOT NULL DEFAULT 'synced',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_meds_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `laboratory_tests` (
    `id` CHAR(36) NOT NULL,
    `child_id` CHAR(36) NOT NULL,
    `test_type` VARCHAR(100) NOT NULL,
    `result` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `recorded_by` CHAR(36) NULL,
    `recorded_by_name` VARCHAR(100) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `is_dirty` INT NOT NULL DEFAULT 0,
    `sync_status` VARCHAR(20) NOT NULL DEFAULT 'synced',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_tests_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `services_rendered` (
    `id` CHAR(36) NOT NULL,
    `child_id` CHAR(36) NOT NULL,
    `service_type` VARCHAR(20) NOT NULL,
    `services_list` TEXT NOT NULL,
    `date` DATE NOT NULL,
    `recorded_by` CHAR(36) NULL,
    `recorded_by_name` VARCHAR(100) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `is_dirty` INT NOT NULL DEFAULT 0,
    `sync_status` VARCHAR(20) NOT NULL DEFAULT 'synced',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_services_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `CHECK_service_type` CHECK (`service_type` IN ('medical', 'social', 'education', 'procedure'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `symptoms_recorded` (
    `id` CHAR(36) NOT NULL,
    `child_id` CHAR(36) NOT NULL,
    `symptoms` TEXT NULL,
    `visit_notes` TEXT NULL,
    `date` DATE NOT NULL,
    `recorded_by` CHAR(36) NULL,
    `recorded_by_name` VARCHAR(100) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `is_dirty` INT NOT NULL DEFAULT 0,
    `sync_status` VARCHAR(20) NOT NULL DEFAULT 'synced',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_symptoms_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `clothing_provisions` (
    `id` CHAR(36) NOT NULL,
    `child_id` CHAR(36) NOT NULL,
    `shoes` VARCHAR(100) NULL,
    `clothes` VARCHAR(100) NULL,
    `date` DATE NOT NULL,
    `recorded_by` CHAR(36) NULL,
    `recorded_by_name` VARCHAR(100) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `is_dirty` INT NOT NULL DEFAULT 0,
    `sync_status` VARCHAR(20) NOT NULL DEFAULT 'synced',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_clothing_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REFERENCE TABLES
-- ============================================

CREATE TABLE `test_reference` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    UNIQUE KEY unique_name_category (name, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `procedure_reference` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- LOOKUP TABLES
-- ============================================

CREATE TABLE `lookup_medications` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `category` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `lookup_tests` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `lookup_procedures` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `lookup_education` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA
-- ============================================

-- Seeds for Medications
INSERT INTO `lookup_medications` (`id`, `name`, `category`) VALUES
('e001878b-3e5f-11ed-b878-0242ac120002', 'Albendazole', 'ntdsMeds'),
('e00189d9-3e5f-11ed-b878-0242ac120002', 'Mebendazole', 'ntdsMeds'),
('e0018afc-3e5f-11ed-b878-0242ac120002', 'Praziquantel', 'ntdsMeds'),
('e0018bf0-3e5f-11ed-b878-0242ac120002', 'Ivermectin', 'ntdsMeds'),
('e0018cd6-3e5f-11ed-b878-0242ac120002', 'Levamisole', 'ntdsMeds'),
('e0018d9e-3e5f-11ed-b878-0242ac120002', 'Amoxicillin', 'antibiotics'),
('e0018e66-3e5f-11ed-b878-0242ac120002', 'Ampiclox', 'antibiotics'),
('e0018f2e-3e5f-11ed-b878-0242ac120002', 'Ciprofloxacillin', 'antibiotics'),
('e00190fa-3e5f-11ed-b878-0242ac120002', 'Co-trimoxazole tab', 'antibiotics'),
('e00191c2-3e5f-11ed-b878-0242ac120002', 'Erythromycin', 'antibiotics'),
('e001928a-3e5f-11ed-b878-0242ac120002', 'Doxycycline', 'antibiotics'),
('e0019352-3e5f-11ed-b878-0242ac120002', 'Paracetamol', 'otherMeds'),
('e001941a-3e5f-11ed-b878-0242ac120002', 'Cetirizine', 'otherMeds'),
('e00194e2-3e5f-11ed-b878-0242ac120002', 'Dicflofenac gel', 'otherMeds'),
('e00195aa-3e5f-11ed-b878-0242ac120002', 'Artemether', 'otherMeds'),
('e0019672-3e5f-11ed-b878-0242ac120002', 'Diclofenac tab', 'otherMeds'),
('e001973a-3e5f-11ed-b878-0242ac120002', 'Clotrimazole cream', 'otherMeds'),
('e0019802-3e5f-11ed-b878-0242ac120002', 'Griseofulvin tab', 'otherMeds'),
('e00198ca-3e5f-11ed-b878-0242ac120002', 'Ibuprofen tab', 'otherMeds'),
('e00199ba-3e5f-11ed-b878-0242ac120002', 'ALU tabs', 'otherMeds'),
('e0019a78-3e5f-11ed-b878-0242ac120002', 'Vitamin B complex', 'otherMeds'),
('e0019b36-3e5f-11ed-b878-0242ac120002', 'Skyderm cream', 'otherMeds'),
('e0019bfe-3e5f-11ed-b878-0242ac120002', 'Ferrous', 'otherMeds'),
('e0019cc6-3e5f-11ed-b878-0242ac120002', 'Piriton', 'otherMeds'),
('e0019d8e-3e5f-11ed-b878-0242ac120002', 'Omeprazole', 'otherMeds'),
('e0019e56-3e5f-11ed-b878-0242ac120002', 'Salbutamol', 'otherMeds'),
('e0019f1e-3e5f-11ed-b878-0242ac120002', 'Salimia liniment', 'otherMeds'),
('e0019fe6-3e5f-11ed-b878-0242ac120002', 'Cough mixture', 'otherMeds'),
('e001a0ae-3e5f-11ed-b878-0242ac120002', 'Prednisolone', 'otherMeds'),
('e001a180-3e5f-11ed-b878-0242ac120002', 'Dexan', 'otherMeds'),
('e001a248-3e5f-11ed-b878-0242ac120002', 'Dexaneomycin eye & ear drop', 'otherMeds'),
('e001a310-3e5f-11ed-b878-0242ac120002', 'Gentamycin eye & ear drop', 'otherMeds')
ON DUPLICATE KEY UPDATE category=VALUES(category);

-- Seeds for Tests
INSERT INTO `lookup_tests` (`id`, `name`) VALUES
('e001a3d8-3e5f-11ed-b878-0242ac120002', 'H. Pylori (-)'),
('e001a4a0-3e5f-11ed-b878-0242ac120002', 'H. Pylori (+)'),
('e001a568-3e5f-11ed-b878-0242ac120002', 'Malaria (-)'),
('e001a630-3e5f-11ed-b878-0242ac120002', 'Malaria (+)'),
('e001a6f8-3e5f-11ed-b878-0242ac120002', 'HIV (-)'),
('e001a7c0-3e5f-11ed-b878-0242ac120002', 'HIV (+)'),
('e001a888-3e5f-11ed-b878-0242ac120002', 'Urinalysis (normal)'),
('e001a95a-3e5f-11ed-b878-0242ac120002', 'Urinalysis (abnormal)'),
('e001aa22-3e5f-11ed-b878-0242ac120002', 'Hb (normal)'),
('e001aaea-3e5f-11ed-b878-0242ac120002', 'Hb (abnormal)'),
('e001abb2-3e5f-11ed-b878-0242ac120002', 'VDRL (-)'),
('e001ac7a-3e5f-11ed-b878-0242ac120002', 'VDRL (+)'),
('e001ad42-3e5f-11ed-b878-0242ac120002', 'Stool (normal)'),
('e001ae0a-3e5f-11ed-b878-0242ac120002', 'Stool (helminthes)'),
('e001aed2-3e5f-11ed-b878-0242ac120002', 'Stool (amoebiasis)'),
('e001af9a-3e5f-11ed-b878-0242ac120002', 'Widal test (normal)'),
('e001b06c-3e5f-11ed-b878-0242ac120002', 'Widal test (abnormal)')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seeds for Procedures
INSERT INTO `lookup_procedures` (`id`, `name`) VALUES
('e001b134-3e5f-11ed-b878-0242ac120002', 'Wound Dressing'),
('e001b1fc-3e5f-11ed-b878-0242ac120002', 'Suturing'),
('e001b2c4-3e5f-11ed-b878-0242ac120002', 'Incision and Drainage'),
('e001b38c-3e5f-11ed-b878-0242ac120002', 'Minor Surgery'),
('e001b45e-3e5f-11ed-b878-0242ac120002', 'Casting'),
('e001b526-3e5f-11ed-b878-0242ac120002', 'Splinting'),
('e001b5ee-3e5f-11ed-b878-0242ac120002', 'Catheterization'),
('e001b6b6-3e5f-11ed-b878-0242ac120002', 'IV Cannulation'),
('e001b77e-3e5f-11ed-b878-0242ac120002', 'Blood Draw'),
('e001b846-3e5f-11ed-b878-0242ac120002', 'Immunization'),
('e001b918-3e5f-11ed-b878-0242ac120002', 'First Aid')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seeds for Education
INSERT INTO `lookup_education` (`id`, `name`) VALUES
('e001b9e0-3e5f-11ed-b878-0242ac120002', 'Health Education'),
('e001baa8-3e5f-11ed-b878-0242ac120002', 'Hygiene Education'),
('e001bb7a-3e5f-11ed-b878-0242ac120002', 'Nutrition Education'),
('e001bc4c-3e5f-11ed-b878-0242ac120002', 'STI/HIV Awareness'),
('e001bd14-3e5f-11ed-b878-0242ac120002', 'Drug Abuse Prevention'),
('e001bddc-3e5f-11ed-b878-0242ac120002', 'Life Skills'),
('e001beae-3e5f-11ed-b878-0242ac120002', 'Water Safety'),
('e001bf76-3e5f-11ed-b878-0242ac120002', 'Sanitation Education');

-- Seed test_reference
INSERT IGNORE INTO test_reference (name, category) VALUES 
    ('Complete Blood Count', 'testType'),
    ('Malaria Test', 'testType'),
    ('HIV Test', 'testType'),
    ('Hepatitis B Test', 'testType'),
    ('Hepatitis C Test', 'testType'),
    ('Pregnancy Test', 'testType'),
    ('Urinalysis', 'testType'),
    ('Stool Analysis', 'testType'),
    ('Blood Glucose', 'testType'),
    ('HbA1c', 'testType'),
    ('VDRL Test', 'testType'),
    ('Haemoglobin Test', 'testType'),
    ('Blood Culture', 'testType'),
    ('Chest X-Ray', 'testType'),
    ('Ultrasound', 'testType'),
    ('ECG/EKG', 'testType'),
    ('Normal', 'testResult'),
    ('Abnormal', 'testResult'),
    ('Positive', 'testResult'),
    ('Negative', 'testResult'),
    ('Reactive', 'testResult'),
    ('Non-reactive', 'testResult'),
    ('Pending', 'testResult'),
    ('Inconclusive', 'testResult'),
    ('Detected', 'testResult'),
    ('Not Detected', 'testResult');

-- Seed procedure_reference
INSERT IGNORE INTO procedure_reference (name) VALUES 
    ('Wound Dressing'),
    ('Suture Removal'),
    ('Incision and Drainage'),
    ('Lumbar Puncture'),
    ('Bone Marrow Aspiration'),
    ('Endoscopy'),
    ('Biopsy'),
    ('Catheterization'),
    ('Dialysis'),
    ('Blood Transfusion'),
    ('Oxygen Therapy'),
    ('Intubation'),
    ('Surgical Wound Care'),
    ('Burn Care'),
    ('Skin Grafting'),
    ('Chest Tube Insertion'),
    ('Central Line Insertion'),
    ('Arterial Line Insertion'),
    ('Cricothyroidotomy'),
    ('Tracheostomy'),
    ('Fine Needle Aspiration'),
    ('Core Needle Biopsy'),
    ('Bone Marrow Biopsy'),
    ('Spinal Tap'),
    ('Thoracentesis'),
    ('Paracentesis'),
    ('Pericardiocentesis'),
    ('Joint Aspiration'),
    ('Nerve Block'),
    ('Epidural Injection');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables
SHOW TABLES;

-- Check is_dirty columns
SELECT TABLE_NAME, COLUMN_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'MySQL_SYS_Database' 
AND COLUMN_NAME = 'is_dirty'
ORDER BY TABLE_NAME;

-- Check CHECK constraint on services_rendered
SHOW CREATE TABLE services_rendered;

-- Count reference data
SELECT 'test_reference' as table_name, COUNT(*) as count FROM test_reference
UNION ALL
SELECT 'procedure_reference', COUNT(*) FROM procedure_reference
UNION ALL
SELECT 'lookup_medications', COUNT(*) FROM lookup_medications
UNION ALL
SELECT 'lookup_tests', COUNT(*) FROM lookup_tests
UNION ALL
SELECT 'lookup_procedures', COUNT(*) FROM lookup_procedures
UNION ALL
SELECT 'lookup_education', COUNT(*) FROM lookup_education;