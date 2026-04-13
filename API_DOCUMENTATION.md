# Dash Platform - Complete API Documentation

## 📋 Overview

This document provides comprehensive documentation for all implemented APIs in the Dash platform. The backend is built with **Next.js API Routes**, **Prisma ORM**, **PostgreSQL (Supabase)**, and **TypeScript**.

---

## 🔐 Authentication

### Register User
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securepass123",
  "name": "John Doe",
  "major": "Computer Science",
  "year": "2026",
  "interests": ["coding", "gaming"],
  "bio": "CS student passionate about AI"
}
```

**Response (201):**
```json
{
  "id": "user-uuid",
  "email": "student@university.edu",
  "name": "John Doe",
  "username": "johndoe",
  "profilePhoto": null,
  "bio": "CS student passionate about AI",
  "major": "Computer Science",
  "year": "2026",
  "interests": ["coding", "gaming"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400` - Invalid input or email already exists
- `500` - Server error

---

### Login User
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "student@university.edu",
    "name": "John Doe",
    "username": "johndoe"
  },
  "session": {
    "access_token": "jwt-token-here",
    "expires_in": 3600
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `404` - User not found
- `500` - Server error

---

## 👥 User Management

### Get User Profile
**Endpoint:** `GET /api/users/:userId`

**Response (200):**
```json
{
  "id": "user-uuid",
  "name": "John Doe",
  "username": "johndoe",
  "email": "student@university.edu",
  "bio": "CS student",
  "profilePhoto": "https://storage.url/photo.jpg",
  "major": "Computer Science",
  "year": "2026",
  "interests": ["coding", "gaming"],
  "followers": 45,
  "following": 32,
  "totalPosts": 12,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Update User Profile
**Endpoint:** `PATCH /api/users/:userId`

**Auth Required:** Yes (must be authenticated user)

**Request Body:**
```json
{
  "name": "John Updated",
  "bio": "Updated bio here",
  "profilePhoto": "https://new-photo-url.jpg",
  "major": "Data Science",
  "interests": ["AI", "ML"]
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { /* updated user object */ }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Cannot update other user's profile
- `404` - User not found

---

### Follow User
**Endpoint:** `POST /api/users/:userId/follow`

**Auth Required:** Yes

**Request Body:**
```json
{
  "followerId": "current-user-id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Now following John Doe",
  "isFollowing": true
}
```

---

### Get User Followers
**Endpoint:** `GET /api/users/:userId/followers?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Response (200):**
```json
{
  "followers": [
    {
      "id": "follower-id",
      "name": "Jane Smith",
      "username": "janesmith",
      "profilePhoto": "https://..."
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

### Get Users Following
**Endpoint:** `GET /api/users/:userId/following?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Response (200):**
```json
{
  "following": [
    {
      "id": "user-id",
      "name": "Tech Guru",
      "username": "techguru",
      "profilePhoto": "https://..."
    }
  ],
  "pagination": {
    "total": 32,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

---

## 📝 Posts & Feed

### Get Posts (Feed)
**Endpoint:** `GET /api/posts?page=1&limit=10&audience=EVERYONE&departmentFilter=Computer%20Science`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10
- `audience` (optional): EVERYONE, DEPARTMENT, FRIENDS
- `departmentFilter` (optional): Filter by department

**Response (200):**
```json
{
  "posts": [
    {
      "id": "post-id",
      "content": "Hello Dash community!",
      "author": {
        "id": "user-id",
        "name": "John Doe",
        "username": "johndoe",
        "profilePhoto": "https://..."
      },
      "audience": "EVERYONE",
      "likes": [
        {
          "userId": "user-2",
          "reaction": "👍"
        }
      ],
      "comments": 5,
      "likes": 23,
      "shares": 2,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 245,
    "page": 1,
    "limit": 10,
    "pages": 25
  }
}
```

---

### Create Post
**Endpoint:** `POST /api/posts`

**Auth Required:** Yes

**Request Body:**
```json
{
  "content": "Just finished my CS project!",
  "authorId": "user-uuid",
  "audience": "EVERYONE"
}
```

**Response (201):**
```json
{
  "id": "new-post-id",
  "content": "Just finished my CS project!",
  "authorId": "user-uuid",
  "audience": "EVERYONE",
  "likes": [],
  "createdAt": "2024-01-15T11:30:00Z"
}
```

---

### Like Post
**Endpoint:** `POST /api/posts/:postId/like`

**Auth Required:** Yes

**Request Body:**
```json
{
  "userId": "user-uuid",
  "reaction": "👍"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Post liked",
  "totalLikes": 24
}
```

**Error Responses:**
- `409` - Already liked (toggle with same reaction)
- `404` - Post not found

---

### Get Post Comments
**Endpoint:** `GET /api/posts/:postId/comments?page=1&limit=10`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "comments": [
    {
      "id": "comment-id",
      "content": "Amazing work!",
      "author": {
        "id": "user-id",
        "name": "Jane Smith",
        "profilePhoto": "https://..."
      },
      "likes": 3,
      "createdAt": "2024-01-15T10:45:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1
  }
}
```

---

### Add Comment to Post
**Endpoint:** `POST /api/posts/:postId/comments`

**Auth Required:** Yes

**Request Body:**
```json
{
  "authorId": "user-uuid",
  "content": "This is awesome!"
}
```

**Response (201):**
```json
{
  "id": "comment-id",
  "content": "This is awesome!",
  "postId": "post-id",
  "author": {
    "id": "user-id",
    "name": "Your Name",
    "profilePhoto": "https://..."
  },
  "likes": 0,
  "createdAt": "2024-01-15T12:00:00Z"
}
```

---

## 🎪 Events

### Get Events
**Endpoint:** `GET /api/events?page=1&limit=10&category=ACADEMIC&searchQuery=Hackathon&upcoming=true`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `category` (optional): ACADEMIC, SOCIAL, CAREER, SPORTS, HEALTH, OTHER
- `searchQuery` (optional): Search by title
- `upcoming` (optional): Filter upcoming events (true/false)
- `date` (optional): Filter by specific date

**Response (200):**
```json
{
  "events": [
    {
      "id": "event-id",
      "title": "Campus Hackathon 2024",
      "description": "24-hour coding competition",
      "date": "2024-02-15T10:00:00Z",
      "endDate": "2024-02-16T10:00:00Z",
      "location": "Computer Science Building",
      "category": "ACADEMIC",
      "capacity": 100,
      "attendeeCount": 45,
      "organizer": {
        "id": "user-id",
        "name": "CS Club",
        "profilePhoto": "https://..."
      },
      "image": "https://storage.url/event-banner.jpg",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 23,
    "page": 1,
    "pages": 3
  }
}
```

---

### Create Event
**Endpoint:** `POST /api/events`

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Campus Hackathon",
  "description": "24-hour coding competition for all students",
  "date": "2024-02-15T10:00:00Z",
  "endDate": "2024-02-16T10:00:00Z",
  "location": "Computer Science Building",
  "category": "ACADEMIC",
  "capacity": 100,
  "organizerId": "user-uuid",
  "image": "https://storage.url/image.jpg"
}
```

**Response (201):**
```json
{
  "id": "new-event-id",
  "title": "Campus Hackathon",
  "description": "24-hour coding competition",
  "date": "2024-02-15T10:00:00Z",
  "location": "Computer Science Building",
  "category": "ACADEMIC",
  "capacity": 100,
  "attendeeCount": 0,
  "createdAt": "2024-01-15T12:00:00Z"
}
```

---

### Get Event Details
**Endpoint:** `GET /api/events/:eventId`

**Response (200):**
```json
{
  "id": "event-id",
  "title": "Campus Hackathon",
  "description": "24-hour competition",
  "date": "2024-02-15T10:00:00Z",
  "location": "CS Building",
  "category": "ACADEMIC",
  "capacity": 100,
  "attendeeCount": 45,
  "organizer": {
    "id": "user-id",
    "name": "CS Club",
    "profilePhoto": "https://..."
  },
  "attendees": [
    {
      "id": "attendee-id",
      "name": "John Doe",
      "status": "GOING",
      "joinedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### RSVP to Event
**Endpoint:** `POST /api/events/:eventId/rsvp`

**Auth Required:** Yes

**Request Body:**
```json
{
  "userId": "user-uuid",
  "status": "GOING"
}
```

**Status Options:** `GOING`, `INTERESTED`, `MAYBE`

**Response (200):**
```json
{
  "success": true,
  "message": "RSVP recorded",
  "rsvp": {
    "status": "GOING",
    "event": {
      "id": "event-id",
      "title": "Campus Hackathon"
    },
    "joinedAt": "2024-01-15T12:30:00Z"
  }
}
```

---

### Check-in to Event
**Endpoint:** `POST /api/events/:eventId/checkin`

**Auth Required:** Yes

**Request Body:**
```json
{
  "userId": "user-uuid",
  "qrCode": "event-qr-code-data"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Checked in successfully",
  "attendee": {
    "id": "user-id",
    "name": "John Doe",
    "checkedInAt": "2024-02-15T10:15:00Z"
  }
}
```

---

## 🛒 Marketplace

### Get Marketplace Listings
**Endpoint:** `GET /api/marketplace?page=1&limit=10&category=TEXTBOOKS&condition=LIKE_NEW&minPrice=0&maxPrice=500&searchQuery=Calculus`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `category` (optional): TEXTBOOKS, ELECTRONICS, FURNITURE, CLOTHING, OTHER
- `condition` (optional): NEW, LIKE_NEW, GOOD, FAIR
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `searchQuery` (optional): Search by title/description

**Response (200):**
```json
{
  "listings": [
    {
      "id": "listing-id",
      "title": "Calculus Textbook",
      "description": "Like new, used for one semester",
      "price": 50.00,
      "category": "TEXTBOOKS",
      "condition": "LIKE_NEW",
      "seller": {
        "id": "user-id",
        "name": "Jane Smith",
        "profilePhoto": "https://...",
        "rating": 4.8,
        "reviewCount": 12
      },
      "image": "https://storage.url/textbook.jpg",
      "status": "AVAILABLE",
      "createdAt": "2024-01-10T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "pages": 16
  }
}
```

---

### Create Marketplace Listing
**Endpoint:** `POST /api/marketplace`

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Calculus Textbook",
  "description": "Like new, used for one semester",
  "price": 50.00,
  "sellerId": "user-uuid",
  "category": "TEXTBOOKS",
  "condition": "LIKE_NEW",
  "image": "https://storage.url/image.jpg"
}
```

**Response (201):**
```json
{
  "id": "new-listing-id",
  "title": "Calculus Textbook",
  "price": 50.00,
  "category": "TEXTBOOKS",
  "status": "AVAILABLE",
  "createdAt": "2024-01-15T12:00:00Z"
}
```

---

### Get Listing Details
**Endpoint:** `GET /api/marketplace/:listingId`

**Response (200):**
```json
{
  "id": "listing-id",
  "title": "Calculus Textbook",
  "description": "Like new, used for one semester",
  "price": 50.00,
  "category": "TEXTBOOKS",
  "condition": "LIKE_NEW",
  "seller": {
    "id": "user-id",
    "name": "Jane Smith",
    "email": "jane@university.edu",
    "profilePhoto": "https://...",
    "rating": 4.8,
    "reviewCount": 12
  },
  "image": "https://storage.url/textbook.jpg",
  "status": "AVAILABLE",
  "reviews": [
    {
      "id": "review-id",
      "buyerName": "John Doe",
      "rating": 5,
      "comment": "Great condition!",
      "createdAt": "2024-01-12T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-10T10:30:00Z"
}
```

---

### Update Listing
**Endpoint:** `PATCH /api/marketplace/:listingId`

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "Updated title",
  "price": 45.00,
  "status": "AVAILABLE"
}
```

**Response (200):**
```json
{
  "success": true,
  "listing": { /* updated listing */ }
}
```

---

### Delete Listing
**Endpoint:** `DELETE /api/marketplace/:listingId`

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Listing deleted"
}
```

---

## 👨‍👩‍👧‍👦 Groups & Communities

### Get Groups
**Endpoint:** `GET /api/groups?page=1&limit=10&type=STUDENT_CREATED&department=Computer%20Science&searchQuery=Study`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): DEPARTMENT, YEAR, OFFICIAL, STUDENT_CREATED
- `department` (optional): Filter by department
- `searchQuery` (optional): Search by name

**Response (200):**
```json
{
  "groups": [
    {
      "id": "group-id",
      "name": "Computer Science Study Group",
      "description": "Weekly study sessions",
      "type": "STUDENT_CREATED",
      "department": "Computer Science",
      "memberCount": 45,
      "creator": {
        "id": "user-id",
        "name": "Jane Smith",
        "profilePhoto": "https://..."
      },
      "icon": "https://storage.url/icon.jpg",
      "createdAt": "2024-01-01T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 67,
    "page": 1,
    "pages": 7
  }
}
```

---

### Create Group
**Endpoint:** `POST /api/groups`

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Computer Science Study Group",
  "description": "Weekly study sessions for CS majors",
  "type": "STUDENT_CREATED",
  "department": "Computer Science",
  "creatorId": "user-uuid",
  "icon": "https://storage.url/icon.jpg"
}
```

**Response (201):**
```json
{
  "id": "new-group-id",
  "name": "Computer Science Study Group",
  "description": "Weekly study sessions",
  "type": "STUDENT_CREATED",
  "memberCount": 1,
  "createdAt": "2024-01-15T12:00:00Z"
}
```

---

### Get Group Details
**Endpoint:** `GET /api/groups/:groupId`

**Response (200):**
```json
{
  "id": "group-id",
  "name": "Computer Science Study Group",
  "description": "Weekly study sessions",
  "type": "STUDENT_CREATED",
  "department": "Computer Science",
  "memberCount": 45,
  "creator": {
    "id": "user-id",
    "name": "Jane Smith",
    "profilePhoto": "https://..."
  },
  "members": [
    {
      "id": "member-id",
      "name": "John Doe",
      "profilePhoto": "https://...",
      "joinedAt": "2024-01-05T10:30:00Z"
    }
  ],
  "posts": [
    {
      "id": "post-id",
      "content": "Group announcement",
      "author": { /* user object */ },
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ],
  "createdAt": "2024-01-01T10:30:00Z"
}
```

---

### Join Group
**Endpoint:** `POST /api/groups/:groupId/join`

**Auth Required:** Yes

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Joined group",
  "user": {
    "name": "John Doe",
    "id": "user-id",
    "profilePhoto": "https://..."
  },
  "group": {
    "id": "group-id",
    "name": "CS Study Group"
  }
}
```

---

### Leave Group
**Endpoint:** `POST /api/groups/:groupId/leave`

**Auth Required:** Yes

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Left group"
}
```

---

## 💬 Messaging & Chat

### Get Conversations
**Endpoint:** `GET /api/messages?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `userId` (required in header or body): Current user ID

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "conversation-id",
      "type": "DIRECT",
      "participants": [
        {
          "id": "user-id-1",
          "name": "John Doe",
          "profilePhoto": "https://..."
        },
        {
          "id": "user-id-2",
          "name": "Jane Smith",
          "profilePhoto": "https://..."
        }
      ],
      "lastMessage": {
        "content": "Hey, how are you?",
        "sender": "user-id-1",
        "createdAt": "2024-01-15T15:30:00Z"
      },
      "unreadCount": 2,
      "updatedAt": "2024-01-15T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pages": 1
  }
}
```

---

### Send Message
**Endpoint:** `POST /api/messages`

**Auth Required:** Yes

**Request Body (Direct Message):**
```json
{
  "senderId": "user-uuid",
  "recipientId": "other-user-id",
  "content": "Hey, want to study together?"
}
```

**Request Body (Group Message):**
```json
{
  "senderId": "user-uuid",
  "groupId": "group-id",
  "content": "Group announcement"
}
```

**Response (201):**
```json
{
  "id": "message-id",
  "conversationId": "conversation-id",
  "content": "Hey, want to study together?",
  "sender": {
    "id": "user-id",
    "name": "John Doe",
    "profilePhoto": "https://..."
  },
  "type": "DIRECT",
  "createdAt": "2024-01-15T16:00:00Z"
}
```

---

### Get Conversation Messages
**Endpoint:** `GET /api/messages/:conversationId?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `userId` (required): Current user ID to validate access

**Response (200):**
```json
{
  "messages": [
    {
      "id": "message-id",
      "content": "Hey!",
      "sender": {
        "id": "user-id",
        "name": "John Doe",
        "profilePhoto": "https://..."
      },
      "createdAt": "2024-01-15T15:30:00Z"
    },
    {
      "id": "message-id-2",
      "content": "Hi there!",
      "sender": {
        "id": "other-user-id",
        "name": "Jane Smith",
        "profilePhoto": "https://..."
      },
      "createdAt": "2024-01-15T15:31:00Z"
    }
  ],
  "conversation": {
    "id": "conversation-id",
    "type": "DIRECT",
    "participants": [
      { /* participant data */ }
    ]
  },
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 5
  }
}
```

---

## 🔄 API Status Codes

### Success Codes
- `200` - OK (successful GET, PATCH, DELETE)
- `201` - Created (successful POST)
- `204` - No Content

### Client Error Codes
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not allowed)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (already exists or state conflict)
- `422` - Unprocessable Entity (validation error)

### Server Error Codes
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 🔒 Authentication & Security

### Headers Required for Protected Endpoints
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Password Requirements
- Minimum 8 characters
- Must contain uppercase and lowercase letters
- Must contain at least one number
- Must contain at least one special character

### Data Validation
All inputs are validated using **Zod** schema validation. Invalid data returns `422` with error details.

---

## 📱 Rate Limiting

Currently not implemented. Will be added in production deployment with:
- 100 requests per minute for read operations
- 50 requests per minute for write operations
- 20 requests per minute for authentication endpoints

---

## 🚀 Testing the APIs

### Using cURL
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@university.edu", "password": "Test@1234", "name": "Test User"}'

# Get Posts
curl http://localhost:3000/api/posts?page=1&limit=10

# Create Post (requires auth token)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"content": "Test post", "authorId": "user-id", "audience": "EVERYONE"}'
```

### Using Postman
1. Import the API endpoints into Postman
2. Set up environment variables for `BASE_URL` and `AUTH_TOKEN`
3. Create pre-request scripts to handle authentication
4. Test each endpoint with sample data

---

## 📝 Notes

- All timestamps are in ISO 8601 format with UTC timezone
- User IDs and resource IDs are UUIDs
- Pagination uses 1-based page numbering
- All API endpoints are under `/api/` prefix
- Database operations use Prisma ORM for type safety
- All inputs are validated with Zod schemas

---

## 🔗 Related Documentation

- [Database Schema](./docs/blueprint.md)
- [Setup & Running Guide](./SETUP_AND_RUNNING.md)
- [Backend Architecture](./docs/backend.json)

