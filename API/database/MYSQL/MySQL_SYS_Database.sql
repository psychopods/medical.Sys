CREATE DATABASE MySQL_SYS_Database;
USE MySQL_SYS_Database;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `biometric_fingerprints`;
DROP TABLE IF EXISTS `children_profiles`;
DROP TABLE IF EXISTS `child_locations`;
DROP TABLE IF EXISTS `staff_sessions`;
DROP TABLE IF EXISTS `staff_users`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `permission_categories`;
DROP TABLE IF EXISTS `roles`;
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
    `gender` ENUM('Male', 'Female', 'Unknown') NOT NULL,
    `estimated_birth_year` INT NULL,
    `age_months_at_intake` INT NULL, -- Fixed: Restored to match registration payloads
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