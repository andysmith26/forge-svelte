-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('browseable', 'members_only');

-- CreateEnum
CREATE TYPE "HandoffItemType" AS ENUM ('blocker', 'question');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "ProjectVisibility" NOT NULL DEFAULT 'browseable',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_memberships" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsystems" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsystems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoffs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "session_id" TEXT,
    "what_i_did" TEXT NOT NULL,
    "whats_next" TEXT,
    "blockers" TEXT,
    "questions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoff_subsystems" (
    "handoff_id" TEXT NOT NULL,
    "subsystem_id" TEXT NOT NULL,

    CONSTRAINT "handoff_subsystems_pkey" PRIMARY KEY ("handoff_id","subsystem_id")
);

-- CreateTable
CREATE TABLE "handoff_read_statuses" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handoff_read_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoff_responses" (
    "id" TEXT NOT NULL,
    "handoff_id" TEXT NOT NULL,
    "item_type" "HandoffItemType" NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handoff_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoff_item_resolutions" (
    "id" TEXT NOT NULL,
    "handoff_id" TEXT NOT NULL,
    "item_type" "HandoffItemType" NOT NULL,
    "resolved_by_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handoff_item_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_school_id_is_archived_idx" ON "projects"("school_id", "is_archived");

-- CreateIndex
CREATE INDEX "project_memberships_person_id_is_active_idx" ON "project_memberships"("person_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "project_memberships_project_id_person_id_key" ON "project_memberships"("project_id", "person_id");

-- CreateIndex
CREATE UNIQUE INDEX "subsystems_project_id_name_key" ON "subsystems"("project_id", "name");

-- CreateIndex
CREATE INDEX "handoffs_project_id_created_at_idx" ON "handoffs"("project_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "handoff_read_statuses_project_id_person_id_key" ON "handoff_read_statuses"("project_id", "person_id");

-- CreateIndex
CREATE INDEX "handoff_responses_handoff_id_item_type_created_at_idx" ON "handoff_responses"("handoff_id", "item_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "handoff_item_resolutions_handoff_id_item_type_key" ON "handoff_item_resolutions"("handoff_id", "item_type");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_memberships" ADD CONSTRAINT "project_memberships_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subsystems" ADD CONSTRAINT "subsystems_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_subsystems" ADD CONSTRAINT "handoff_subsystems_handoff_id_fkey" FOREIGN KEY ("handoff_id") REFERENCES "handoffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_subsystems" ADD CONSTRAINT "handoff_subsystems_subsystem_id_fkey" FOREIGN KEY ("subsystem_id") REFERENCES "subsystems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_read_statuses" ADD CONSTRAINT "handoff_read_statuses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_read_statuses" ADD CONSTRAINT "handoff_read_statuses_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_responses" ADD CONSTRAINT "handoff_responses_handoff_id_fkey" FOREIGN KEY ("handoff_id") REFERENCES "handoffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_responses" ADD CONSTRAINT "handoff_responses_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_item_resolutions" ADD CONSTRAINT "handoff_item_resolutions_handoff_id_fkey" FOREIGN KEY ("handoff_id") REFERENCES "handoffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_item_resolutions" ADD CONSTRAINT "handoff_item_resolutions_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
