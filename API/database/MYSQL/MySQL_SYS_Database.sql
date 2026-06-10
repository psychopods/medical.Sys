DROP DATABASE MySQL_SYS_Database;
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
SET FOREIGN_KEY_CHECKS = 1;

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

CREATE TABLE `child_locations` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
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
    `template_data` MEDIUMTEXT NOT NULL, -- Fixed: Transformed to MEDIUMTEXT to accept text-safe Base64 values
    `quality_score` TINYINT NULL,
    `status` ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_fingerprints_child` FOREIGN KEY (`child_id`) REFERENCES `children_profiles` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_child_finger` (`child_id`, `finger_index`),
    INDEX `idx_bio_last_modified` (`last_modified_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL, -- 'SYSTEM', 'ANNOUNCEMENT', 'EVENT'
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


