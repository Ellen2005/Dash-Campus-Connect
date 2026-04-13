# Developer Quick Start - Dash Backend

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (1 min)
```bash
cd c:\Users\PC\Dash\Dash
npm install
```

### 2. Setup Database (2 min)
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy entire content from:
   ```
   prisma/migrations/0001_init/migration.sql
   ```
5. Paste into editor
6. Click **Run**

Wait for success message.

### 3. Start Development Server (1 min)
```bash
npm run dev
```

Server running at: **http://localhost:3000**

### 4. Test an Endpoint (1 min)
Open another terminal:
```bash
curl http://localhost:3000/api/posts?page=1&limit=10
```

Should return: `{ "posts": [], "pagination": {...} }`

---

## 📚 Essential Files

| File | Purpose |
|------|---------|
| `API_DOCUMENTATION.md` | Full API reference |
| `API_QUICK_REFERENCE.md` | Quick lookup |
| `SETUP_AND_RUNNING.md` | Setup guide with examples |
| `IMPLEMENTATION_SUMMARY.md` | What was built |
| `VERIFICATION_REPORT.md` | Implementation summary |
| `.env.local` | Environment config |
| `prisma/schema.prisma` | Database schema |
| `src/app/api/` | All API routes |

---

## 🧪 First Test Sequence

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "Password@123",
    "name": "Test User",
    "major": "Computer Science",
    "year": "2026"
  }'
```

Copy the returned `id` (you'll need it for next steps).

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "password": "Password@123"
  }'
```

Note the returned `user.id`.

### 3. Create a Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello Dash!",
    "authorId": "YOUR_USER_ID_HERE",
    "audience": "EVERYONE"
  }'
```

### 4. Get All Posts
```bash
curl http://localhost:3000/api/posts
```

You should see your post!

### 5. Like the Post
```bash
curl -X POST http://localhost:3000/api/posts/POST_ID_HERE/like \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID_HERE",
    "reaction": "👍"
  }'
```

---

## 🎯 Common Tasks

### Add User to Database
1. Call `POST /api/auth/register`
2. User is automatically created in database

### Create Event
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hackathon",
    "date": "2024-02-15T10:00:00Z",
    "location": "CS Building",
    "organizerId": "user-uuid",
    "category": "ACADEMIC"
  }'
```

### Join Event
```bash
curl -X POST http://localhost:3000/api/events/event-id/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "status": "GOING"
  }'
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "user-id-1",
    "recipientId": "user-id-2",
    "content": "Hey!"
  }'
```

### Get User's Messages
```bash
curl http://localhost:3000/api/messages?userId=user-id
```

---

## 🛠️ Development Workflow

### When Adding New Features

1. **Update Database Schema**
   ```
   Edit: prisma/schema.prisma
   ```

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

3. **Create API Route**
   ```
   New file: src/app/api/feature/route.ts
   ```

4. **Add Validation Schema**
   ```typescript
   import { z } from 'zod'
   const CreateSchema = z.object({
     field: z.string(),
   })
   ```

5. **Implement Handler**
   ```typescript
   export async function POST(request: NextRequest) {
     try {
       const data = CreateSchema.parse(await request.json())
       // Your logic here
       return NextResponse.json(result, { status: 201 })
     } catch (error) {
       return NextResponse.json({ error: error.message }, { status: 400 })
     }
   }
   ```

6. **Test Endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/feature \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

---

## 🐛 Troubleshooting

### API Returns 404
- [ ] Check URL spelling
- [ ] Verify server is running
- [ ] Check route file exists

### Database Connection Error
- [ ] Verify `.env.local` has correct credentials
- [ ] Check Supabase project is running
- [ ] Run migration in Supabase SQL Editor

### Validation Error (422)
- [ ] Check request body format
- [ ] Verify required fields are included
- [ ] Check field types match schema

### Type Errors
- [ ] Run: `npm run typecheck`
- [ ] Fix any TypeScript errors
- [ ] Clear `.next` folder: `rm -r .next`

---

## 📖 Documentation Quick Links

For detailed information:

1. **All endpoints**: See `API_DOCUMENTATION.md`
2. **Quick lookup**: See `API_QUICK_REFERENCE.md`
3. **Setup help**: See `SETUP_AND_RUNNING.md`
4. **Full summary**: See `IMPLEMENTATION_SUMMARY.md`

---

## 🔧 Useful Commands

```bash
# Type checking
npm run typecheck

# Lint code
npm run lint

# Generate Prisma types
npx prisma generate

# View Prisma Studio (database UI)
npx prisma studio

# Create database migration
npx prisma migrate dev

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 💡 Quick Code Examples

### Get User Profile
```typescript
import { prisma } from '@/lib/prisma'

const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { followers: true }
})
```

### Create Post with Transaction
```typescript
const post = await prisma.post.create({
  data: {
    content: 'Hello',
    authorId: userId,
    audience: 'EVERYONE'
  }
})
```

### Get Posts with Pagination
```typescript
const posts = await prisma.post.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
  include: { author: true, comments: true }
})
```

### Add Comment to Post
```typescript
const comment = await prisma.comment.create({
  data: {
    content: text,
    postId: postId,
    authorId: userId
  },
  include: { author: true }
})
```

---

## 🎯 Next Steps

1. ✅ Run the server (`npm run dev`)
2. ✅ Test endpoints with curl commands
3. ✅ Connect frontend components to APIs
4. ✅ Test full workflows
5. ✅ Deploy to production

---

## 📱 Using Postman

1. **Download Postman** from postman.com
2. **Import Collection**
   - File → Import
   - Select API endpoints
   - Add URLs from API_DOCUMENTATION.md
3. **Setup Environment**
   - Create variables:
     - `base_url: http://localhost:3000`
     - `user_id: (your-user-id)`
     - `auth_token: (your-jwt-token)`
4. **Test Endpoints**
   - Use {{base_url}} in URLs
   - Add {{auth_token}} to headers if needed

---

## 🚀 Ready to Go!

The backend is fully set up and ready for:
- ✅ API testing
- ✅ Frontend integration
- ✅ Database operations
- ✅ User authentication
- ✅ All platform features

**Current Status:** Development server ready at http://localhost:3000

Questions? Check the documentation files first - they cover everything!

