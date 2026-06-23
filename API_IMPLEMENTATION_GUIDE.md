# Dash Platform APIs - Implementation Guide

This guide explains how to create and implement the Dash platform API routes for managing schools, fields, levels, students, and communities.

## Files to Create

This implementation requires creating 5 new API route files in the following structure:

```
src/app/api/
├── admin/
│   ├── fields/
│   │   └── route.ts          (Fields CRUD management)
│   ├── levels/
│   │   └── route.ts          (Levels CRUD management)
│   └── students/
│       └── route.ts          (Student filtering and listing)
├── communities/
│   └── route.ts              (Community CRUD operations)
└── auth/
    └── registration-fields/
        └── route.ts          (Get available fields/levels for registration)
```

## Setup Instructions

### Quick Setup (Recommended)

#### For Linux/Mac:
```bash
bash setup-api-files.sh
```

#### For Windows with Git Bash:
```bash
bash setup-api-files.sh
```

#### For Windows with Node.js:
```bash
node setup-all.js
```

### Manual Setup

If automated setup doesn't work, you can manually create the directories and copy the file contents from the sections below.

## API Endpoints Overview

### 1. Admin Fields Management (`/api/admin/fields`)

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required (Admin session)

#### GET - List Fields
- **Query:** No parameters
- **Response:** List of all fields for the admin's school
```json
{
  "success": true,
  "data": [
    {
      "id": "field-123",
      "name": "Engineering",
      "description": "Engineering program",
      "schoolId": "school-123",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST - Create Field
- **Body:**
```json
{
  "name": "Engineering",
  "description": "Engineering program"
}
```
- **Response:** Created field object + Auto-creates associated communities
- **Status:** 201

#### PUT - Update Field
- **Body:**
```json
{
  "id": "field-123",
  "name": "Engineering",
  "description": "Updated description"
}
```
- **Response:** Updated field object
- **Status:** 200

#### DELETE - Delete Field
- **Query:** `?id=field-123`
- **Response:** Deletes field and all associated communities (cascade)
- **Status:** 200

---

### 2. Admin Levels Management (`/api/admin/levels`)

**Methods:** GET, POST, PUT, DELETE

**Authentication:** Required (Admin session)

#### GET - List Levels
- **Query:** No parameters
- **Response:** List of all levels for the admin's school (ordered by order field)

#### POST - Create Level
- **Body:**
```json
{
  "name": "Level 1",
  "description": "First year",
  "order": 1
}
```
- **Response:** Created level object + Auto-creates associated communities
- **Status:** 201

#### PUT - Update Level
- **Body:**
```json
{
  "id": "level-123",
  "name": "Level 1",
  "description": "First year",
  "order": 1
}
```
- **Response:** Updated level object
- **Status:** 200

#### DELETE - Delete Level
- **Query:** `?id=level-123`
- **Response:** Deletes level and all associated communities (cascade)
- **Status:** 200

---

### 3. Admin Students Listing (`/api/admin/students`)

**Methods:** GET

**Authentication:** Required (Admin session)

#### GET - List & Filter Students
- **Query Parameters:**
  - `fieldId` (optional): Filter by field of study
  - `levelId` (optional): Filter by level
  - `approvalStatus` (optional): Filter by "PENDING", "APPROVED", or "REJECTED"
  - `page` (optional, default: 1): Page number for pagination
  - `limit` (optional, default: 10): Results per page (max: 100)

- **Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "user-123",
        "name": "John Doe",
        "email": "john@example.com",
        "username": "johndoe",
        "profilePhoto": "https://...",
        "schoolId": "school-123",
        "fieldOfStudy": {
          "id": "field-123",
          "name": "Engineering"
        },
        "level": {
          "id": "level-123",
          "name": "Level 1"
        },
        "approvalStatus": "APPROVED",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

### 4. Communities Management (`/api/communities`)

**Methods:** GET, POST

#### GET - List or Get Community Details
- **Query Parameters:**
  - `userId` (required if not using id): User ID to fetch their communities
  - `id` (optional): Get specific community by ID
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 10): Results per page

**Get User's Communities:**
```
GET /api/communities?userId=user-123&page=1&limit=10
```

**Get Community Details:**
```
GET /api/communities?id=community-123&userId=user-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "communities": [
      {
        "id": "community-123",
        "name": "Engineering Students",
        "description": "Community for engineering students",
        "photo": "https://...",
        "type": "STUDENT_CREATED",
        "schoolId": "school-123",
        "creatorId": "user-123",
        "isAutoAssigned": false,
        "school": {
          "id": "school-123",
          "name": "MIT"
        },
        "fieldOfStudy": null,
        "level": null,
        "_count": {
          "members": 25
        },
        "isMember": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### POST - Create Community
- **Body:**
```json
{
  "userId": "user-123",
  "name": "Machine Learning Club",
  "description": "For students interested in ML",
  "photo": "https://..."
}
```
- **Response:** Created community object (user is automatically added as OWNER)
- **Status:** 201

---

### 5. Registration Fields (`/api/auth/registration-fields`)

**Methods:** GET

**Authentication:** Not required (Public endpoint)

#### GET - Get Available Fields and Levels
- **Query Parameters:**
  - `schoolId` (required): The school ID

**Request:**
```
GET /api/auth/registration-fields?schoolId=school-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "id": "field-123",
        "name": "Engineering",
        "description": "Engineering program"
      },
      {
        "id": "field-456",
        "name": "Medicine",
        "description": "Medical program"
      }
    ],
    "levels": [
      {
        "id": "level-1",
        "name": "Level 1",
        "description": "First year",
        "order": 1
      },
      {
        "id": "level-2",
        "name": "Level 2",
        "description": "Second year",
        "order": 2
      }
    ]
  }
}
```

---

## Implementation Details

### Key Features

1. **Automatic Community Creation:**
   - When a field is created, 3 auto-assigned communities are created:
     - Field-only community (all students in field)
     - Field + Level communities (for each existing level)
   
   - When a level is created, 2 auto-assigned communities are created:
     - Level-only community (all students in level)
     - Field + Level communities (for each existing field)

2. **Error Handling:**
   - All endpoints validate input with Zod schemas
   - Proper HTTP status codes (400, 404, 403, 500)
   - Consistent error response format: `{success: false, error: "message"}`

3. **Duplicate Prevention:**
   - Field and level names are case-insensitive unique per school
   - Prevents duplicate creation attempts

4. **Access Control:**
   - Admin endpoints require admin session authentication
   - Admins can only manage their own school's data
   - Students can only create communities in their school

5. **Cascade Deletion:**
   - Deleting a field deletes all associated field-only and field+level communities
   - Deleting a level deletes all associated level-only and field+level communities

### Dependencies

- `@/lib/prisma` - Prisma database client
- `@/lib/require-admin` - Admin session authentication
- `@/lib/communities` - Utility functions for auto-community creation
- `zod` - Schema validation
- `next/server` - Next.js API utilities

### Database Models Used

- `FieldOfStudy` - Fields with schoolId, name, description
- `Level` - Levels with schoolId, name, description, order
- `Community` - Communities with type, schoolId, fieldOfStudyId, levelId, isAutoAssigned
- `CommunityMember` - Community memberships with role (OWNER, MODERATOR, MEMBER)
- `User` - User data with schoolId, fieldOfStudyId, levelId, approvalStatus

---

## Testing

### Example Requests

#### Create a Field
```bash
curl -X POST http://localhost:3000/api/admin/fields \
  -H "Content-Type: application/json" \
  -H "Cookie: admin-session=..." \
  -d '{
    "name": "Computer Science",
    "description": "CS program"
  }'
```

#### Get Students by Field
```bash
curl http://localhost:3000/api/admin/students?fieldId=field-123&page=1&limit=20
```

#### Create a Community
```bash
curl -X POST http://localhost:3000/api/communities \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "name": "AI & Robotics",
    "description": "Join our AI club"
  }'
```

#### Get Registration Fields
```bash
curl http://localhost:3000/api/auth/registration-fields?schoolId=school-123
```

---

## Notes

- All timestamps are ISO 8601 format
- User IDs, field IDs, and level IDs should be passed in request bodies or query parameters
- Pagination defaults to page 1 with limit 10
- Maximum page limit is 100 items per request
- All responses follow the consistent `{success: boolean, data?: T, error?: string}` format

---

## Troubleshooting

### Directory Creation Failed
If automatic setup fails:
1. Manually create directories using your file explorer
2. Copy the TypeScript content from the sections above
3. Create `.ts` files in each directory with the provided content

### Admin Session Issues
- Ensure admin portal is properly configured
- Check that admin session cookies are being sent with requests
- Verify admin account exists in database

### Duplicate Name Errors
- Field and level names must be unique per school (case-insensitive)
- Try renaming fields/levels if you get "already exists" errors

### Community Member Issues
- User must belong to a school to create communities
- Both userId and schoolId must be valid
- Ensure Prisma models are properly synced with database schema

