# Phase 5: Testing Strategy

## 1. Unit Tests (Jest + React Testing Library)

### API Route Tests
- **Auth middleware**: Test `requireUser()` returns 401 without cookie, 200 with valid cookie
- **Posts API**: Test GET returns paginated posts, POST creates with valid data, rejects invalid
- **Events API**: Test GET filters (upcoming/past/today), POST creates with PENDING status
- **Groups API**: Test GET returns public groups, POST requires auth
- **Communities API**: Test GET returns school-scoped communities
- **Notifications API**: Test GET returns user notifications, PATCH marks read, DELETE removes

### Component Tests
- **EventCard**: Renders event data, shows approval badges, handles click
- **StorySection**: Loads stories, create story flow, view story modal
- **ReportDialog**: Opens/closes, submits report with content snapshot
- **AdminChat**: Renders messages, sends new message, polls for updates

## 2. Integration Tests

### API Integration
```typescript
// Example: Post creation flow
test("create post and verify in feed", async () => {
  const post = await createTestPost(authUser, { content: "Test post" });
  const feed = await fetchFeed(authUser);
  expect(feed.posts).toContainEqual(expect.objectContaining({ id: post.id }));
});
```

### Auth Flow
- Sign up → auto-create DB user → redirect to onboarding
- Login → cookie set → API calls succeed
- Logout → cookie cleared → API calls return 401

## 3. E2E Tests (Playwright)

### Critical Paths
1. **Student Registration**: Sign up → fill profile → see feed
2. **Admin Approval**: Admin approves student → student added to communities
3. **Post Creation**: Create post with image → appears in feed
4. **Event Creation**: Create event → appears in events list
5. **Marketplace**: Browse listings → add to cart → checkout
6. **Support**: Create ticket → admin replies → student sees reply

## 4. CI Pipeline (GitHub Actions)

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test -- --coverage
      - run: npm run build
```

## 5. Test Data Factories

Create `src/test/factories.ts` for reusable test data:
- `createTestUser()` - creates user with random data
- `createTestPost()` - creates post with test content
- `createTestEvent()` - creates event with future date
- `createTestGroup()` - creates public group
- `createTestCommunity()` - creates community with members

## 6. Coverage Targets

- **API Routes**: 80%+ coverage
- **Components**: 70%+ coverage
- **Utils/Lib**: 90%+ coverage
- **E2E Critical Paths**: 100% pass rate