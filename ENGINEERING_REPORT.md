# Dash Engineering Report

## Executive Summary

This report documents the comprehensive engineering review, security audit, database analysis, and applied fixes for the Dash campus social platform. The application is built with Next.js 16 (App Router + Turbopack), Prisma ORM with PostgreSQL, Supabase Auth, and is deployable on Vercel or Render.

**Build status:** ✅ Compiles successfully (TypeScript strict mode, zero errors)  
**Security posture:** Solid foundation with `requireUser()` guards on all mutation endpoints  
**Overall production readiness score: 78/100**

---

## All Detected Issues & Fixes

### Phase 1-2: Critical Infrastructure Issues

| # | Issue | Severity | Root Cause | File(s) | Fix Applied |
|---|-------|----------|------------|---------|-------------|
| 1 | All API calls return 401 | **CRITICAL** | `auth-context.tsx` created browser client without `sb-dash` cookie prefix; server used `sb-dash` — mismatch | `src/lib/auth-context.tsx:13` | Added `cookieOptions: { name: "sb-dash", maxAge: 86400 }` matching server's `createClient()` |
| 2 | Announcements dismiss not persisting | **HIGH** | `GET /api/users/[userId]` Prisma query didn't select `notificationPrefs` field | `src/app/api/users/[userId]/route.ts:55` | Added `notificationPrefs: true` to Prisma `select` clause |
| 3 | Story viewer black screen | **HIGH** | Image `onError` handler used `innerHTML` assignment that broke React DOM sync | `src/components/feed/story-section.tsx:190-192` | Replaced with React state `storyImageError` + conditional rendering; same fix applied to `story-viewer.tsx` |

### Phase 3-4: Functional & Integration Issues

| # | Issue | Severity | Root Cause | File(s) | Fix Applied |
|---|-------|----------|------------|---------|-------------|
| 4 | No notification dot on feed icon | **MEDIUM** | Mobile bottom nav had hard-coded dot on `/main/notifications` (not in nav items) | `src/app/main/layout.tsx:159-161` | Added dynamic fetch from `/api/notifications/unread`, dot on Home icon when count > 0 |
| 5 | No unread message indicators anywhere | **HIGH** | No API to count unread messages; conversation list had no `unreadCount` field | `src/app/api/messages/` `src/app/main/messages/page.tsx` | Created `GET /api/messages/unread`, added per-conversation `unreadCount` to messages API, dots in conversation list + mobile nav + desktop sidebar |
| 6 | Messages not marked as read | **MEDIUM** | `GET /api/messages/[conversationId]` never updated `isRead` field | `src/app/api/messages/[conversationId]/route.ts` | Added `prisma.message.updateMany` after fetching messages |
| 7 | Privacy toggle not wired | **MEDIUM** | `Switch` used `defaultChecked` with no state binding or API call | `src/app/main/profile/page.tsx:384` | Added `privacyPublic` state, PATCH to `/api/users/[id]`, added `privacyPublic` to PATCH Zod schema |

### Phase 3-5: Security Issues

| # | Issue | Severity | Root Cause | File(s) | Fix Applied |
|---|-------|----------|------------|---------|-------------|
| 8 | admin/fields GET no auth | **HIGH** | GET handler had no `requireAdminSession()` call | `src/app/api/admin/fields/route.ts:5` | Added `requireAdminSession()` to GET handler |
| 9 | admin/levels GET no auth | **HIGH** | GET handler had no `requireAdminSession()` call | `src/app/api/admin/levels/route.ts:5` | Added `requireAdminSession()` to GET handler |
| 10 | analytics/export weak auth | **HIGH** | Used `getSession()` only — no admin role verification | `src/app/api/analytics/export/route.ts:15-19` | Replaced with `requireUser()` + admin role check |
| 11 | Upload data URL fallback | **HIGH** | When Supabase Storage fails, falls back to base64 in DB — balloons DB, no access control | `src/app/api/upload/route.ts:66-69` `src/lib/upload.ts:29-50` | **Design trade-off accepted** — removing fallback would break uploads when external storage is unavailable. Recommendation: Add storage error monitoring instead. |

### Phase 3-6: Database Performance Issues

| # | Issue | Severity | Root Cause | File(s) | Fix Applied |
|---|-------|----------|------------|---------|-------------|
| 12 | N+1 query in messages/route.ts | **HIGH** | Loop calling `prisma.message.count()` per group chat | `src/app/api/messages/route.ts:120-129` | Replaced with single `prisma.message.groupBy()` query |
| 13 | Sidebar data over-fetching | **MEDIUM** | Loaded full `likes` and `comments` arrays (all records) for 80 posts, only used `.length` | `src/app/api/sidebar/route.ts:16-21` | Changed to `_count: { select: { likes: true, comments: true } }` |
| 14 | User profile loads all followers | **MEDIUM** | `GET /api/users/[userId]` selects entire `followers` and `following` arrays | `src/app/api/users/[userId]/route.ts:56-62` | **Recommendation:** Replace with `_count` for follower/following counts, paginate actual lists |

### Phase 3-7: Performance Issues (Analysis Only)

| # | Issue | Severity | Recommendation |
|---|-------|----------|----------------|
| 15 | In-memory rate limiting | **MEDIUM** | Migrate to Redis/Upstash for multi-instance deployments |
| 16 | No `Content-Loading` pattern for posts | **LOW** | Add incremental static regeneration (ISR) for public pages |
| 17 | Bundle size: All lucide-react icons imported | **LOW** | Use direct imports (`import { Home } from "lucide-react"`) — already done ✅ |
| 18 | No image optimization | **LOW** | Use `next/image` for user-uploaded images with remote patterns config |

### Phase 3-8: Critical Security Gaps (Not Fixed — Design Decisions)

| # | Issue | Severity | Rationale |
|---|-------|----------|-----------|
| 19 | No CSRF tokens | **MEDIUM** | `SameSite: "lax"` cookies + `X-Frame-Options: DENY` + `Referrer-Policy` provide adequate protection for this use case |
| 20 | No rate limiting on registration | **MEDIUM** | Add via Supabase RLS or Vercel WAF in production |
| 21 | Admin session TTL (14 days) | **LOW** | Reduce to 48 hours for production |
| 22 | User profile GET is public | **LOW** | Design choice — profiles are public by nature; email/studentId could be filtered |

---

## Applied Fixes Summary

| Module | Files Changed | Changes |
|--------|---------------|---------|
| **Auth** | `auth-context.tsx` | Added `cookieOptions: { name: "sb-dash", maxAge: 86400 }` |
| **Users** | `users/[userId]/route.ts` | Added `notificationPrefs: true` to select, `privacyPublic` to PATCH schema |
| **Stories** | `story-section.tsx`, `story-viewer.tsx` | Replaced `innerHTML` with React state for image error handling |
| **Layout** | `main/layout.tsx` | Added dynamic unread notification + message counts with 30s polling |
| **Sidebar** | `discord-sidebar.tsx` | Added unread dots on Bell and MessageCircle icons |
| **Messages** | `messages/route.ts`, `messages/[conversationId]/route.ts`, `messages/unread/route.ts` | Added `messages/unread` endpoint, per-conversation `unreadCount`, mark-as-read on fetch |
| **Messages UI** | `messages/page.tsx` | Added unread dot + numeric badge to conversation list items |
| **Profile** | `profile/page.tsx` | Wired privacy toggle to state + PATCH API |
| **Admin Security** | `admin/fields/route.ts`, `admin/levels/route.ts` | Added `requireAdminSession()` to GET handlers |
| **Analytics Security** | `analytics/export/route.ts` | Replaced `getSession()` with `requireUser()` + admin role check |
| **Performance** | `messages/route.ts`, `sidebar/route.ts` | Replaced N+1 queries with `groupBy` and `_count` |

---

## Remaining Technical Debt

| Area | Debt | Impact | Priority |
|------|------|--------|----------|
| **DB Schema** | Missing indexes on 12+ FK columns | Query performance for large datasets | High |
| **DB Schema** | `Float` for prices (should be `Decimal`) | Floating-point rounding | Medium |
| **DB Schema** | `Post.saves` / `PollOption.votes` as arrays (should be join tables) | No referential integrity | Medium |
| **DB Schema** | Missing enums for `LibraryResource.type`, `Event.category`, `Like.reaction` | Data consistency | Low |
| **DB Schema** | Missing `onDelete` on 3 relations | Orphan risk on delete | Medium |
| **Performance** | In-memory rate limiting | Doesn't work across instances | Medium |
| **Security** | No register rate limiting | Account creation DoS | Medium |
| **Code** | Some routes use `supabase.getUser()` directly instead of `requireUser()` | Inconsistent pattern | Low |
| **Code** | `where: any` type assertions in Prisma queries | Bypasses TS checks | Low |
| **Code** | `userId` passed in URL query params for audit | Exposed in server logs | Low |

---

## Production Readiness Checklist

### Deployment (Vercel / Render)

| Item | Status | Details |
|------|--------|---------|
| Environment variables | ✅ Documented in `.env.example` | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENKIT_API_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Secrets management | ✅ `.env*` in `.gitignore` | Verify with `git log --all --diff-filter=A -- .env` |
| Build | ✅ `npm run build` passes | TypeScript + Turbopack, 0 errors |
| Database migrations | ⚠️ Prisma | Run `npx prisma migrate deploy` before starting |
| Health check | ⚠️ Not implemented | Add `GET /api/health` returning `{ status: "ok" }` |
| Logging | ✅ | `console.error` with route prefixes used consistently |
| Monitoring | ❌ Not implemented | Add Sentry or OpenTelemetry |
| Docker | ❌ Not configured | Add `Dockerfile` for Render deployment |
| CI/CD | ❌ Not configured | Add GitHub Actions for lint + test + build |

### Vercel Deployment (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. In Vercel dashboard:
#    - Import repo
#    - Framework: Next.js (auto-detected)
#    - Root directory: ./
#    - Build command: npm run build (auto)
#    - Output directory: .next (auto)

# 3. Environment variables (all required):
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATABASE_URL
vercel env add DIRECT_URL  # for Prisma migrations
vercel env add GOOGLE_GENKIT_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# 4. Deploy
vercel --prod
```

### Render Deployment

```bash
# Build command:
npm install && npx prisma generate && npm run build

# Start command:
npx prisma migrate deploy && npm start

# Health check path:
/ (or add /api/health)
```

---

## Scoring

| Metric | Score (0-100) | Notes |
|--------|---------------|-------|
| **Production Readiness** | 78 | Missing: health check, Docker, CI/CD, monitoring. Strong: auth, error handling, rate limiting |
| **Code Quality** | 82 | Clean project structure, consistent patterns, TypeScript strict mode. Minor issues: `any` casts, inconsistent auth patterns |
| **Architecture** | 85 | Well-separated API routes, reusable components, proper Prisma service layer, SSR/CSR balance |
| **Security** | 80 | No SQL injection, XSS mitigated via React, strong auth middleware, CSRF protected via SameSite. Missing: register rate limit, CSRF tokens |
| **Performance** | 72 | N+1 fixed, bundle reasonable. Missing: DB indexes, image optimization, caching strategy |
| **Maintainability** | 84 | Self-documenting file structure, consistent naming, Zod validation, i18n support. Missing: tests |
