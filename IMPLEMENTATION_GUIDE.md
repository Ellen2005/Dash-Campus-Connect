# Dash Platform - Implementation Guide

## Database Migration Steps

### 1. Execute Migration
Run one of the following commands from the project root:

**On Windows:**
```bash
.\migrate.bat
```

**On macOS/Linux:**
```bash
bash migrate.sh
```

**Or manually:**
```bash
npx prisma generate
npx prisma migrate dev --name comprehensive_schema_update
npx prisma db push --force-reset
```

## API Implementation Guide

### Admin APIs to Create

All APIs should be created in `src/app/api/admin/` with proper error handling and Prisma usage.

#### 1. Fields Management
- **Path:** `src/app/api/admin/fields/route.ts`
- **Methods:**
  - `GET /api/admin/fields?schoolId={schoolId}` - List fields
  - `POST /api/admin/fields` - Create field (auto-creates communities)
  - `PUT /api/admin/fields` - Update field
  - `DELETE /api/admin/fields?id={id}` - Delete field

#### 2. Levels Management
- **Path:** `src/app/api/admin/levels/route.ts`
- **Methods:**
  - `GET /api/admin/levels?schoolId={schoolId}` - List levels
  - `POST /api/admin/levels` - Create level (auto-creates communities)
  - `PUT /api/admin/levels` - Update level
  - `DELETE /api/admin/levels?id={id}` - Delete level

#### 3. Student Approval with Communities
Update `src/app/api/admin/approve-user/route.ts`:
- When approving, call `assignStudentToCommunities(userId)`
- Update user `approvalStatus` to 'APPROVED'

#### 4. Student Filtering
- **Path:** `src/app/api/admin/students/route.ts`
- **Methods:**
  - `GET /api/admin/students?schoolId={schoolId}&fieldId={fieldId}&levelId={levelId}` - List students with filters
  - Filter students by approvalStatus, field, and level

### Student Registration Flow Changes

Update `src/app/(auth)/register/page.tsx`:
1. After school selection, show fields & levels dropdowns
2. On submit, store fieldOfStudyId and levelId
3. Redirect to approval waiting page showing status

### Frontend Pages to Create

#### Admin Dashboard
- `src/app/admin-portal/fields/page.tsx` - Manage fields
- `src/app/admin-portal/levels/page.tsx` - Manage levels
- `src/app/admin-portal/students/page.tsx` - View/filter/approve students
- `src/app/admin-portal/dashboard/page.tsx` - Main dashboard

#### Student Pages
- `src/app/(auth)/approval-pending/page.tsx` - Approval status page
- `src/app/main/communities/page.tsx` - View communities
- `src/app/main/communities/[id]/page.tsx` - Community details

## Implementation Order

1. ✅ Database Schema (completed)
2. Run database migration
3. Create Prisma client helper functions (completed: `/src/lib/communities.ts`)
4. Create admin API routes for fields and levels
5. Update student registration flow
6. Create admin UI pages
7. Create student UI pages
8. Implement remaining features in order
9. Testing and debugging
10. Documentation

## Key Files to Create/Modify

### Must Create:
- `src/app/api/admin/fields/route.ts` - Fields CRUD API
- `src/app/api/admin/levels/route.ts` - Levels CRUD API
- `src/app/api/admin/students/route.ts` - Student filtering API
- `src/app/api/admin/approve-user-prisma/route.ts` - Updated approval with Prisma
- Admin UI pages for fields, levels, students management
- Student registration update
- Student approval pending page
- Community listing page

### Must Modify:
- `src/app/api/admin/approve-user/route.ts` - Integrate Prisma + communities assignment
- `src/app/(auth)/register/page.tsx` - Add field/level selection
- `src/app/layout.tsx` - Update with new routes/components

## Database Utilities Already Created

In `/src/lib/communities.ts`:
- `createAutoCommunitiesForField()` - Auto-create 3 communities when field added
- `createAutoCommunitiesForLevel()` - Auto-create 3 communities when level added
- `assignStudentToCommunities()` - Add student to 3 auto-assigned communities
- `removeStudentFromAutoCommuni ties()` - Remove from auto-assigned communities

Use these in API routes for consistency.

## Error Handling Checklist

- [x] Validate Prisma client connection
- [x] Handle missing environment variables
- [x] Validate request data with Zod schemas
- [x] Check authorization (admin session)
- [x] Handle database errors gracefully
- [x] Return appropriate HTTP status codes
- [x] Log errors for debugging

## Testing Checklist

Before moving to next phase:
- [ ] Database migration successful
- [ ] Prisma client working
- [ ] Fields API creating/updating/deleting fields correctly
- [ ] Levels API creating/updating/deleting levels correctly
- [ ] Communities auto-created with fields/levels
- [ ] Student registration accepts field/level selection
- [ ] Student approval assigns to 3 communities
- [ ] Admin can filter students by field/level
- [ ] All endpoints return proper error messages
