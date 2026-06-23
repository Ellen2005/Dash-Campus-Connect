-- Platform sync: stories, lost & found, profile fields, event banner, approval status

-- CreateEnum
CREATE TYPE "LostFoundType" AS ENUM ('LOST', 'FOUND');

-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tourCompletedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_schoolId_studentId_key" ON "User"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS "User_studentId_idx" ON "User"("studentId");

-- AlterTable Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "bannerImage" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Migrate banner URLs stored in qrCheckIn (legacy hack)
UPDATE "Event"
SET "bannerImage" = "qrCheckIn"
WHERE "bannerImage" IS NULL
  AND "qrCheckIn" IS NOT NULL
  AND "qrCheckIn" LIKE 'http%';

-- CreateTable Story
CREATE TABLE IF NOT EXISTS "Story" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "caption" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Story_authorId_idx" ON "Story"("authorId");
CREATE INDEX IF NOT EXISTS "Story_expiresAt_idx" ON "Story"("expiresAt");

ALTER TABLE "Story" DROP CONSTRAINT IF EXISTS "Story_authorId_fkey";
ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable LostFoundItem
CREATE TABLE IF NOT EXISTS "LostFoundItem" (
    "id" TEXT NOT NULL,
    "type" "LostFoundType" NOT NULL DEFAULT 'LOST',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "photoUrl" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "posterId" TEXT NOT NULL,
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LostFoundItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LostFoundItem_posterId_idx" ON "LostFoundItem"("posterId");
CREATE INDEX IF NOT EXISTS "LostFoundItem_schoolId_idx" ON "LostFoundItem"("schoolId");
CREATE INDEX IF NOT EXISTS "LostFoundItem_resolved_idx" ON "LostFoundItem"("resolved");
CREATE INDEX IF NOT EXISTS "LostFoundItem_createdAt_idx" ON "LostFoundItem"("createdAt");

ALTER TABLE "LostFoundItem" DROP CONSTRAINT IF EXISTS "LostFoundItem_posterId_fkey";
ALTER TABLE "LostFoundItem" ADD CONSTRAINT "LostFoundItem_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification user FK (if table exists without FK)
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CommunityPost author (required for new posts)
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "authorId" TEXT;
UPDATE "CommunityPost" SET "authorId" = (SELECT "id" FROM "User" LIMIT 1) WHERE "authorId" IS NULL;
ALTER TABLE "CommunityPost" ALTER COLUMN "authorId" SET NOT NULL;
ALTER TABLE "CommunityPost" DROP CONSTRAINT IF EXISTS "CommunityPost_authorId_fkey";
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");
