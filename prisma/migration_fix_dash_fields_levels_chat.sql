-- Dash Platform - Incremental Migration Fix (Fields/Levels/Chat Gaps)
-- IMPORTANT: This script assumes pgcrypto/plpgsql support is NOT available in your SQL editor.
-- It therefore applies *only* plain ALTER TABLE statements using IF NOT EXISTS.
--
-- Fixed fields/columns:
--   - AdminChatGroup.schoolId
--   - AdminChatMessage.senderName, AdminChatMessage.senderRole
--   - CommunityPost.authorId
--   - TicketMessage.senderId

BEGIN;

ALTER TABLE "AdminChatGroup" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

ALTER TABLE "AdminChatMessage" ADD COLUMN IF NOT EXISTS "senderName" TEXT;
ALTER TABLE "AdminChatMessage" ADD COLUMN IF NOT EXISTS "senderRole" TEXT;

ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "authorId" TEXT;

ALTER TABLE "TicketMessage" ADD COLUMN IF NOT EXISTS "senderId" TEXT;

COMMIT;

SELECT '✅ Migration fix applied: required columns ensured (FKs not added in this restricted editor).' AS message;

