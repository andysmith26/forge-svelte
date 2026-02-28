-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('student', 'teacher', 'volunteer');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('structured', 'drop_in');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'active', 'ended', 'cancelled');

-- CreateEnum
CREATE TYPE "SignoutType" AS ENUM ('self', 'manual', 'auto', 'session_end');

-- CreateEnum
CREATE TYPE "HelpUrgency" AS ENUM ('blocked', 'question', 'check_work');

-- CreateEnum
CREATE TYPE "HelpStatus" AS ENUM ('pending', 'claimed', 'resolved', 'cancelled');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "settings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "display_code" VARCHAR(6) NOT NULL,
    "settings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "email" TEXT,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "pronouns" TEXT,
    "photo_url" TEXT,
    "grade_level" TEXT,
    "pin_hash" TEXT,
    "google_id" TEXT,
    "ask_me_about" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_memberships" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "name" TEXT,
    "session_type" "SessionType" NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "actual_start_at" TIMESTAMP(3),
    "actual_end_at" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_ins" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "signed_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signed_out_at" TIMESTAMP(3),
    "signed_in_by_id" TEXT NOT NULL,
    "signed_out_by_id" TEXT,
    "signout_type" "SignoutType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sign_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pin_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "person_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ninja_domains" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ninja_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ninja_assignments" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "ninja_domain_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ninja_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_categories" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ninja_domain_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_requests" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "category_id" TEXT,
    "description" TEXT NOT NULL,
    "what_i_tried" TEXT NOT NULL,
    "urgency" "HelpUrgency" NOT NULL,
    "status" "HelpStatus" NOT NULL DEFAULT 'pending',
    "claimed_by_id" TEXT,
    "claimed_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "realtime_notifications" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "realtime_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "classroom_id" TEXT,
    "session_id" TEXT,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_display_code_key" ON "classrooms"("display_code");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_school_id_slug_key" ON "classrooms"("school_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "people_email_key" ON "people"("email");

-- CreateIndex
CREATE UNIQUE INDEX "people_google_id_key" ON "people"("google_id");

-- CreateIndex
CREATE INDEX "classroom_memberships_person_id_is_active_idx" ON "classroom_memberships"("person_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_memberships_classroom_id_person_id_key" ON "classroom_memberships"("classroom_id", "person_id");

-- CreateIndex
CREATE INDEX "sessions_classroom_id_status_idx" ON "sessions"("classroom_id", "status");

-- CreateIndex
CREATE INDEX "sign_ins_session_id_person_id_idx" ON "sign_ins"("session_id", "person_id");

-- CreateIndex
CREATE INDEX "sign_ins_session_id_signed_out_at_idx" ON "sign_ins"("session_id", "signed_out_at");

-- CreateIndex
CREATE UNIQUE INDEX "pin_sessions_token_key" ON "pin_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_person_id_key" ON "users"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_session_token_key" ON "auth_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ninja_domains_classroom_id_name_key" ON "ninja_domains"("classroom_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ninja_assignments_person_id_ninja_domain_id_key" ON "ninja_assignments"("person_id", "ninja_domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "help_categories_classroom_id_name_key" ON "help_categories"("classroom_id", "name");

-- CreateIndex
CREATE INDEX "help_requests_classroom_id_status_created_at_idx" ON "help_requests"("classroom_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "realtime_notifications_channel_idx" ON "realtime_notifications"("channel");

-- CreateIndex
CREATE INDEX "realtime_notifications_created_at_idx" ON "realtime_notifications"("created_at");

-- CreateIndex
CREATE INDEX "domain_events_school_id_created_at_idx" ON "domain_events"("school_id", "created_at");

-- CreateIndex
CREATE INDEX "domain_events_classroom_id_created_at_idx" ON "domain_events"("classroom_id", "created_at");

-- CreateIndex
CREATE INDEX "domain_events_entity_type_entity_id_idx" ON "domain_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "domain_events_event_type_idx" ON "domain_events"("event_type");

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_memberships" ADD CONSTRAINT "classroom_memberships_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_memberships" ADD CONSTRAINT "classroom_memberships_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_ins" ADD CONSTRAINT "sign_ins_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_ins" ADD CONSTRAINT "sign_ins_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_ins" ADD CONSTRAINT "sign_ins_signed_in_by_id_fkey" FOREIGN KEY ("signed_in_by_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_ins" ADD CONSTRAINT "sign_ins_signed_out_by_id_fkey" FOREIGN KEY ("signed_out_by_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_sessions" ADD CONSTRAINT "pin_sessions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_sessions" ADD CONSTRAINT "pin_sessions_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ninja_domains" ADD CONSTRAINT "ninja_domains_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ninja_assignments" ADD CONSTRAINT "ninja_assignments_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ninja_assignments" ADD CONSTRAINT "ninja_assignments_ninja_domain_id_fkey" FOREIGN KEY ("ninja_domain_id") REFERENCES "ninja_domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ninja_assignments" ADD CONSTRAINT "ninja_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_categories" ADD CONSTRAINT "help_categories_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_categories" ADD CONSTRAINT "help_categories_ninja_domain_id_fkey" FOREIGN KEY ("ninja_domain_id") REFERENCES "ninja_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "help_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_requests" ADD CONSTRAINT "help_requests_claimed_by_id_fkey" FOREIGN KEY ("claimed_by_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
