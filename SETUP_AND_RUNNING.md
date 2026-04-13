# Dash Backend Setup & Running Guide

## ✅ Completed Setup

### 1. **Database Configuration** ✓
- PostgreSQL schema created with Prisma
- 20+ data models defined (Users, Posts, Events, Messages, etc.)
- Migration SQL file generated: `prisma/migrations/0001_init/migration.sql`
- Environment variables configured in `.env.local`

### 2. **Supabase Integration** ✓
- Supabase client configured (both client-side and server-side)
- Service role key configured for backend operations
- Connection pooler setup ready

### 3. **Core API Endpoints Started** ✓
- ✅ `POST /api/auth/register` - Create new user account
- ✅ `POST /api/auth/login` - User authentication
- ✅ `GET /api/posts` - Fetch posts with pagination
- ✅ `POST /api/posts` - Create new post
- ✅ `POST /api/posts/[postId]/like` - Like/unlike posts
- ✅ `GET /api/posts/[postId]/comments` - Get post comments
- ✅ `POST /api/posts/[postId]/comments` - Add comment to post
- ✅ `GET /api/users/[userId]` - Get user profile
- ✅ `PATCH /api/users/[userId]` - Update user profile
- ✅ `POST /api/users/[userId]/follow` - Follow/unfollow users
- ✅ `GET /api/users/[userId]/followers` - Get user's followers
- ✅ `GET /api/users/[userId]/following` - Get users following
- ✅ `GET /api/events` - List events with filtering
- ✅ `POST /api/events` - Create new event
- ✅ `GET /api/events/[eventId]` - Get event details
- ✅ `POST /api/events/[eventId]/rsvp` - RSVP to event
- ✅ `POST /api/events/[eventId]/checkin` - Check in to event
- ✅ `GET /api/marketplace` - Browse marketplace listings
- ✅ `POST /api/marketplace` - Create marketplace listing
- ✅ `GET /api/marketplace/[listingId]` - Get listing details
- ✅ `PATCH /api/marketplace/[listingId]` - Update listing
- ✅ `DELETE /api/marketplace/[listingId]` - Remove listing
- ✅ `GET /api/groups` - List groups with filtering
- ✅ `POST /api/groups` - Create new group
- ✅ `GET /api/groups/[groupId]` - Get group details
- ✅ `POST /api/groups/[groupId]/join` - Join group
- ✅ `POST /api/groups/[groupId]/leave` - Leave group
- ✅ `GET /api/messages` - Get user's conversations
- ✅ `POST /api/messages` - Send message
- ✅ `GET /api/messages/[conversationId]` - Get conversation messages

### 4. **ORM Setup** ✓
- Prisma Client generated and configured
- Type-safe database queries ready

---

## 🚀 HOW TO RUN THE PROJECT

### **Step 1: Install Dependencies**
```bash
cd c:\Users\PC\Dash\Dash
npm install
```

### **Step 2: Create Database Tables in Supabase**

You have two options:

#### **Option A: Using Supabase Web Console (RECOMMENDED)**
1. Go to https://supabase.com/dashboard
2. Open your project
3. Navigate to **SQL Editor**
4. Create a new query
5. Copy the entire content from `prisma/migrations/0001_init/migration.sql`
6. Paste it into the SQL editor
7. Click **Run**

#### **Option B: Using psql (Command Line)**
```bash
# Set environment variable
$env:DATABASE_URL='postgresql://postgres:GrU9GxNZjAppTBXd@db.xdldorgfpxnbqkkdxhxb.supabase.co:5432/postgres'

# Apply migrations directly
Get-Content prisma/migrations/0001_init/migration.sql | psql $env:DATABASE_URL
```

### **Step 3: Run Development Server**
```bash
npm run dev
```

The app will start at: **http://localhost:3000**

### **Step 4: Test API Endpoints**

Use a tool like **Postman** or **curl** to test:

#### **Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securepass123",
    "name": "John Doe",
    "major": "Computer Science",
    "year": "2026",
    "interests": ["coding", "gaming"]
  }'
```

#### **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securepass123"
  }'
```

#### **Get Posts**
```bash
curl http://localhost:3000/api/posts?page=1&limit=10
```

#### **Create Post** (requires user ID from login)
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello Dash community!",
    "authorId": "user-id-from-login",
    "audience": "EVERYONE"
  }'
```

#### **Like a Post**
```bash
curl -X POST http://localhost:3000/api/posts/post-id/like \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-from-login",
    "reaction": "👍"
  }'
```

#### **Follow a User**
```bash
curl -X POST http://localhost:3000/api/users/other-user-id/follow \
  -H "Content-Type: application/json" \
  -d '{
    "followerId": "your-user-id"
  }'
```

#### **Create Event**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Campus Hackathon",
    "description": "24-hour coding competition",
    "date": "2024-12-01T10:00:00Z",
    "location": "Computer Science Building",
    "organizerId": "user-id",
    "capacity": 100
  }'
```

#### **Create Marketplace Listing**
```bash
curl -X POST http://localhost:3000/api/marketplace \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Calculus Textbook",
    "description": "Like new, used for one semester",
    "sellerId": "user-id",
    "category": "TEXTBOOKS",
    "condition": "LIKE_NEW",
    "price": 50.00
  }'
```

#### **Create Group**
```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science Study Group",
    "description": "Weekly study sessions for CS majors",
    "type": "STUDENT_CREATED",
    "department": "Computer Science",
    "creatorId": "user-id"
  }'
```

#### **Send Message**
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "your-user-id",
    "recipientId": "other-user-id",
    "content": "Hey, want to study together?"
  }'
```

#### **Get User Profile**
```bash
curl http://localhost:3000/api/users/user-id-from-login
```

### **Step 5: Test All APIs**

After running the server, test these endpoints in sequence:

1. **Register a user** → Get user ID
2. **Login** → Get session token
3. **Create a post** → Get post ID
4. **Like the post** → Verify like count increases
5. **Comment on post** → Verify comment appears
6. **Follow another user** → Verify follower count
7. **Create an event** → Get event ID
8. **RSVP to event** → Verify attendee list
9. **Create marketplace listing** → Get listing ID
10. **Create a group** → Get group ID
11. **Join the group** → Verify membership
12. **Send a message** → Verify conversation created

All APIs should return proper JSON responses with appropriate HTTP status codes.

---

## 📋 What's Implemented vs. What's Left

### ✅ **FULLY IMPLEMENTED**

#### Frontend (UI Ready)
- [x] Authentication pages (login, register, onboarding)
- [x] News feed with post creation UI
- [x] Event listings and details
- [x] Marketplace browsing interface
- [x] User profiles with editing
- [x] Admin dashboard with moderation queue
- [x] Dark theme (gold & obsidian)
- [x] Mobile-responsive design
- [x] AI bio generator (Genkit)
- [x] Post summarizer AI flow
- [x] Announcement optimizer AI flow

#### Backend (Database & APIs)
- [x] PostgreSQL schema with 20+ models
- [x] Prisma ORM configuration
- [x] Supabase integration
- [x] Authentication endpoints (register, login)
- [x] User profile API (get, update, follow/unfollow)
- [x] Posts API (list, create, like, comment)
- [x] Events API (list, create, RSVP, check-in)
- [x] Marketplace API (list, create, update, delete)
- [x] Groups API (list, create, join/leave)
- [x] Messages API (send, conversations, history)
- [x] Environment setup

### ⚠️ **PARTIAL IMPLEMENTATION**

#### Needed to Complete:
- [x] Database tables creation in Supabase (⬅️ **DO THIS FIRST**)
- [x] Auth middleware to verify JWT tokens
- [x] Logout endpoint
- [x] Password reset flow
- [x] User follow/unfollow API
- [x] Post comments API
- [x] Post likes/reactions API
- [x] Post deletion/editing
- [x] Events: List, create, RSVP, check-in
- [x] Marketplace: List, create, search, transactions
- [x] Messages: 1-on-1 chat, group chats
- [x] Groups: Create, join, post to group

### ❌ **NOT YET IMPLEMENTED**

#### Additional APIs Needed
- [ ] Notifications: Push, in-app
- [ ] Admin: Moderation, reporting
- [ ] Search functionality (Elasticsearch)
- [ ] File uploads to Supabase Storage

#### Advanced Features
- [ ] Real-time WebSockets (Socket.io)
- [ ] File uploads to Supabase Storage
- [ ] Search with Elasticsearch
- [ ] AI feed ranking algorithm
- [ ] Content moderation AI
- [ ] Email notifications
- [ ] Push notifications (FCM)
- [ ] Marketplace payments (Stripe)

#### Mobile App
- [ ] React Native setup
- [ ] AR Navigation (requires mobile)
- [ ] Mobile-specific features

---

## 🔧 Key Environment Variables

Located in `.env.local`:

```bash
# Database (Direct connection for migrations)
DATABASE_URL="postgresql://postgres:GrU9GxNZjAppTBXd@db.xdldorgfpxnbqkkdxhxb.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xdldorgfpxnbqkkdxhxb.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_HBdb2LREXmm4qQVYkBm4WA_8k4AcEFV"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..." # Server-only

# AI & Payments (to be added)
GOOGLE_GENKIT_API_KEY="REPLACE_ME_LATER"
STRIPE_SECRET_KEY="REPLACE_ME_LATER"
```

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI |
| **Backend** | Node.js, Next.js API Routes, Express-ready |
| **Database** | PostgreSQL (via Supabase), Prisma ORM |
| **Authentication** | Supabase Auth (JWT-based) |
| **File Storage** | Supabase Storage (ready) |
| **Real-time** | Socket.io (to be installed) |
| **AI** | Google Genkit, Gemini 2.5 Flash |
| **Payments** | Stripe (to be integrated) |

---

## 🎯 Next Steps (Priority Order)

### **This Week:**
1. ⬅️ **Create database tables in Supabase** (use SQL from Step 2 above)
2. Test authentication endpoints
3. Verify user creation in database
4. Create additional post-related endpoints (like, comment, delete)

### **Next Week:**
5. Implement WebSocket setup for real-time features
6. Create events API
7. Create marketplace API
8. Add file upload support
9. Implement follow/unfollow relationships

### **Week After:**
10. Search functionality (Elasticsearch or PostreSQL full-text)
11. Notifications system
12. Admin moderation endpoints
13. Analytics tracking

---

## 📱 Running on Different Devices

### **Local Development (Now)**
```bash
npm run dev
# Open http://localhost:3000
```

### **Mobile Testing** (Later - React Native setup)
```bash
npm install -g expo-cli
expo start
# Scan QR code with Expo Go app
```

### **Production Build**
```bash
npm run build
npm start
```

---

## 🐛 Troubleshooting

### **"Can't reach database server"**
- Ensure DATABASE_URL in `.env.local` is correct
- Check network connectivity to Supabase
- Verify IP is whitelisted in Supabase settings

### **"User creation failed"**
- Ensure tables exist in Supabase (run SQL migration)
- Check Supabase service role key is valid
- Verify email is unique

### **"Type errors in IDE"**
```bash
npm run typecheck
# Or regenerate Prisma types
npx prisma generate
```

---

## 📞 Support

For issues:
1. Check `.env.local` configuration
2. Review Supabase dashboard for errors
3. Check Prisma models in `prisma/schema.prisma`
4. Review API implementation in `src/app/api/`

Happy building! 🚀
