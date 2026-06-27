# Dash Demo Script

**Duration:** ~8 minutes  
**Audience:** Stakeholders, investors, or evaluators  
**Setup:** Browser at `/login`, admin portal at `/admin-portal/login`

---

## [0:00] Introduction

> "Welcome to Dash — a campus social platform connecting students within their school. Built with Next.js 16, PostgreSQL via Prisma, Supabase Auth, and deployed on Vercel. Let me walk you through the complete experience."

---

## [0:30] Registration Flow

**Action:** Navigate to `/register`

> "New students register using their student ID and school. The system generates a synthetic email behind the scenes for Supabase Auth. After registration, the account is pending approval — admins must activate it."

**Action:** Submit registration form

> "Now the student sees this 'awaiting approval' screen. Let's switch to the admin portal to approve them."

---

## [1:30] Admin Portal — User Management

**Action:** Open `/admin-portal/login`, enter credentials

> "The admin portal has its own authentication system. Admins can view pending users, approve or reject registrations, manage fields of study and academic levels."

**Action:** Navigate to pending users, approve the test student

> "One click to approve. The student can now log in."

---

## [2:30] Login & Dashboard

**Action:** Log in as the approved student

> "After login, we land on the main feed. The layout is inspired by Discord/Messenger — server sidebar on the left with communities, channel sidebar, main content feed, and the right sidebar shows trending topics, suggested users, and announcements."

**Action:** Point out elements

> "Notice the notification dot on the feed icon — it's dynamic, showing real-time unread notification count. Same for the messages icon. These update every 30 seconds."

---

## [3:30] Feed & Posts

**Action:** Scroll through feed, point out a post

> "The feed shows recent posts from the student's school community. Each post supports like, comment, and share. Let's see the commenting feature."

**Action:** Click comment on a post

> "Comments work in real-time. All API routes are authenticated via Supabase session cookies."

---

## [4:00] Stories

**Action:** Click on the story section, show creating a story

> "Stories are temporary posts that expire after 24 hours. Students can upload photos with captions. The story viewer supports image fallback — if a story image fails to load, it gracefully shows the caption instead of a black screen."

**Action:** Show the story viewer

> "Tap left or right to navigate between stories. The progress bar shows current position."

---

## [4:30] Events

**Action:** Navigate to `/main/events`

> "Students can create, RSVP to, and check into events. Admins approve events before they go live. The calendar view shows upcoming campus events."

---

## [5:00] Marketplace

**Action:** Navigate to `/main/marketplace`

> "The campus marketplace lets students buy, sell, and trade items within their school. Each listing has details, price, and seller info. The cart system supports checkout flow with Stripe integration."

---

## [5:30] Messages

**Action:** Open `/main/messages`

> "Direct messaging works in real-time. Unread messages show a red dot on the conversation list and on the nav sidebar. When you open a conversation, messages are automatically marked as read."

**Action:** Click a conversation with unread messages

> "See the dot on the conversation avatar? That's the unread indicator. Opening the thread auto-marks them as read."

---

## [6:00] Notifications

**Action:** Open `/main/notifications`

> "The notification center aggregates likes, comments, follows, mentions, and system announcements. Each notification type can be toggled on/off in preferences. The unread count syncs across all nav elements."

---

## [6:30] Profile & Settings

**Action:** Navigate to `/main/profile`

> "The profile page shows the student's info, posts, saved items. The settings tab includes language selection (English/French), notification preferences, and a privacy toggle to make the profile public or school-only."

**Action:** Toggle privacy setting

> "Privacy changes are saved instantly via the PATCH API."

---

## [7:00] Search & Discovery

**Action:** Open `/main/search`

> "The search feature indexes posts, users, communities, and events across the school. Results are filtered by school and use relevance sorting."

---

## [7:15] Admin Dashboard

**Action:** Navigate to `/main/admin` (if student admin)

> "Student admins have access to analytics, user management, broadcast announcements, and content moderation. The broadcast tool uses AI to optimize message tone and urgency."

**Action:** Show the broadcast composer

> "Draft a message, optionally run it through the AI assistant, and broadcast to all students. Delivery is tracked."

---

## [7:30] Technical Highlights

> "Under the hood:"
> - "Authentication via Supabase with HTTP-only cookies and `sb-dash` prefix"
> - "All 70+ API endpoints have input validation via Zod"
> - "Rate limiting on login (5/min per user), search (30/min), and upload (10/min)"
> - "Security headers: X-Frame-Options DENY, XSS Protection, HSTS in production"
> - "i18n support for English and French"
> - "Database: 28 Prisma models with proper relations, indexing on key columns"

---

## [8:00] Closing

> "Dash is production-ready, deployed via Vercel with zero-config Next.js support. The architecture scales horizontally, with the main bottleneck being the PostgreSQL database — addressable with connection pooling via Supabase or PgBouncer."

> "Thank you. Questions?"
