-- HopeMind — DDL de referência (MariaDB / MySQL)
-- Gerado a partir de backend/prisma/schema.prisma com:
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- O banco de desenvolvimento é criado pelo Prisma (npm run setup); este arquivo é documentação.

CREATE DATABASE IF NOT EXISTS `hopemind` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hopemind`;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `cpf` VARCHAR(20) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `birth_date` DATE NOT NULL,
    `gender` VARCHAR(50) NOT NULL,
    `user_type` ENUM('PATIENT', 'PSYCHOLOGIST', 'ADMIN') NOT NULL DEFAULT 'PATIENT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `cep` VARCHAR(9) NULL,
    `street` VARCHAR(255) NULL,
    `address_number` VARCHAR(20) NULL,
    `neighborhood` VARCHAR(120) NULL,
    `city` VARCHAR(120) NULL,
    `state` VARCHAR(2) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_cpf_key`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `main_complaint` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `patients_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `psychologists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `crp` VARCHAR(50) NOT NULL,
    `contact_link` VARCHAR(500) NULL,
    `specialty` VARCHAR(255) NOT NULL,
    `therapeutic_approach` VARCHAR(255) NOT NULL,
    `biography` TEXT NULL,
    `session_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `psychologists_user_id_key`(`user_id`),
    UNIQUE INDEX `psychologists_crp_key`(`crp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `triage_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `audience` ENUM('PATIENT', 'PSYCHOLOGIST') NOT NULL,
    `questionnaire_version` VARCHAR(40) NOT NULL,
    `answers` JSON NOT NULL,
    `safety_level` ENUM('NONE', 'WANTS_TALK', 'ELEVATED', 'IMMEDIATE') NOT NULL DEFAULT 'NONE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `triage_submissions_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `safety_alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `submission_id` INTEGER NOT NULL,
    `level` ENUM('NONE', 'WANTS_TALK', 'ELEVATED', 'IMMEDIATE') NOT NULL,
    `status` ENUM('OPEN', 'ACKNOWLEDGED', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    UNIQUE INDEX `safety_alerts_submission_id_key`(`submission_id`),
    INDEX `safety_alerts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_runs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `submission_id` INTEGER NOT NULL,
    `algorithm_version` VARCHAR(40) NOT NULL,
    `questionnaire_version` VARCHAR(40) NOT NULL,
    `results` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `match_runs_patient_id_created_at_idx`(`patient_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `psychologist_id` INTEGER NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `appointment_date` DATETIME(3) NOT NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entity_name` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(100) NULL,
    `action` VARCHAR(50) NOT NULL,
    `payload` JSON NULL,
    `user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `psychologists` ADD CONSTRAINT `psychologists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `triage_submissions` ADD CONSTRAINT `triage_submissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `safety_alerts` ADD CONSTRAINT `safety_alerts_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `safety_alerts` ADD CONSTRAINT `safety_alerts_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `triage_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_runs` ADD CONSTRAINT `match_runs_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_runs` ADD CONSTRAINT `match_runs_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `triage_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_psychologist_id_fkey` FOREIGN KEY (`psychologist_id`) REFERENCES `psychologists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

