# Dash Platform APIs - Complete Implementation Package

Welcome! This package contains everything you need to implement 5 new API endpoints for the Dash Campus Connect platform.

## 📋 What's Included

This implementation provides:

### 1. **Complete API Documentation**
   - `API_IMPLEMENTATION_GUIDE.md` - Full API reference with examples
   - `SETUP_SUMMARY.md` - Overview of what's being created
   - `MANUAL_FILE_CREATION.md` - Step-by-step manual setup guide

### 2. **Automated Setup Scripts**
   - `setup-all.js` - Node.js setup (works on all platforms)
   - `setup-api-files.sh` - Bash setup (Linux/Mac/WSL)
   - `setup-api-files.bat` - Windows batch helper
   - `setup-api-files.js` - Alternative Node.js setup

### 3. **5 New API Endpoints**
   - **Admin Fields API** - Manage academic fields/departments
   - **Admin Levels API** - Manage academic levels/years
   - **Admin Students API** - Query and filter students
   - **Communities API** - Create and manage student communities
   - **Registration Fields API** - Public endpoint for registration form data

---

## 🚀 Quick Start (Choose One)

### Option 1: Node.js (Recommended - All Platforms)
```bash
node setup-all.js
```

### Option 2: Bash (Linux/Mac/WSL/Git Bash)
```bash
bash setup-api-files.sh
```

### Option 3: Manual Setup
Follow `MANUAL_FILE_CREATION.md` for step-by-step instructions

---

## 📁 Directory Structure

The setup will create this structure:

```
src/app/api/
├── admin/
│   ├── fields/
│   │   └── route.ts          ← Fields CRUD (GET, POST, PUT, DELETE)
│   ├── levels/
│   │   └── route.ts          ← Levels CRUD (GET, POST, PUT, DELETE)
│   └── students/
│       └── route.ts          ← Student filtering (GET)
├── communities/
│   └── route.ts              ← Community ops (GET, POST)
└── auth/
    └── registration-fields/
        └── route.ts          ← Registration form data (GET)
```

---

## 🎯 Features

Each endpoint includes:

### Fields Management (`/api/admin/fields`)
- ✅ List all fields for a school
- ✅ Create field + auto-create communities
- ✅ Update field details
- ✅ Delete field + cascade communities
- ✅ Duplicate name prevention
- ✅ Admin authentication required

### Levels Management (`/api/admin/levels`)
- ✅ List all levels ordered by sequence
- ✅ Create level + auto-create communities
- ✅ Update level details and order
- ✅ Delete level + cascade communities
- ✅ Duplicate name prevention
- ✅ Admin authentication required

### Student Filtering (`/api/admin/students`)
- ✅ Filter by school, field, level, approval status
- ✅ Pagination support (page, limit)
- ✅ Detailed student information
- ✅ Admin authentication required
- ✅ School isolation (admins only see their school)

### Communities (`/api/communities`)
- ✅ List user's communities (paginated)
- ✅ Get specific community details
- ✅ Create student-created communities
- ✅ Auto-add creator as OWNER
- ✅ No authentication required (userId in request)

### Registration Fields (`/api/auth/registration-fields`)
- ✅ Public endpoint (no auth needed)
- ✅ Returns available fields and levels for a school
- ✅ Used during user registration flow

---

## 🔒 Security Features

- **Admin Authentication**: Fields and levels require admin session
- **School Isolation**: Admins can't access other schools' data
- **Input Validation**: Zod schemas validate all inputs
- **Error Handling**: Proper HTTP status codes and error messages
- **Cascade Deletion**: Proper referential integrity

---

## 📖 Documentation Guide

### For Understanding the APIs:
→ Read `API_IMPLEMENTATION_GUIDE.md`

### For Quick Overview:
→ Read `SETUP_SUMMARY.md`

### For Manual Setup:
→ Read `MANUAL_FILE_CREATION.md`

### For Implementation Details:
→ Read the TypeScript files in setup scripts

---

## 🛠 Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **ORM**: Prisma 7+
- **Validation**: Zod
- **Database**: PostgreSQL
- **Authentication**: Admin session (custom)

---

## 📚 Dependencies

These are already in your project:

- `@/lib/prisma` - Database client
- `@/lib/require-admin` - Admin authentication
- `@/lib/communities` - Community utilities
- `zod` - Schema validation
- `next/server` - Next.js API route utilities

No additional packages needed!

---

## ✅ Verification After Setup

After running a setup script, verify everything works:

```bash
# Check files were created
ls src/app/api/admin/fields/route.ts
ls src/app/api/admin/levels/route.ts
ls src/app/api/admin/students/route.ts
ls src/app/api/communities/route.ts
ls src/app/api/auth/registration-fields/route.ts

# Check for TypeScript errors
npm run typecheck

# Check for linting issues
npm run lint

# Build to verify everything compiles
npm run build
```

---

## 🔗 API Endpoint Reference

### Admin Endpoints (Require Authentication)

```
GET    /api/admin/fields                    - List fields
POST   /api/admin/fields                    - Create field
PUT    /api/admin/fields                    - Update field
DELETE /api/admin/fields?id=...             - Delete field

GET    /api/admin/levels                    - List levels
POST   /api/admin/levels                    - Create level
PUT    /api/admin/levels                    - Update level
DELETE /api/admin/levels?id=...             - Delete level

GET    /api/admin/students                  - List/filter students
  Query: ?fieldId=...&levelId=...&approvalStatus=...&page=...&limit=...
```

### Public Endpoints (No Authentication)

```
GET    /api/communities                     - List user communities or get details
  Query: ?userId=...&id=...&page=...&limit=...
POST   /api/communities                     - Create community
  Body: {userId, name, description?, photo?}

GET    /api/auth/registration-fields        - Get fields and levels for registration
  Query: ?schoolId=...
```

---

## 📝 Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "error": null  // Only present if success is false
}
```

---

## 🐛 Troubleshooting

### Setup Script Failed

1. Ensure Node.js is installed: `node --version`
2. Try the alternative setup script
3. Follow `MANUAL_FILE_CREATION.md` for manual setup

### TypeScript Errors After Setup

1. Run `npm install` to ensure all dependencies
2. Run `npm run typecheck` to identify errors
3. Check that Prisma schema is up to date

### Endpoint Returns 401 Unauthorized

1. For admin endpoints: Ensure admin session is properly authenticated
2. Check that admin account exists in database
3. Verify admin session cookies are being sent

### Duplicate Name Errors

1. Field and level names are unique per school (case-insensitive)
2. Try renaming the field or level
3. Check database for existing entries

---

## 📞 Support

For issues with:
- **API Documentation**: See `API_IMPLEMENTATION_GUIDE.md`
- **Setup Process**: See `SETUP_SUMMARY.md` and `MANUAL_FILE_CREATION.md`
- **Implementation Details**: See the TypeScript files in setup scripts

---

## 📋 File Checklist

After setup, you should have:

- [x] `src/app/api/admin/fields/route.ts`
- [x] `src/app/api/admin/levels/route.ts`
- [x] `src/app/api/admin/students/route.ts`
- [x] `src/app/api/communities/route.ts`
- [x] `src/app/api/auth/registration-fields/route.ts`

---

## 🎓 Key Concepts

### Auto-Generated Communities

When you create a field:
- 1 field-only community (all students in field)
- N field+level communities (for each existing level)

When you create a level:
- 1 level-only community (all students in level)
- N field+level communities (for each existing field)

This ensures students are automatically assigned to relevant communities.

### Cascade Deletion

Deleting a field or level will also delete all associated communities. This maintains referential integrity.

### School Isolation

Admin users can only manage data for their assigned school. This is enforced at the application level.

---

## 🎉 You're All Set!

Choose your setup method above and follow the instructions. The scripts will create all files with correct formatting and content.

If you have any questions, refer to the documentation files included in this package.

Happy coding! 🚀
