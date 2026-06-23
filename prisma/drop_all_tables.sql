-- ============================================
-- DROP ALL TABLES AND ENUMS - CLEAN DATABASE
-- Run this in Supabase SQL Editor BEFORE running full_schema.sql
-- ============================================

-- Drop all tables in correct order (respecting foreign key dependencies)
-- Start with tables that have foreign keys to other tables

DROP TABLE IF EXISTS "ActivityLog" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "ModeratorFlag" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "MarketplaceListing" CASCADE;
DROP TABLE IF EXISTS "EventAttendee" CASCADE;
DROP TABLE IF EXISTS "Event" CASCADE;
DROP TABLE IF EXISTS "ChatGroup" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "GroupMember" CASCADE;
DROP TABLE IF EXISTS "Group" CASCADE;
DROP TABLE IF EXISTS "Mention" CASCADE;
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "Like" CASCADE;
DROP TABLE IF EXISTS "PollOption" CASCADE;
DROP TABLE IF EXISTS "Post" CASCADE;
DROP TABLE IF EXISTS "Follow" CASCADE;
DROP TABLE IF EXISTS "AdminChatMessage" CASCADE;
DROP TABLE IF EXISTS "AdminChatGroup" CASCADE;
DROP TABLE IF EXISTS "Announcement" CASCADE;
DROP TABLE IF EXISTS "TicketMessage" CASCADE;
DROP TABLE IF EXISTS "SupportTicket" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "CartItem" CASCADE;
DROP TABLE IF EXISTS "ShoppingCart" CASCADE;
DROP TABLE IF EXISTS "Brand" CASCADE;
DROP TABLE IF EXISTS "CommunityPost" CASCADE;
DROP TABLE IF EXISTS "CommunityMember" CASCADE;
DROP TABLE IF EXISTS "Community" CASCADE;
DROP TABLE IF EXISTS "AdminSession" CASCADE;
DROP TABLE IF EXISTS "AdminAccount" CASCADE;
DROP TABLE IF EXISTS "Level" CASCADE;
DROP TABLE IF EXISTS "FieldOfStudy" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "School" CASCADE;

-- Drop all custom enums
DROP TYPE IF EXISTS "ApprovalStatus" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "AdminRole" CASCADE;
DROP TYPE IF EXISTS "CommunityType" CASCADE;
DROP TYPE IF EXISTS "CommunityRole" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "TicketCategory" CASCADE;
DROP TYPE IF EXISTS "TicketPriority" CASCADE;
DROP TYPE IF EXISTS "TicketStatus" CASCADE;
DROP TYPE IF EXISTS "AnnouncementStatus" CASCADE;
DROP TYPE IF EXISTS "AnnouncementPriority" CASCADE;
DROP TYPE IF EXISTS "Audience" CASCADE;
DROP TYPE IF EXISTS "GroupType" CASCADE;
DROP TYPE IF EXISTS "GroupRole" CASCADE;
DROP TYPE IF EXISTS "EventApprovalStatus" CASCADE;
DROP TYPE IF EXISTS "RSVPStatus" CASCADE;
DROP TYPE IF EXISTS "MarketplaceCategory" CASCADE;
DROP TYPE IF EXISTS "Condition" CASCADE;
DROP TYPE IF EXISTS "ListingStatus" CASCADE;
DROP TYPE IF EXISTS "FlagStatus" CASCADE;
DROP TYPE IF EXISTS "NotificationType" CASCADE;

-- Verify all tables are dropped (should return 0 rows)
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Verify all enums are dropped (should return 0 rows)
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Output success message
SELECT '✅ Database cleaned successfully! All tables and enums have been dropped. You can now run full_schema.sql.' AS message;