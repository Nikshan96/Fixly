# Fixly Teacher Demo Checklist (Local SYP)

Purpose: Quick step-by-step guide for classroom demonstration with exact UI routes, API mappings, and pass criteria.

## 1) Start Application Locally

1. Start backend from project root:
   - npm --prefix backend start
2. Start frontend from project root:
   - npm --prefix frontend run dev
3. Open app:
   - http://localhost:5173
4. Backend health quick check:
   - GET http://localhost:5000/api/health should return status OK.

Pass criteria:
- Frontend loads landing page.
- Backend health returns JSON with status OK.

## 2) Route Guards and Access Logic

### Public routes
- / (Landing)
- /services (Services list)
- /contact
- /login, /register, /forgot-password, /reset-password

### Customer-protected routes
- /my-bookings
- /profile

### Admin-protected routes
- /admin/dashboard
- /admin/jobs
- /admin/technicians
- /admin/hire
- /admin/messages
- /admin/revenue
- /admin/settings

### Technician-protected route
- /technician/dashboard

Pass criteria:
- Not-logged-in user is redirected to login for protected pages.
- Role mismatch redirects to role home page.

## 3) Customer Full Flow

### A) Landing -> Services -> Booking requires login
UI steps:
1. Open landing page.
2. Click Services.
3. Click Book on any service.

Expected behavior:
- If not logged in, booking action redirects to login.

API mapping:
- Services load: GET /api/customer/services
- Booking create (after login only): POST /api/customer/bookings

Pass criteria:
- Unauthorized booking attempt blocked.
- Logged-in customer can proceed with booking form.

### B) Booking form works (with optional image)
UI steps:
1. Login as customer.
2. Open booking form from services.
3. Fill date, time, location, optional description.
4. Optionally upload problem photo.
5. Submit booking.

API mapping:
- Booking submit: POST /api/customer/bookings
  - multipart when photo attached
  - json when no photo

Pass criteria:
- Booking created successfully.
- Booking appears in My Bookings.
- If photo uploaded, My Bookings shows image card from photo_url.

### C) My Bookings status tracking and actions
UI steps:
1. Open /my-bookings.
2. Verify status badge and timeline.
3. Cancel pending/accepted booking if needed.
4. Open Message on assigned booking.

API mapping:
- List bookings: GET /api/customer/bookings
- Cancel booking: PUT /api/customer/bookings/:id/cancel
- Chat conversations: GET /api/messages/conversations
- Chat list for selected conversation: GET /api/messages/conversations/:id/messages
- Send chat message: POST /api/messages/conversations/:id/messages

Pass criteria:
- Timeline reflects booking status.
- Cancel updates booking state.
- Message opens real chat panel and sends message.

### D) Customer profile rule (name permanent)
UI steps:
1. Open /profile.
2. Try changing name (should be read-only).
3. Change email and phone.
4. Change password in password section.

API mapping:
- Update profile: PUT /api/customer/profile
- Change password: PUT /api/customer/change-password

Pass criteria:
- Name remains unchanged.
- Email/phone update works.
- Password change works.

## 4) Technician Full Flow

UI steps:
1. Login as technician.
2. Open /technician/dashboard.
3. Verify tabs: Jobs, Earnings, Profile, Notifications.
4. Accept available job.
5. Start accepted job.
6. Complete in-progress job.
7. Edit profile fields.
8. Mark notification read.

API mapping:
- Dashboard stats: GET /api/technician/dashboard
- Available jobs: GET /api/technician/jobs/available
- My jobs: GET /api/technician/jobs/my
- Complete jobs history: GET /api/technician/jobs/completed
- Accept job: POST /api/technician/jobs/:id/accept
- Start job: POST /api/technician/jobs/:id/start
- Complete job: POST /api/technician/jobs/:id/complete
- Earnings: GET /api/technician/earnings
- Profile get/update: GET/PUT /api/technician/profile
- Notifications: GET /api/technician/notifications
- Mark read: PUT /api/technician/notifications/:id/read

Pass criteria:
- Technician dashboard loads without server error.
- Job lifecycle actions update correctly.
- Earnings/profile/notifications sections are functional.

## 5) Admin Full Flow

UI steps:
1. Login as admin.
2. Open /admin/dashboard, /admin/jobs, /admin/technicians, /admin/hire.
3. Open /admin/messages and send message in selected conversation.
4. Open /admin/revenue and /admin/settings.
5. Open review-related screens if present in your menu integration.

API mapping:
- Dashboard stats: GET /api/admin/stats
- Bookings list and updates: GET/PUT /api/admin/bookings, /api/admin/bookings/:id, /api/admin/bookings/:id/status
- Technicians list/create/status: GET/POST/PUT /api/admin/technicians...
- Revenue: GET /api/admin/revenue and /api/admin/revenue/monthly
- Messages conversations: GET /api/messages/conversations
- Messages thread: GET /api/messages/conversations/:id/messages
- Send message: POST /api/messages/conversations/:id/messages
- Reviews: GET /api/admin/reviews
- Admin profile/password: PUT /api/admin/profile, PUT /api/admin/change-password

Pass criteria:
- Admin pages load without crash.
- Reviews endpoint no longer throws alias error.
- Messages page uses real API data (no mock list).

## 6) Realtime (Socket.IO) Demonstration

What to demo:
1. Keep customer session open on My Bookings or notifications area.
2. In technician session, accept customer booking.
3. Customer should receive realtime notification event.
4. Open admin/customer messages and send message.
5. Other role receives realtime chat update in same conversation room.

Realtime wiring summary:
- Server initializes Socket.IO with JWT auth.
- Rooms used:
  - user_<id>
  - role_<role>
  - conversation_<conversationId>
- Events used:
  - notification:new
  - chat:message
  - conversation:join
  - conversation:typing
  - conversation:stop-typing

Pass criteria:
- Notification appears without manual refresh after key events (for supported surfaces).
- Chat messages appear in active conversation room.

## 7) Known Non-P0 Items (Explain to Teacher if asked)

1. Contact page submit persistence is still not backend-wired.
2. SMTP in local may fail unless mail credentials/server are configured.
3. Legacy /api/chat/unread-count route is separate from new shared conversation routes.

## 8) Quick Demo Script (5-8 minutes)

1. Start backend and frontend, show landing page.
2. Show customer booking guard (not logged in -> login).
3. Login customer, create booking with photo.
4. Show booking appears in My Bookings with image.
5. Login technician, accept/start/complete booking.
6. Show customer timeline update and message chat action.
7. Login admin, open Messages, send reply in real conversation.
8. Show technician/customer receiving updates.
9. Show profile rule: customer name immutable, email/phone editable.
10. Finish with dashboard pages for all three roles.
