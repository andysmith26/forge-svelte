-- AlterTable
ALTER TABLE "help_requests" ADD COLUMN     "hypothesis" TEXT,
ADD COLUMN     "topic" VARCHAR(100),
ALTER COLUMN "urgency" DROP NOT NULL;

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "smartboard_visible" BOOLEAN NOT NULL DEFAULT true;
