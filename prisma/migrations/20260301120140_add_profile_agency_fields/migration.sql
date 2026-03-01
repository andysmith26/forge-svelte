-- AlterTable
ALTER TABLE "people" ADD COLUMN     "currently_working_on" TEXT,
ADD COLUMN     "help_queue_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme_color" TEXT;
