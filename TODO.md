# Dash Platform - Implementation Status

Last updated: June 2026

## Completed in latest pass

- Event create modal stability (`dialog-panel` — no hover translate on modals)
- Prisma models: `Story`, `LostFoundItem`, `studentId`, `bannerImage`, `SUSPENDED` approval status
- Migration: `prisma/migrations/20250604120000_platform_sync/migration.sql`
- Mock data removed from admin portal, lost & found, connections, create post
- Right sidebar wired to `/api/sidebar` (trending, suggested users, announcements)
- Post comments wired to `/api/posts/[id]/comments`
- Student approval: transaction + community assignment + notification
- Login blocks pending/rejected/suspended (API + client)
- Lost & found uses database only
- Stories API at `/api/stories`
- Search API uses `fieldOfStudy` / `level` (not legacy `major`/`year`)

## Excluded by request

- Password reset
- Email verification
- Future: academic calendar, community library, push notifications, brand verification

## You must run locally

```bash
# 1. Install dependencies
npm install

# 2. Set .env (see README.md)
# DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Apply database schema
npx prisma migrate deploy
# OR for dev:
npx prisma migrate dev

# 4. Generate Prisma client
npx prisma generate

# 5. Supabase Storage: create buckets + run SQL
# scripts/supabase-storage-rls.sql in Supabase SQL Editor

# 6. Start app
npm run dev
```

## Remaining enhancements (non-blocking)

- Community internal groups (`community_groups` table) — groups exist but not split from app groups
- Rich text editor for posts
- Typing indicators in DMs
- Payment provider integration (Mobile Money / Orange Money placeholders exist)
- E2E test suite (Playwright/Cypress)

See `IMPLEMENTATION_GUIDE.md` and `README.md` for full setup.
