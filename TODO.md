# TODO (Roadmap)

## Blocking UX (must-do)
- [x] Supabase Storage RLS policies (SQL provided; user ran)
- [x] Fix event modal shake — changed `will-change-transform` to `transform-gpu` in dialog.tsx
- [x] Fix profile autofill from dashUser — added `avatarPreview` prefetch from API
- [x] Replace sidebar mock communities with real data
- [x] Wire Lost & Found report form (UI + backend)

## Core features
- [x] 6. Marketplace brand UI + cart + checkout — Brands section with create/list UI, Cart button
- [x] 7. Community internal groups — API at `/api/communities/[communityId]/groups`, Groups tab on detail page
- [x] 8. Event approval status visible to creator — Badge on event detail + events list, real data fetch
- [x] 9. Student-admin announcements tab — Fetches/publishes announcements via `/api/announcements`
- [x] 10. Admin analytics with real data — Connects to `/api/admin/users`, `/api/posts`, `/api/moderation/flags`, `/api/support`

## Summary of changes
### Dialog shake fix
- `src/components/ui/dialog.tsx`: `will-change-transform` → `transform-gpu`

### Profile autofill
- `src/app/(auth)/onboarding/page.tsx`: Added `avatarPreview` prefetch from user API

### Marketplace brands
- `src/app/main/marketplace/page.tsx`: Added Brands section with create dialog, list grid, cart button

### Community groups
- `src/app/api/communities/[communityId]/groups/route.ts`: New API with GET/POST for CommunityGroup
- `src/app/main/communities/[communityId]/page.tsx`: Added Posts/Groups tabs, create group dialog

### Event approval status
- `src/app/main/events/[id]/page.tsx`: Replaced mock data with real `/api/events/{id}` fetch, approval badge
- `src/app/main/events/page.tsx`: Added `approvalStatus` to EventItem mapping
- `src/components/events/event-card.tsx`: Added `organizerId` and `approvalStatus` props

### Student-admin announcements
- `src/app/main/student-admin/page.tsx`: Added Announcements tab with create dialog, imports for Dialog/Input/Label/Textarea/Select

### Admin analytics
- `src/app/main/admin/page.tsx`: Connected stats to real API calls, loading state