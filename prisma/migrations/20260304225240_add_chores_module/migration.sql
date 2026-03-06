-- CreateEnum
CREATE TYPE "ChoreSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "ChoreRecurrence" AS ENUM ('one_time', 'daily', 'weekly');

-- CreateEnum
CREATE TYPE "ChoreVerificationType" AS ENUM ('self', 'peer', 'teacher');

-- CreateEnum
CREATE TYPE "ChoreInstanceStatus" AS ENUM ('available', 'claimed', 'completed', 'verified', 'redo_requested', 'archived');

-- CreateEnum
CREATE TYPE "ChoreVerificationDecision" AS ENUM ('approved', 'redo_requested');

-- CreateTable
CREATE TABLE "chores" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "size" "ChoreSize" NOT NULL DEFAULT 'medium',
    "estimated_minutes" INTEGER,
    "recurrence" "ChoreRecurrence" NOT NULL DEFAULT 'one_time',
    "verification_type" "ChoreVerificationType" NOT NULL DEFAULT 'self',
    "location" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_instances" (
    "id" TEXT NOT NULL,
    "chore_id" TEXT NOT NULL,
    "session_id" TEXT,
    "status" "ChoreInstanceStatus" NOT NULL DEFAULT 'available',
    "due_date" DATE,
    "claimed_by_id" TEXT,
    "claimed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completion_notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chore_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_verifications" (
    "id" TEXT NOT NULL,
    "chore_instance_id" TEXT NOT NULL,
    "verifier_id" TEXT NOT NULL,
    "decision" "ChoreVerificationDecision" NOT NULL,
    "feedback" VARCHAR(500),
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chore_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chores_school_id_is_active_idx" ON "chores"("school_id", "is_active");

-- CreateIndex
CREATE INDEX "chore_instances_chore_id_status_idx" ON "chore_instances"("chore_id", "status");

-- CreateIndex
CREATE INDEX "chore_instances_claimed_by_id_status_idx" ON "chore_instances"("claimed_by_id", "status");

-- CreateIndex
CREATE INDEX "chore_verifications_chore_instance_id_idx" ON "chore_verifications"("chore_instance_id");

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_claimed_by_id_fkey" FOREIGN KEY ("claimed_by_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_verifications" ADD CONSTRAINT "chore_verifications_chore_instance_id_fkey" FOREIGN KEY ("chore_instance_id") REFERENCES "chore_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_verifications" ADD CONSTRAINT "chore_verifications_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
