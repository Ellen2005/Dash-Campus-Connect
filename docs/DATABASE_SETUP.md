# Database connection troubleshooting

## Your situation (common on Windows + Supabase)


| URL                                         | Result                                       |
| ------------------------------------------- | -------------------------------------------- |
| `DATABASE_URL` → pooler **:6543**           | Works (app runtime)                          |
| `DIRECT_URL` → `db.*.supabase.co` **:5432** | `ENOTFOUND` (DNS cannot resolve direct host) |


The app can run, but `prisma migrate deploy` needs a working **DIRECT_URL**.

## Fix: use Session pooler on port 5432 (not db.*.supabase.co)

1. In Supabase: **Project Settings → Database → Connection string**
2. Choose **Session mode** (or URI with port **5432** on `*.pooler.supabase.com`)
3. Set in `.env.local`:

```env
# Keep this (Transaction pooler — app)
DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Use this for migrations (Session pooler — same host, port 5432)
DIRECT_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

Or generate `DIRECT_URL` from your working `DATABASE_URL`:

```powershell
npm run db:direct-url
# Copy the printed DIRECT_URL= line into .env.local
```

1. Verify and migrate:

```powershell
npm run db:test
npm run db:migrate
```

Both `[DIRECT_URL]` and `[DATABASE_URL]` should show **OK**.

## Fallback: run SQL in Supabase Dashboard

If migrate still fails, open **SQL Editor** and run the file:

`prisma/migrations/20250604120000_platform_sync/migration.sql`

Then mark the migration applied (optional):

```sql
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid()::text,
  '',
  NOW(),
  '20250604120000_platform_sync',
  NULL,
  NULL,
  NOW(),
  1
) ON CONFLICT DO NOTHING;
```

## OneDrive / EPERM on `.next`

If `EPERM` when deleting `.next`:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .next
npm run dev
```

Long term: move the project to `C:\dev\Dash` (outside OneDrive).