# Phase 6: Production & DevOps

## 1. Hosting Architecture

### Vercel (Frontend + API Routes)
- **Production**: `dash-campus-connect.vercel.app`
- **Preview**: Auto-deployed per PR via Vercel GitHub integration
- **Environment Variables**:
  - `DATABASE_URL` - Supabase PostgreSQL connection string
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY` - Admin key for server-side operations
  - `NEXT_PUBLIC_SITE_URL` - Deployment URL

### Supabase (Database + Storage + Auth)
- **Database**: PostgreSQL with connection pooling via Supavisor
- **Storage**: S3-compatible buckets (avatars, posts, events, stories)
- **Auth**: Built-in auth with email/password + magic link
- **RLS Policies**: Row-level security for multi-tenant isolation

## 2. Monitoring

### Error Tracking (Sentry)
```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Performance Monitoring
- **Vercel Analytics**: Page views, web vitals
- **Prisma Logging**: Slow query detection (>100ms)
- **API Route Logging**: Request duration tracking

## 3. Cron Jobs

### Daily Cleanup (Vercel Cron Jobs)
```typescript
// src/app/api/cron/cleanup/route.ts
export async function GET() {
  // Delete expired stories (>24h)
  await prisma.story.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  
  // Archive old notifications (>90 days)
  await prisma.notification.deleteMany({
    where: { createdAt: { lt: daysAgo(90) } },
  });
  
  // Clean up expired cart items (>7 days)
  await prisma.cartItem.deleteMany({
    where: { createdAt: { lt: daysAgo(7) } },
  });
}
```

### Scheduled Tasks
| Task | Frequency | Description |
|------|-----------|-------------|
| Story cleanup | Every hour | Remove expired stories |
| Notification archive | Daily | Delete notifications >90 days |
| Cart cleanup | Daily | Remove abandoned cart items |
| Event status update | Hourly | Mark past events as completed |

## 4. Backup Strategy

### Database Backups
- **Automated**: Supabase daily backups (7-day retention)
- **Manual**: `pg_dump` before major migrations
- **Point-in-time recovery**: Supabase PITR (7-day window)

### File Storage
- **Buckets**: Supabase Storage with S3 compatibility
- **Backup**: AWS S3 cross-region replication (optional)

## 5. Security Checklist

- [x] API routes use `requireUser()` middleware
- [x] School isolation via `schoolId` from session
- [x] Zod validation on all write endpoints
- [x] Audit logging for admin actions
- [ ] Rate limiting on auth endpoints
- [ ] CORS configuration for production domain
- [ ] CSP headers in next.config.js
- [ ] Secrets rotation policy documented

## 6. Deployment Runbook

### Initial Deploy
```bash
# 1. Push to main branch
git push origin main

# 2. Vercel auto-deploys (check dashboard)
# 3. Run database migrations
npx prisma migrate deploy

# 4. Verify health endpoint
curl https://dash-campus-connect.vercel.app/api/health

# 5. Configure custom domain in Vercel
# 6. Set up Supabase project in production
# 7. Configure environment variables
```

### Rollback
```bash
# Vercel: Go to deployment dashboard → click "..." → "Rollback to Stable"
# Database: Use Supabase point-in-time recovery
```

## 7. Environment Configuration

### next.config.js
```javascript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};