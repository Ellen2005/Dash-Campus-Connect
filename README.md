# Dash — Campus Connect

A full-stack campus social platform built with Next.js 16, Supabase, and Prisma.

## Features

- **Campus Feed** — posts, stories, channels, announcements
- **Groups & Communities** — join/create study groups and clubs
- **Marketplace** — buy/sell textbooks and campus items
- **Events** — RSVP to campus events
- **Lost & Found** — report and find lost items
- **Notifications** — real-time alerts with preferences
- **Multi-school** — each school has its own isolated campus
- **Bilingual** — English and French (EN/FR)
- **6 Themes** — Obsidian Gold, Royal Blue, Rose Pink, Warm Amber, Emerald, Light
- **Student ID Auth** — no email required, login with Student ID + password
- **Admin Portal** — school registration, student approval, moderation

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma 7, PostgreSQL (Supabase)
- **Auth**: Supabase Auth (Student ID based, no email)
- **Storage**: Supabase Storage
- **AI**: Google Genkit (Gemini 2.5 Flash)
- **UI**: Radix UI, Lucide Icons, shadcn/ui

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/dash-campus.git
cd dash-campus
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local` (see `.env.example` for required variables).

### 4. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and API keys to `.env.local`
3. Create storage buckets: `posts`, `avatars`, `covers`, `stories`, `events`, `marketplace`
4. In Authentication → Settings: disable email confirmation (we use Student ID auth)

### 5. Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002)

## Admin Portal

- Register your school: `/admin-portal/register`
- Admin login: `/admin-portal/login`
- Manage students, approve registrations, broadcast announcements

## Student Registration Flow

1. Student selects their school
2. Enters Student ID + password (no email needed)
3. Admin approves in the portal
4. Student signs in and completes onboarding

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, Register, Onboarding
│   ├── admin-portal/       # Admin dashboard
│   ├── api/                # API routes
│   └── main/               # Main app (feed, events, etc.)
├── components/
│   ├── feed/               # Post card, create post, feed
│   ├── events/             # Event card, create event
│   ├── layout/             # Sidebar, navigation
│   ├── shared/             # Reusable dialogs, tour, story viewer
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth-context.tsx    # Supabase auth provider
│   ├── i18n.tsx            # EN/FR translations
│   ├── prisma.ts           # Database client
│   └── upload.ts           # File upload utilities
└── proxy.ts                # Security middleware (rate limiting, headers)
```

## License

MIT
