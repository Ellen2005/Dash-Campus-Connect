# Dash Campus Connect - System Architecture Documentation

## Overview

Dash is a comprehensive campus social network platform built with Next.js 15, Prisma ORM, PostgreSQL, and Supabase. It provides students with a unified platform for social interaction, marketplace transactions, event management, academic communities, and administrative support.

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │  Mobile PWA │  │  Admin      │  │  Student    │        │
│  │  (Next.js)  │  │             │  │  Portal     │  │  Onboarding │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          └─────────────────┴─────────────────┴─────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Next.js API Routes                                │    │
│  │  /api/users      /api/posts      /api/events      /api/marketplace   │    │
│  │  /api/groups     /api/communities /api/support    /api/admin         │    │
│  │  /api/notifications /api/messages /api/moderation /api/cart          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Prisma    │  │ PostgreSQL  │  │  Supabase   │  │   Storage   │        │
│  │    ORM      │  │  (Primary)  │  │   (Auth)    │  │  (Buckets)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema (ER Diagram)

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      User        │     │     School       │     │   FieldOfStudy   │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ email            │     │ name             │     │ name             │
│ password         │◄────│ country          │◄────│ schoolId (FK)    │
│ name             │     │ allowedDomain    │     │ description      │
│ username         │     │ requireApproval  │     └──────────────────┘
│ bio              │     └──────────────────┘              │
│ profilePhoto     │               │                       │
│ schoolId (FK)    │               │                       │
│ fieldOfStudyId   │               │                       │
│ levelId (FK)     │               │                       │
│ role             │               │                       │
│ approvalStatus   │               │                       │
│ isStudentAdmin   │               │                       │
└──────────────────┘               │                       │
        │                          │                       │
        │         ┌────────────────┘                       │
        │         │                                        │
        │         ▼                                        │
        │  ┌──────────────────┐                           │
        │  │      Level       │                           │
        │  ├──────────────────┤                           │
        │  │ id (PK)          │                           │
        │  │ name             │                           │
        │  │ order            │                           │
        │  │ schoolId (FK)    │◄──────────────────────────┘
        │  └──────────────────┘
        │
        │  ┌──────────────────┐     ┌──────────────────┐
        │  │      Post        │     │     Comment      │
        │  ├──────────────────┤     ├──────────────────┤
        │  │ id (PK)          │     │ id (PK)          │
        │  │ content          │     │ content          │
        │  │ authorId (FK)    │     │ authorId (FK)    │
        │  │ images           │     │ postId (FK)      │
        │  │ video            │     │ parentCommentId  │
        │  │ isPoll           │     └──────────────────┘
        │  │ location         │
        │  │ likes            │     ┌──────────────────┐
        │  │ comments         │     │       Like       │
        │  │ isFlagged        │     ├──────────────────┤
        │  └──────────────────┘     │ id (PK)          │
        │                           │ user (FK)        │
        │                           │ post (FK)        │
        │                           │ reaction         │
        │                           └──────────────────┘
        │
        │  ┌──────────────────┐     ┌──────────────────┐
        │  │     Event        │     │  EventAttendee   │
        │  ├──────────────────┤     ├──────────────────┤
        │  │ id (PK)          │     │ id (PK)          │
        │  │ title            │     │ user (FK)        │
        │  │ description      │     │ event (FK)       │
        │  │ date             │     │ status (RSVP)    │
        │  │ location         │     │ checkedIn        │
        │  │ capacity         │     └──────────────────┘
        │  │ organizer (FK)   │
        │  │ approvalStatus   │     ┌──────────────────┐
        │  │ isFree           │     │      Group       │
        │  │ ticketPrice      │     ├──────────────────┤
        │  │ qrCheckIn        │     │ id (PK)          │
        │  └──────────────────┘     │ name             │
        │                           │ description      │
        │                           │ type             │
        │                           │ creator (FK)     │
        │                           │ isPublic         │
        │                           └──────────────────┘
        │
        │  ┌──────────────────┐     ┌──────────────────┐
        │  │    Community     │     │ CommunityMember  │
        │  ├──────────────────┤     ├──────────────────┤
        │  │ id (PK)          │     │ id (PK)          │
        │  │ name             │     │ user (FK)        │
        │  │ type             │     │ community (FK)   │
        │  │ school (FK)      │     │ role             │
        │  │ fieldOfStudy(FK) │     └──────────────────┘
        │  │ level (FK)       │
        │  │ isAutoAssigned   │     ┌──────────────────┐
        │  └──────────────────┘     │  CommunityPost   │
        │                           ├──────────────────┤
        │                           │ id (PK)          │
        │                           │ content          │
        │                           │ community (FK)   │
        │                           └──────────────────┘
        │
        │  ┌──────────────────┐     ┌──────────────────┐
        │  │ MarketplaceList. │     │     Brand        │
        │  ├──────────────────┤     ├──────────────────┤
        │  │ id (PK)          │     │ id (PK)          │
        │  │ title            │     │ name             │
        │  │ description      │     │ logo             │
        │  │ seller (FK)      │     │ seller (FK)      │
        │  │ brand (FK)       │     └──────────────────┘
        │  │ category         │
        │  │ condition        │     ┌──────────────────┐
        │  │ price            │     │ ShoppingCart     │
        │  │ images           │     ├──────────────────┤
        │  │ status           │     │ id (PK)          │
        │  │ isFlagged        │     │ user (FK)        │
        │  └──────────────────┘     │ items            │
        │                           └──────────────────┘
        │
        │  ┌──────────────────┐     ┌──────────────────┐
        │  │      Order       │     │    OrderItem     │
        │  ├──────────────────┤     ├──────────────────┤
        │  │ id (PK)          │     │ id (PK)          │
        │  │ buyer (FK)       │     │ order (FK)       │
        │  │ totalPrice       │     │ listing (FK)     │
        │  │ status           │     │ quantity         │
        │  │ paymentMethod    │     │ pricePerUnit     │
        │  │ paymentStatus    │     └──────────────────┘
        │  └──────────────────┘
        │
        │  ┌──────────────────┐     ┌──────────────────┐
        │  │  SupportTicket   │     │  TicketMessage   │
        │  ├──────────────────┤     ├──────────────────┤
        │  │ id (PK)          │     │ id (PK)          │
        │  │ user (FK)        │     │ ticket (FK)      │
        │  │ title            │     │ content          │
        │  │ description      │     │ attachments      │
        │  │ category         │     └──────────────────┘
        │  │ priority         │
        │  │ status           │     ┌──────────────────┐
        │  └──────────────────┘     │   Notification   │
        │                           ├──────────────────┤
        │                           │ id (PK)          │
        │                           │ userId           │
        │                           │ type             │
        │                           │ title            │
        │                           │ message          │
        │                           │ isRead           │
        │                           └──────────────────┘
        │
        │  ┌──────────────────┐     ┌──────────────────┐
        │  │     Message      │     │    ChatGroup     │
        │  ├──────────────────┤     ├──────────────────┤
        │  │ id (PK)          │     │ id (PK)          │
        │  │ content          │     │ name             │
        │  │ sender (FK)      │     │ members          │
        │  │ recipient        │     │ messages         │
        │  │ chatGroup (FK)   │     └──────────────────┘
        │  │ images           │
        │  │ isRead           │     ┌──────────────────┐
        │  └──────────────────┘     │ AdminChatMessage │
        │                           ├──────────────────┤
        │                           │ id (PK)          │
        │                           │ chatGroup (FK)   │
        │                           │ sender (FK)      │
        │                           │ content          │
        │                           └──────────────────┘
        └─────────────────────────────────────────────────────────────────────
```

## API Endpoints Reference

### Authentication & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/users/sync` | Sync user profile from auth provider |
| GET | `/api/users/[id]` | Get user profile |
| PUT | `/api/users/[id]` | Update user profile |
| GET | `/api/admin/users` | List all users (admin) |

### Posts & Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get feed posts |
| POST | `/api/posts` | Create new post |
| GET | `/api/posts/[id]` | Get single post |
| PUT | `/api/posts/[id]` | Update post |
| DELETE | `/api/posts/[id]` | Delete post |
| POST | `/api/posts/[id]/like` | Like a post |
| POST | `/api/posts/[id]/comment` | Comment on post |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events |
| POST | `/api/events` | Create event |
| GET | `/api/events/[id]` | Get event details |
| PUT | `/api/events/[id]` | Update event |
| POST | `/api/events/[id]/rsvp` | RSVP to event |
| GET | `/api/events/[id]/attendees` | Get attendees list |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace` | List listings |
| POST | `/api/marketplace` | Create listing |
| GET | `/api/marketplace/[id]` | Get listing details |
| PUT | `/api/marketplace/[id]` | Update listing |
| DELETE | `/api/marketplace/[id]` | Delete listing |
| GET | `/api/cart` | Get shopping cart |
| POST | `/api/cart/items` | Add item to cart |
| POST | `/api/orders` | Create order |

### Communities & Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/communities` | List communities |
| POST | `/api/communities` | Create community |
| GET | `/api/communities/[id]` | Get community details |
| GET | `/api/communities/[id]/posts` | Get community posts |
| POST | `/api/communities/[id]/posts` | Create community post |
| GET | `/api/groups` | List groups |
| POST | `/api/groups` | Create group |
| GET | `/api/groups/[id]` | Get group details |

### Support & Moderation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/support` | List support tickets |
| POST | `/api/support` | Create support ticket |
| GET | `/api/moderation/flags` | List moderation flags |
| POST | `/api/moderation/flags` | Flag content |
| GET | `/api/notifications` | Get user notifications |

## Component Architecture

### Frontend Component Hierarchy

```
App
├── Layout
│   ├── Navbar
│   ├── Sidebar (Discord-style)
│   └── RightSidebar (Trending/Suggested)
├── Pages
│   ├── /main (Feed)
│   │   ├── PostCard
│   │   ├── CreatePost
│   │   └── StoryRail
│   ├── /main/profile/[id]
│   │   ├── ProfileHeader
│   │   ├── ProfileTabs
│   │   └── ProfilePosts
│   ├── /main/events
│   │   ├── EventCard
│   │   ├── EventFilters
│   │   └── EventDetail ([id])
│   ├── /main/marketplace
│   │   ├── ListingCard
│   │   ├── MarketplaceFilters
│   │   ├── CartDrawer
│   │   └── Checkout
│   ├── /main/communities
│   │   ├── CommunityCard
│   │   ├── CommunityFeed
│   │   └── CommunityDetail
│   ├── /main/groups
│   │   ├── GroupCard
│   │   ├── GroupDetail
│   │   └── GroupChat
│   ├── /main/messages
│   │   ├── ConversationList
│   │   ├── ChatWindow
│   │   └── MessageBubble
│   ├── /main/notifications
│   │   └── NotificationItem
│   ├── /main/support
│   │   ├── TicketForm
│   │   └── TicketList
│   ├── /main/lost-found
│   │   ├── LostFoundItem
│   │   ├── ReportForm
│   │   └── ContactDialog
│   ├── /main/admin
│   │   ├── Dashboard
│   │   ├── Announcements
│   │   ├── UserManagement
│   │   └── Analytics
│   └── /main/admin/announcements
│       └── BroadcastForm
└── Shared Components
    ├── Button
    ├── Card
    ├── Dialog
    ├── Avatar
    ├── Badge
    ├── Input
    ├── Tabs
    └── Toast
```

## Data Flow Diagrams

### User Registration & Onboarding Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Sign Up │────►│ Supabase │────►│  Create  │────►│ Onboard  │
│  Form    │     │   Auth   │     │  User    │     │  Page    │
└──────────┘     └──────────┘     │  Record  │     └──────────┘
                                   └──────────┘
                                         │
                                         ▼
                                   ┌──────────┐
                                   │  Sync    │
                                   │  Profile │
                                   │  to DB   │
                                   └──────────┘
```

### Post Creation & Feed Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Create   │────►│ Validate │────►│  Save to │────►│ Update   │
│ Post     │     │ Content  │     │  DB      │     │ Feed      │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### Event RSVP Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Click   │────►│ Check    │────►│  Create  │────►│ Update   │
│  RSVP    │     │ Capacity │     │ Attendee │     │ UI State │
└──────────┘     └──────────┘     │  Record  │     └──────────┘
                                   └──────────┘
```

### Marketplace Purchase Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Add to  │────►│  Update  │────►│ Checkout │────►│ Process  │
│  Cart    │     │  Cart    │     │  Page    │     │ Payment  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                              │
                                                              ▼
                                                        ┌──────────┐
                                                        │ Create   │
                                                        │ Order    │
                                                        │ Record   │
                                                        └──────────┘
```

## Security Considerations

### Authentication
- Supabase Auth for user authentication
- JWT tokens for session management
- Row Level Security (RLS) policies on all tables

### Authorization
- Role-based access control (USER, MODERATOR, ADMIN, SUPER_ADMIN)
- Student admin flag for campus-specific moderation
- School-based isolation for multi-tenant support

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS prevention via React's built-in escaping

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel / Cloudflare                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Next.js Application                       ││
│  │  - Server-side rendering                                     ││
│  │  - API routes                                                ││
│  │  - Static assets (CDN)                                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase / PostgreSQL                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Primary Database                          ││
│  │  - User data                                                 ││
│  │  - Content (posts, comments, events)                         ││
│  │  - Transactions (orders, cart)                               ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Supabase Storage                          ││
│  │  - User avatars                                              ││
│  │  - Post images                                               ││
│  │  - Event banners                                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| UI Components | shadcn/ui, Tailwind CSS |
| State Management | React Context, SWR |
| Backend | Next.js API Routes |
| Database | PostgreSQL 15 |
| ORM | Prisma 7 |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| Real-time | Supabase Realtime |
| Deployment | Vercel |

## Class Diagrams

### User Management Classes

```typescript
// User Entity
class User {
  id: string
  email: string
  name: string
  username: string
  profilePhoto?: string
  school?: School
  fieldOfStudy?: FieldOfStudy
  level?: Level
  role: Role
  approvalStatus: ApprovalStatus
  isStudentAdmin: boolean
  
  // Methods
  getFullName(): string
  getAcademicInfo(): { field: string, level: string }
  hasPermission(permission: string): boolean
}

enum Role {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}
```

### Content Classes

```typescript
class Post {
  id: string
  content: string
  author: User
  images: string[]
  video?: string
  isPoll: boolean
  pollOptions: PollOption[]
  likes: Like[]
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
  
  // Methods
  addLike(user: User, reaction: string): Like
  addComment(user: User, content: string): Comment
  toggleFlag(reason: string): void
}

class Event {
  id: string
  title: string
  description?: string
  date: Date
  location: string
  capacity?: number
  organizer: User
  attendees: EventAttendee[]
  approvalStatus: EventApprovalStatus
  qrCheckIn?: string
  
  // Methods
  rsvp(user: User, status: RSVPStatus): EventAttendee
  getAvailableSpots(): number
  generateQRCode(): string
}

class MarketplaceListing {
  id: string
  title: string
  description: string
  seller: User
  brand?: Brand
  category: MarketplaceCategory
  condition: Condition
  price?: number
  images: string[]
  status: ListingStatus
  
  // Methods
  addToCart(user: User, quantity: number): CartItem
  markAsSold(): void
  flagContent(reason: string): ModeratorFlag
}
```

## Sequence Diagrams

### User Login Sequence

```
User          Frontend         API            Database        Supabase
 │               │              │                │                │
 │──Login Form──>│              │                │                │
 │               │──POST /login─>│                │                │
 │               │              │──Verify Creds──>│                │
 │               │              │<──User Data─────│                │
 │               │              │                │                │
 │               │              │<──JWT Token────────────────────│
 │               │<──Set Session│                │                │
 │               │              │                │                │
 │<──Redirect────│              │                │                │
 │   to /main    │              │                │                │
```

### Create Post Sequence

```
User          Frontend         API            Database
 │               │              │                │
 │──Create Post─>│              │                │
 │               │──Validate────>│                │
 │               │<──OK──────────│                │
 │               │              │                │
 │               │──POST /posts─>│                │
 │               │              │──INSERT Post──>│
 │               │              │<──Post Data────│
 │               │<──Post Created│                │
 │               │              │                │
 │<──Update Feed──│              │                │
```

## Conclusion

This documentation provides a comprehensive overview of the Dash Campus Connect platform architecture. The system is designed to be scalable, secure, and maintainable, with clear separation of concerns between the frontend, API layer, and data layer.