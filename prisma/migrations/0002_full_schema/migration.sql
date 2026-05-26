-- Migration: Full schema extension
-- Adds School, FieldOfStudy, Level, AdminAccount, AdminSession,
-- Community, CommunityMember, CommunityPost, Brand, ShoppingCart,
-- CartItem, Order, OrderItem, SupportTicket, TicketMessage,
-- Announcement, AdminChatGroup, AdminChatMessage
-- and updates User table with new fields.

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AdminRole" AS ENUM ('OWNER');
CREATE TYPE "CommunityType" AS ENUM ('FIELD_ONLY', 'LEVEL_ONLY', 'FIELD_AND_LEVEL', 'STUDENT_CREATED');
CREATE TYPE "CommunityRole" AS ENUM ('OWNER', 'MODERATOR', 'MEMBER');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "PaymentMethod" AS ENUM ('MOBILE_MONEY', 'ORANGE_MONEY');
CREATE TYPE "TicketCategory" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'INQUIRY', 'BUG_REPORT', 'FEATURE_REQUEST');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED');
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');
CREATE TYPE "EventApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Update User table: add new columns
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "schoolId" TEXT,
  ADD COLUMN IF NOT EXISTS "fieldOfStudyId" TEXT,
  ADD COLUMN IF NOT EXISTS "levelId" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "hometown" TEXT,
  ADD COLUMN IF NOT EXISTS "isStudentAdmin" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "approvalRejectedReason" TEXT;

-- Rename major -> keep both for compat (major stays, fieldOfStudyId is new FK)

-- Add approvalStatus index
CREATE INDEX IF NOT EXISTS "User_schoolId_idx" ON "User"("schoolId");
CREATE INDEX IF NOT EXISTS "User_fieldOfStudyId_idx" ON "User"("fieldOfStudyId");
CREATE INDEX IF NOT EXISTS "User_levelId_idx" ON "User"("levelId");
CREATE INDEX IF NOT EXISTS "User_approvalStatus_idx" ON "User"("approvalStatus");

-- Add EventApprovalStatus to Event
ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "approvalStatus" "EventApprovalStatus" NOT NULL DEFAULT 'PENDING';
CREATE INDEX IF NOT EXISTS "Event_approvalStatus_idx" ON "Event"("approvalStatus");

-- CreateTable School
CREATE TABLE IF NOT EXISTS "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "allowedDomain" TEXT,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "School_createdAt_idx" ON "School"("createdAt");

-- CreateTable FieldOfStudy
CREATE TABLE IF NOT EXISTS "FieldOfStudy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FieldOfStudy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FieldOfStudy_schoolId_name_key" UNIQUE ("schoolId", "name")
);
CREATE INDEX IF NOT EXISTS "FieldOfStudy_schoolId_idx" ON "FieldOfStudy"("schoolId");

-- CreateTable Level
CREATE TABLE IF NOT EXISTS "Level" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Level_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Level_schoolId_name_key" UNIQUE ("schoolId", "name")
);
CREATE INDEX IF NOT EXISTS "Level_schoolId_idx" ON "Level"("schoolId");
CREATE INDEX IF NOT EXISTS "Level_order_idx" ON "Level"("order");

-- CreateTable AdminAccount
CREATE TABLE IF NOT EXISTS "AdminAccount" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminAccount_schoolId_key" UNIQUE ("schoolId")
);

-- CreateTable AdminSession
CREATE TABLE IF NOT EXISTS "AdminSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminSession_tokenHash_key" UNIQUE ("tokenHash")
);
CREATE INDEX IF NOT EXISTS "AdminSession_adminId_idx" ON "AdminSession"("adminId");
CREATE INDEX IF NOT EXISTS "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateTable Community
CREATE TABLE IF NOT EXISTS "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photo" TEXT,
    "type" "CommunityType" NOT NULL DEFAULT 'STUDENT_CREATED',
    "schoolId" TEXT NOT NULL,
    "fieldOfStudyId" TEXT,
    "levelId" TEXT,
    "isAutoAssigned" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Community_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Community_schoolId_fieldOfStudyId_levelId_key" UNIQUE ("schoolId", "fieldOfStudyId", "levelId")
);
CREATE INDEX IF NOT EXISTS "Community_schoolId_idx" ON "Community"("schoolId");
CREATE INDEX IF NOT EXISTS "Community_fieldOfStudyId_idx" ON "Community"("fieldOfStudyId");
CREATE INDEX IF NOT EXISTS "Community_levelId_idx" ON "Community"("levelId");
CREATE INDEX IF NOT EXISTS "Community_type_idx" ON "Community"("type");

-- CreateTable CommunityMember
CREATE TABLE IF NOT EXISTS "CommunityMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "role" "CommunityRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunityMember_userId_communityId_key" UNIQUE ("userId", "communityId")
);
CREATE INDEX IF NOT EXISTS "CommunityMember_communityId_idx" ON "CommunityMember"("communityId");

-- CreateTable CommunityPost
CREATE TABLE IF NOT EXISTS "CommunityPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CommunityPost_communityId_idx" ON "CommunityPost"("communityId");
CREATE INDEX IF NOT EXISTS "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

-- CreateTable Brand
CREATE TABLE IF NOT EXISTS "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Brand_sellerId_idx" ON "Brand"("sellerId");

-- Add brandId to MarketplaceListing
ALTER TABLE "MarketplaceListing"
  ADD COLUMN IF NOT EXISTS "brandId" TEXT;
CREATE INDEX IF NOT EXISTS "MarketplaceListing_brandId_idx" ON "MarketplaceListing"("brandId");

-- CreateTable ShoppingCart
CREATE TABLE IF NOT EXISTS "ShoppingCart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShoppingCart_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ShoppingCart_userId_key" UNIQUE ("userId")
);
CREATE INDEX IF NOT EXISTS "ShoppingCart_userId_idx" ON "ShoppingCart"("userId");

-- CreateTable CartItem
CREATE TABLE IF NOT EXISTS "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CartItem_cartId_listingId_key" UNIQUE ("cartId", "listingId")
);
CREATE INDEX IF NOT EXISTS "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateTable Order
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'MOBILE_MONEY',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Order_buyerId_idx" ON "Order"("buyerId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");

-- CreateTable OrderItem
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateTable SupportTicket
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateTable TicketMessage
CREATE TABLE IF NOT EXISTS "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT,
    "content" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateTable Announcement
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "schoolId" TEXT,
    "authorId" TEXT,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Announcement_status_idx" ON "Announcement"("status");
CREATE INDEX IF NOT EXISTS "Announcement_priority_idx" ON "Announcement"("priority");
CREATE INDEX IF NOT EXISTS "Announcement_publishedAt_idx" ON "Announcement"("publishedAt");
CREATE INDEX IF NOT EXISTS "Announcement_schoolId_idx" ON "Announcement"("schoolId");

-- CreateTable AdminChatGroup
CREATE TABLE IF NOT EXISTS "AdminChatGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Admin Channel',
    "schoolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminChatGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable AdminChatMessage
CREATE TABLE IF NOT EXISTS "AdminChatMessage" (
    "id" TEXT NOT NULL,
    "chatGroupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL DEFAULT 'Admin',
    "senderRole" TEXT NOT NULL DEFAULT 'admin',
    "content" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminChatMessage_chatGroupId_idx" ON "AdminChatMessage"("chatGroupId");
CREATE INDEX IF NOT EXISTS "AdminChatMessage_senderId_idx" ON "AdminChatMessage"("senderId");

-- AddForeignKeys
ALTER TABLE "School" ADD CONSTRAINT "School_id_fkey" CHECK (true); -- placeholder

ALTER TABLE "FieldOfStudy" ADD CONSTRAINT "FieldOfStudy_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Level" ADD CONSTRAINT "Level_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminAccount" ADD CONSTRAINT "AdminAccount_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "AdminAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_fieldOfStudyId_fkey"
  FOREIGN KEY ("fieldOfStudyId") REFERENCES "FieldOfStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_levelId_fkey"
  FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Community" ADD CONSTRAINT "Community_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Community" ADD CONSTRAINT "Community_fieldOfStudyId_fkey"
  FOREIGN KEY ("fieldOfStudyId") REFERENCES "FieldOfStudy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Community" ADD CONSTRAINT "Community_levelId_fkey"
  FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Community" ADD CONSTRAINT "Community_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityMember" ADD CONSTRAINT "CommunityMember_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Brand" ADD CONSTRAINT "Brand_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_brandId_fkey"
  FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShoppingCart" ADD CONSTRAINT "ShoppingCart_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey"
  FOREIGN KEY ("cartId") REFERENCES "ShoppingCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey"
  FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminChatMessage" ADD CONSTRAINT "AdminChatMessage_chatGroupId_fkey"
  FOREIGN KEY ("chatGroupId") REFERENCES "AdminChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
