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
- Added missing DB indexes: `EventAttendee(userId)`, `GroupMember(userId)`, `Post(groupPostId, audienceGroupId)`, `Mention(postId, commentId)`, `ChatGroup(members GIN)`, `CartItem(listingId)`, `OrderItem(listingId)`, `LibraryResource(uploadedById)`, `Notification(userId, isRead, createdAt)` composite
- Optimized search route: filtered `followers` include (take:1) + `_count` instead of loading entire arrays; similarly for group `members`
- Build passes with zero errors

### In Progress
- None

### Blocked
- None

## Key Decisions
- Used `DEMO_MODE` env var instead of hardcoding rate-limit bypass to keep production security intact
- Kept session keepalive at 5min to balance network traffic vs session freshness
- Removed seed script entirely — user wants zero demo data, just stability
- Left `/api/health` as a lightweight non-auth endpoint for monitoring uptime
- Replaced full `followers`/`following`/`members` array loads with `_count` + filtered `include (where, take:1)` pattern across all routes

## Next Steps
- Add React performance optimizations (memo, dynamic imports) on heavy components (feed, sidebar, story viewer)
- Add caching headers (stale-while-revalidate, CDN cache) to frequently-called GET endpoints
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
- `src/app/api/users/[userId]/route.ts`: Added notificationPrefs to GET select, privacyPublic to PATCH schema, replaced followers/following arrays with _count
- `src/app/api/messages/route.ts`: Added unreadCount per conversation, fixed N+1
- `src/app/api/messages/unread/route.ts`: New endpoint for total unread message count
- `src/app/api/messages/[conversationId]/route.ts`: Auto mark-as-read on fetch
- `src/app/api/admin/fields/route.ts`: Added requireAdminSession()
- `src/app/api/admin/levels/route.ts`: Added requireAdminSession()
- `src/app/api/analytics/export/route.ts`: Added admin role check
- `src/app/api/sidebar/route.ts`: Optimized _count query
- `src/app/api/search/route.ts`: Optimized followers/members queries with filtered includes + _count
- `src/app/main/layout.tsx`: Dynamic unread counts in mobile nav + top bar
- `src/components/layout/discord-sidebar.tsx`: Unread dots on Bell + MessageCircle
- `src/app/main/messages/page.tsx`: Unread badges in conversation list
- `src/app/main/profile/page.tsx`: Wired privacy toggle
- `src/components/feed/story-section.tsx`: Fixed image error handling
- `src/components/shared/story-viewer.tsx`: Fixed image error handling
- `prisma/schema.prisma`: Added composite and missing indexes across 10 models
- `next.config.ts`: Image remote patterns, WebP/AVIF formats, lucide-react tree-shaking
