# Delivery Plan — Dash Demo

## Goal
- Make the system load fast and stable for a 4+ hour live demo, fixing all runtime 401 errors and optimizing page/API response times.

## Constraints & Preferences
- No demo data or seed scripts
- Deployable on Vercel or Render
- Must handle 4+ hours without failure or rate-limit blocks
- Must load pages and API responses quickly

## Progress
### Done
- Fixed root cause of all 401 errors: auth-context.tsx now creates browser Supabase client with `sb-dash` cookie prefix matching the server's `createClient()`
- Fixed announcements dismiss not persisting: added `notificationPrefs` to `GET /api/users/[userId]` Prisma select
- Fixed story viewer black screen: replaced buggy `innerHTML` image error handler with React state-based fallback in both `story-section.tsx` and `story-viewer.tsx`
- Added dynamic notification dots: fetch `/api/notifications/unread` every 30s, show dot on Home icon in mobile nav and sidebar Bell icon
- Added unread message system: created `GET /api/messages/unread`, per-conversation `unreadCount` in messages API, dot + numeric badge in conversation list, auto mark-as-read on thread open
- Wired privacy/public profile toggle: Switch state to PATCH `/api/users/[id]`, added `privacyPublic` to Zod schema
- Fixed security gaps: added `requireAdminSession()` to `admin/fields` and `admin/levels` GET handlers; replaced weak `getSession()` with `requireUser()` + admin role check in `analytics/export`
- Fixed N+1 queries: replaced per-group loop in messages route with single `groupBy`; replaced full array loads with `_count` in sidebar route and search route
- Fixed user profile over-fetching: replaced full `followers`/`following` arrays with `_count` in `GET /api/users/[userId]`
- Added 5-minute session keepalive interval in auth-context.tsx to prevent auth expiry during long demos
- Added `/api/health` endpoint returning DB connectivity check
- Added `DEMO_MODE=true` env var support in middleware to bypass rate limits (9999 req/min)
- Removed seed scripts and demo-data entries from package.json
- Added DB indexes: 10 models (EventAttendee, GroupMember, Post, Mention, ChatGroup GIN, CartItem, OrderItem, LibraryResource, Notification composite)
- Optimized search route: filtered `followers` include (take:1) + `_count` instead of loading entire arrays; similarly for group `members`
- **Fixed DB schema sync**: ran `prisma db push` to add missing `recipientId` column to Message table (was renamed but never migrated)
- **Fixed search events tab**: added missing `<TabsContent value="events">` — tab trigger existed but content was missing
- **Fixed community post attachments**: added `images`, `attachmentUrl`, `attachmentName` fields to CommunityPost model + API
- **Fixed admin dashboard 401**: changed `/api/admin/users` (requires admin portal session) to `/api/campus-stats`
- Build passes with zero errors

### In Progress
- None

### Blocked
- Supabase storage bucket "uploads" needs to be created manually in Supabase dashboard (Settings → Storage) for file uploads to use Supabase instead of base64 fallback

## Key Decisions
- Used `DEMO_MODE` env var instead of hardcoding rate-limit bypass to keep production security intact
- Kept session keepalive at 5min to balance network traffic vs session freshness
- Removed seed script entirely — user wants zero demo data, just stability
- Left `/api/health` as a lightweight non-auth endpoint for monitoring uptime
- Replaced full `followers`/`following`/`members` array loads with `_count` + filtered `include (where, take:1)` pattern across all routes

## Next Steps
- Create "uploads" bucket in Supabase dashboard (public bucket, 10MB limit, allow PDF/images/video)
- Deploy with `DEMO_MODE=true` env var set for the presentation

## Critical Context
- All API routes now consistently use `requireUser()` from `@/lib/require-user` which calls `createClient()` from `@/lib/supabase/server` with `sb-dash` cookie prefix
- Before deployment, inform audience that **all existing sessions will be invalid** due to cookie prefix change from `sb-` to `sb-dash` — users must re-login once
- Rate limits during demo: 9999 req/min (set via `DEMO_MODE=true`)
- Auth session auto-refreshes every 5 minutes so no logout mid-demo
- Free Supabase: 5 max DB connections. Each API call takes one. At 5 concurrent slow queries, 6th user queues. Add connection pooling for production.

## Relevant Files
- `src/lib/auth-context.tsx`: Fixed cookie prefix + added 5min session keepalive
- `src/lib/supabase/server.ts`: Uses `sb-dash` prefix — server reference
- `src/lib/require-user.ts`: Auth middleware for all API routes
- `src/middleware.ts`: Rate limiting + security headers + DEMO_MODE support
- `src/app/api/health/route.ts`: Lightweight health check endpoint
- `src/app/api/upload/route.ts`: Uses "uploads" bucket, falls back to base64
- `src/app/api/users/[userId]/route.ts`: Added notificationPrefs, privacyPublic, _count for followers
- `src/app/api/messages/route.ts`: Unread counts, N+1 fix, recipientId fix
- `src/app/api/messages/unread/route.ts`: Unread message count endpoint
- `src/app/api/messages/[conversationId]/route.ts`: Auto mark-as-read
- `src/app/api/communities/[communityId]/posts/route.ts`: Added images/attachment support
- `src/app/api/search/route.ts`: Optimized queries + event filter fix
- `src/app/main/admin/page.tsx`: Changed to /api/campus-stats for user count
- `src/app/main/search/page.tsx`: Added missing Events tab content
- `prisma/schema.prisma`: Indexes, recipientId, CommunityPost attachments
