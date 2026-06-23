# Role Model Mapping

This document maps the UI role names to the database enum values to ensure consistency.

## Database Roles (Prisma Enum)

| DB Value | Description | UI Display Name |
|----------|-------------|-----------------|
| `USER` | Regular student | Student |
| `MODERATOR` | Content moderator | Moderator |
| `ADMIN` | School administrator | Admin |
| `SUPER_ADMIN` | Platform super admin | Super Admin |

## Student Admin Flag

The `isStudentAdmin` boolean field on the `User` model indicates whether a regular `USER` has been granted student admin privileges.

| `role` | `isStudentAdmin` | Effective Permissions | UI Display |
|--------|------------------|----------------------|------------|
| `USER` | `false` | Standard student | Student |
| `USER` | `true` | Student admin (can moderate content, approve events, handle tickets) | Student Admin |
| `ADMIN` | any | Full school admin | Admin |
| `SUPER_ADMIN` | any | Platform-wide admin | Super Admin |

## Permission Matrix

| Action | Student | Student Admin | Admin | Super Admin |
|--------|---------|---------------|-------|--------------|
| Create posts | ✅ | ✅ | ✅ | ✅ |
| Join groups | ✅ | ✅ | ✅ | ✅ |
| Create events | ✅ | ✅ | ✅ | ✅ |
| Approve events | ❌ | ✅ | ✅ | ✅ |
| Handle support tickets | ❌ | ✅ (read-only for HIGH/URGENT) | ✅ | ✅ |
| Moderate content (dismiss/remove) | ❌ | ✅ | ✅ | ✅ |
| Approve user registrations | ❌ | ❌ | ✅ | ✅ |
| Manage school settings | ❌ | ❌ | ✅ | ✅ |
| Manage fields/levels | ❌ | ❌ | ✅ | ✅ |
| Broadcast announcements | ❌ | ❌ | ✅ | ✅ |
| Access Admin Portal | ❌ | ❌ | ✅ | ✅ |
| Manage all schools | ❌ | ❌ | ❌ | ✅ |

## API Route Protection

- **`requireUser()`**: Any authenticated, approved user
- **`requireAdminOrStudentAdmin()`**: Admin or Student Admin only
- **`requireAdminSession()`**: Admin Portal session (school owner)

## Notes

- Student admins are regular `USER` role with `isStudentAdmin: true`
- Admin Portal uses separate `AdminAccount` model with session cookies
- All mutating routes verify session via `requireUser()` and check permissions server-side
- Never trust `userId` from client requests - always verify from session