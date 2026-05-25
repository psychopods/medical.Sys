CREATE DATABASE MySQL_SYS_Database;

USE MySQL_SYS_Database;

-- Disable foreign key checks temporarily to safely configure tables
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `biometric_fingerprints`;
DROP TABLE IF EXISTS `children_profiles`;
DROP TABLE IF EXISTS `staff_users`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Dynamic Roles Table
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Fine-Grained System Permissions Table
CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_perm_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Role-Permissions Many-to-Many Bridge Table
CREATE TABLE `role_permissions` (
    `role_id` VARCHAR(36) NOT NULL,
    `permission_id` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_mysql_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mysql_rp_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Staff Accounts Table
CREATE TABLE `staff_users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role_id` VARCHAR(36) NOT NULL,
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_mysql_staff_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT,
    INDEX `idx_mysql_staff_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Children Master Registry Table (Maps cleanly to your Kid IDs sheet)
CREATE TABLE `children_profiles` (
    `id` VARCHAR(36) NOT NULL,
    `custom_serial_id` VARCHAR(20) NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `gender` ENUM('Male', 'Female') NOT NULL,
    `estimated_birth_year` INT NULL,
    `created_by_staff_id` VARCHAR(36) NOT NULL,
    `version` INT NOT NULL DEFAULT 1,
    `last_modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_mysql_children_staff` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff_users` (`id`) ON DELETE RESTRICT,
    INDEX `idx_mysql_child_name` (`full_name`),
    INDEX `idx_mysql_custom_serial` (`custom_serial_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Biometric Fingerprint Templates Storage Table
CREATE TABLE biometric_fingerprints (
    id CHAR(36) NOT NULL,
    child_id CHAR(36) NOT NULL,
    finger_index TINYINT NOT NULL CHECK (finger_index BETWEEN 1 AND 10),
    template_data MEDIUMBLOB NOT NULL,
    quality_score TINYINT NULL,
    status ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
    version INT NOT NULL DEFAULT 1,
    last_modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_fingerprints_child FOREIGN KEY (child_id) REFERENCES children_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_child_finger (child_id, finger_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;