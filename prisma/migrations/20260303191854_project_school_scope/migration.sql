-- AlterTable: rename classroom_id to school_id on projects
-- First drop the old FK constraint and index
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_classroom_id_fkey";
DROP INDEX IF EXISTS "projects_classroom_id_is_archived_idx";

-- Rename the column
ALTER TABLE "projects" RENAME COLUMN "classroom_id" TO "school_id";

-- Add the new FK constraint pointing to schools
ALTER TABLE "projects" ADD CONSTRAINT "projects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add new index
CREATE INDEX "projects_school_id_is_archived_idx" ON "projects"("school_id", "is_archived");
