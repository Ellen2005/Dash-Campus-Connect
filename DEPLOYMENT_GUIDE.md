# Dash Platform - Complete Deployment Guide

This guide will walk you through deploying your Dash platform to production for free using GitHub and Vercel, with Supabase as your backend.

## Prerequisites

Before you begin, make sure you have:
- A GitHub account (free)
- A Supabase account (free tier available)
- Node.js installed on your computer
- Git installed on your computer

## Step 1: Prepare Your Supabase Project

### 1.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization (or create a new one)
4. Give your project a name (e.g., "dash-campus-connect")
5. Generate a strong database password and save it securely
6. Select a region closest to your target users
7. Click "Create new project" and wait for it to provision (2-5 minutes)

### 1.2 Get Your Supabase Credentials
Once your project is ready:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **KEEP THIS SECRET!**

### 1.3 Set Up Your Database (Option A: Run SQL Directly)
**This is the easiest method if you have database connection issues.**

1. Go to the **SQL Editor** in Supabase
2. Copy the entire contents of `prisma/full_schema.sql` from your project
3. Paste it into the SQL Editor
4. Click **Run** to execute the script
5. All tables, indexes, and foreign keys will be created

**Note:** If you already have existing tables from a previous setup, you may need to drop them first or run a migration diff. The `full_schema.sql` file contains the complete schema.

### 1.3 Set Up Your Database (Option B: Use Prisma Migrations)
If you prefer using Prisma migrations:

1. Make sure your `.env.local` file has correct database credentials
2. Run these commands in your terminal:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
3. If you get authentication errors, use Option A above instead

### 1.4 Configure Authentication
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (even though you use Student ID, Supabase requires email internally)
3. Disable **Confirm email** if you want instant access (optional)
4. Configure any other providers you want (Google, etc.)

### 1.5 Set Up Storage
1. Go to **Storage**
2. Create a new bucket called `avatars` (for profile pictures)
3. Create another bucket called `posts` (for post images)
4. Set both to **Public** if you want anyone to view images

## Step 2: Prepare Your Local Project

### 2.1 Update Environment Variables
Create a `.env.local` file in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database (for Prisma)
DATABASE_URL=postgresql://postgres.[your-project-ref]:[your-db-password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[your-project-ref]:[your-db-password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**How to get DATABASE_URL:**
1. Go to Supabase → **Settings** → **Database**
2. Copy the **Connection string** (URI mode)
3. Replace `[YOUR-PASSWORD]` with your actual database password
4. For `DIRECT_URL`, use the same but change port from `6543` to `5432` and remove `?pgbouncer=true`

### 2.2 Generate Prisma Client and Run Migrations
Open your terminal in the project folder and run:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Push schema directly (faster, but less safe)
# npx prisma db push
```

### 2.3 Test Locally
```bash
npm run dev
```
Visit `http://localhost:9002` and test the application.

## Step 3: Push to GitHub

### 3.1 Create a GitHub Repository
1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon → **New repository**
3. Name it (e.g., `dash-campus-connect`)
4. Keep it **Public** (free) or **Private** (also free)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

### 3.2 Initialize Git and Push
Open terminal in your project folder:

```bash
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Dash platform"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/dash-campus-connect.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 3.3 Secure Your Secrets
Make sure your `.env.local` file is in `.gitignore` so secrets aren't uploaded:

```bash
# Check .gitignore contains .env
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

## Step 4: Deploy to Vercel (Free)

### 4.1 Create a Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Complete the onboarding (select "Hobby" for personal projects)

### 4.2 Import Your Project
1. Click **Add New...** → **Project**
2. Under "Import Git Repository", find your `dash-campus-connect` repo
3. Click **Import**

### 4.3 Configure Build Settings
Vercel will auto-detect Next.js. Verify:
- **Framework Preset:** Next.js
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (default)

### 4.4 Add Environment Variables
Click **Environment Variables** and add these one by one:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL
   - Environments: Production, Preview, Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon key
   - Environments: Production, Preview, Development

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key
   - Environments: Production, Preview, Development

4. **DATABASE_URL**
   - Value: Your DATABASE_URL (with pgbouncer)
   - Environments: Production, Preview, Development

5. **DIRECT_URL**
   - Value: Your DIRECT_URL (without pgbouncer)
   - Environments: Production, Preview, Development

### 4.5 Deploy
1. Click **Deploy**
2. Wait 2-5 minutes for the build
3. Once complete, you'll see a success message with your live URL (e.g., `https://dash-campus-connect.vercel.app`)

### 4.6 Run Prisma Migrations on Vercel
After deployment, you need to run Prisma migrations on the production database:

1. Go to your Vercel project → **Settings** → **Deployment Protection** (if available)
2. Or use Vercel CLI locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Run migrations on production
vercel env pull  # pulls production env vars
npx prisma migrate deploy
```

## Step 5: Post-Deployment Setup

### 5.1 Set Up Custom Domain (Optional)
1. Go to Vercel → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `dash.yourschool.com`)
3. Follow the DNS configuration instructions
4. SSL is automatic

### 5.2 Configure Supabase Auth Redirects
1. Go to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g., `https://dash-campus-connect.vercel.app`)
3. Add these redirect URLs:
   - `https://dash-campus-connect.vercel.app/auth/callback`
   - `https://dash-campus-connect.vercel.app/main/**`

### 5.3 Create Initial Admin Account
You'll need to manually create the first school admin:

1. Go to Supabase → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Use a fake email like `admin.schoolid@dash-campus.app`
4. Set a secure password
5. Then update the user's metadata in the database to set them as admin

Or use the Admin Portal registration page at `/admin-portal/register` if available.

### 5.4 Set Up Automated Backups
1. Go to Supabase → **Settings** → **Database**
2. Under **Backups**, enable automated daily backups
3. Configure retention period (7 days free, more with paid plan)

## Step 6: Testing Your Deployment

### 6.1 Test Key Flows
1. **Student Registration:**
   - Visit your Vercel URL
   - Click "Join Your Campus"
   - Fill in registration form
   - Verify "Awaiting Approval" screen appears

2. **Admin Approval:**
   - Log into Admin Portal (`/admin-portal`)
   - Approve the test student
   - Verify student can now log in

3. **Core Features:**
   - Test creating a post
   - Test creating an event
   - Test marketplace listing
   - Test messaging

### 6.2 Check Logs
If something doesn't work:
1. Vercel: Go to **Deployments** → click latest → **Logs**
2. Supabase: Go to **Logs** → filter by table or function

## Step 7: Ongoing Maintenance

### 7.1 Updating Your App
Whenever you make changes:

```bash
# Commit changes
git add .
git commit -m "Your changes"

# Push to GitHub
git push

# Vercel automatically deploys!
```

### 7.2 Database Changes
If you modify the Prisma schema:

```bash
# Generate new migration
npx prisma migrate dev --name description_of_change

# Test locally
npm run dev

# Deploy to production
git push  # triggers Vercel deploy
npx prisma migrate deploy  # run via Vercel CLI or manually
```

### 7.3 Monitoring
- **Vercel Analytics:** Enable in project settings
- **Supabase Logs:** Monitor database performance
- **Error Tracking:** Consider adding Sentry for error monitoring

## Troubleshooting Common Issues

### Issue: "Database connection failed"
**Solution:** Check your DATABASE_URL and DIRECT_URL are correct and the Supabase project is active.

### Issue: "Prisma client not generated"
**Solution:** Run `npx prisma generate` and redeploy.

### Issue: "Authentication not working"
**Solution:** Verify Supabase Auth URL configuration matches your Vercel domain.

### Issue: "Images not loading"
**Solution:** Check Supabase Storage bucket permissions are set to Public.

### Issue: "API routes returning 500"
**Solution:** Check Vercel logs for error messages. Common causes: missing environment variables, database connection issues.

## Cost Estimate (Free Tier)

| Service | Free Tier Limits | Cost |
|---------|------------------|------|
| Vercel | 100GB bandwidth/month, unlimited deployments | $0 |
| Supabase | 500MB database, 1GB storage, 50,000 MAU | $0 |
| GitHub | Unlimited public/private repos | $0 |
| **Total** | | **$0/month** |

## Next Steps

1. **Set up monitoring** with Vercel Analytics and Supabase logs
2. **Configure email notifications** in Supabase for auth events
3. **Add a custom domain** for a professional look
4. **Set up CI/CD** with GitHub Actions for automated testing
5. **Plan for scaling** - upgrade Supabase when you exceed free limits

## Support Resources

- **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation:** [supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation:** [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Documentation:** [prisma.io/docs](https://prisma.io/docs)

---

**Congratulations!** Your Dash platform is now live and accessible worldwide! 🎉