-- HopeMind — DDL de referência (PostgreSQL / Supabase)
-- Gerado a partir de backend/prisma/schema.prisma com:
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- O banco é criado pelo Prisma (npm run setup); este arquivo é documentação.

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('PATIENT', 'PSYCHOLOGIST', 'ADMIN');

-- CreateEnum
CREATE TYPE "QuestionnaireAudience" AS ENUM ('PATIENT', 'PSYCHOLOGIST');

-- CreateEnum
CREATE TYPE "SafetyLevel" AS ENUM ('NONE', 'WANTS_TALK', 'ELEVATED', 'IMMEDIATE');

-- CreateEnum
CREATE TYPE "SafetyAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" VARCHAR(50) NOT NULL,
    "user_type" "UserType" NOT NULL DEFAULT 'PATIENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cep" VARCHAR(9),
    "street" VARCHAR(255),
    "address_number" VARCHAR(20),
    "neighborhood" VARCHAR(120),
    "city" VARCHAR(120),
    "state" VARCHAR(2),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "main_complaint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "psychologists" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "crp" VARCHAR(50) NOT NULL,
    "contact_link" VARCHAR(500),
    "specialty" VARCHAR(255) NOT NULL,
    "therapeutic_approach" VARCHAR(255) NOT NULL,
    "biography" TEXT,
    "session_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "psychologists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triage_submissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "audience" "QuestionnaireAudience" NOT NULL,
    "questionnaire_version" VARCHAR(40) NOT NULL,
    "answers" JSONB NOT NULL,
    "safety_level" "SafetyLevel" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triage_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_alerts" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "level" "SafetyLevel" NOT NULL,
    "status" "SafetyAlertStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "safety_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_runs" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "algorithm_version" VARCHAR(40) NOT NULL,
    "questionnaire_version" VARCHAR(40) NOT NULL,
    "results" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "psychologist_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "entity_name" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100),
    "action" VARCHAR(50) NOT NULL,
    "payload" JSONB,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "patients_user_id_key" ON "patients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_user_id_key" ON "psychologists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_crp_key" ON "psychologists"("crp");

-- CreateIndex
CREATE INDEX "triage_submissions_user_id_created_at_idx" ON "triage_submissions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "safety_alerts_submission_id_key" ON "safety_alerts"("submission_id");

-- CreateIndex
CREATE INDEX "safety_alerts_status_idx" ON "safety_alerts"("status");

-- CreateIndex
CREATE INDEX "match_runs_patient_id_created_at_idx" ON "match_runs"("patient_id", "created_at");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "psychologists" ADD CONSTRAINT "psychologists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_submissions" ADD CONSTRAINT "triage_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_alerts" ADD CONSTRAINT "safety_alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_alerts" ADD CONSTRAINT "safety_alerts_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "triage_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_runs" ADD CONSTRAINT "match_runs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_runs" ADD CONSTRAINT "match_runs_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "triage_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

