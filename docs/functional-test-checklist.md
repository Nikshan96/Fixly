# Fixly Functional Test Checklist (Page-by-Page)

Date: 2026-03-23

Legend:
- [x] Verified pass in current state
- [ ] Needs manual test execution
- [~] Expected partial (feature exists but incomplete)
- [!] Blocked/missing implementation

## Environment Smoke
- [x] Backend boots (`npm --prefix backend run dev`)
- [x] Frontend dev server boots (`npm --prefix frontend run dev`)
- [x] Frontend production build passes (`npm --prefix frontend run build`)
- [x] Backend health endpoint available (`GET /api/health`)

## Auth Flow
### Login (`/login`)
- [ ] Valid credentials sign in and redirect by role
- [ ] Invalid credentials show error
- [ ] Inactive account returns access denied message

### Register (`/register`)
- [ ] New customer registration succeeds
- [ ] Existing email is rejected
- [ ] Token and user object are persisted in local storage

### Forgot/Reset Password (`/forgot-password`, `/reset-password`)
- [ ] Forgot password accepts existing email
- [ ] Reset with valid token succeeds
- [ ] Reset with invalid/expired token fails cleanly

## Customer Pages
### Home (`/`)
- [ ] Services list loads from API (`GET /api/customer/services`)
- [ ] "Book Now" opens booking modal
- [ ] Unauthenticated user clicking book is redirected to login

### Services (`/services`)
- [ ] Services load and render consistently
- [ ] Booking modal can be opened from service card

### Booking Modal (global)
- [ ] Create booking with required fields succeeds (`POST /api/customer/bookings`)
- [ ] Create booking with photo upload succeeds
- [ ] Validation errors are shown for incomplete form

### My Bookings (`/my-bookings`)
- [ ] Bookings list loads (`GET /api/customer/bookings`)
- [ ] Status tabs (active/completed/cancelled) filter correctly
- [ ] Search/date filters return expected subset
- [ ] Cancel booking works for pending/accepted (`PUT /api/customer/bookings/:id/cancel`)
- [ ] Rebook opens booking flow with preselected service
- [~] Message technician button is placeholder toast (no backend chat integration)

### Profile (`/profile`)
- [ ] Profile update (name/email/phone/address) succeeds (`PUT /api/customer/profile`)
- [ ] Profile image upload works
- [ ] Password change works (`PUT /api/customer/change-password`)

### Contact (`/contact`)
- [~] Form submit shows success alert
- [!] No backend submission endpoint wired (UI-only form)

## Admin Pages
### Dashboard (`/admin/dashboard`)
- [ ] Stats cards load (`GET /api/admin/stats`)
- [ ] Recent bookings table loads (`GET /api/admin/bookings`)

### All Jobs (`/admin/jobs`)
- [ ] Job list loads with filters (`GET /api/admin/bookings`)
- [ ] Update job status succeeds (`PUT /api/admin/bookings/:id/status`)
- [ ] Technician reassignment flow persists correctly

### All Technicians (`/admin/technicians`)
- [ ] Technician list loads (`GET /api/admin/technicians`)
- [ ] Search/filter by service works

### Hire Technician (`/admin/hire`)
- [ ] Services dropdown loads (`GET /api/admin/services`)
- [ ] New technician creation with image succeeds (`POST /api/admin/technicians`)

### Revenue (`/admin/revenue`)
- [ ] Monthly revenue data loads (`GET /api/admin/revenue/monthly`)
- [ ] Completed booking totals align with bookings data

### Messages (`/admin/messages`)
- [~] UI renders and supports tab switching
- [!] Uses hardcoded mock data; no live API integration

### Settings (`/admin/settings`)
- [ ] Admin profile update works (`PUT /api/admin/profile`)
- [ ] Password change works (`PUT /api/admin/change-password`)

## Technician Pages
### Technician Dashboard (`/technician/dashboard`)
- [~] Route guard works (technician-only)
- [~] First-login redirect to reset-password works
- [!] Page is placeholder (no operational technician dashboard yet)

## Notifications
### Customer Notifications
- [ ] Fetch notifications (`GET /api/customer/notifications`)
- [ ] Mark one read (`PUT /api/customer/notifications/:id/read`)
- [ ] Mark all read (`PUT /api/customer/notifications/read-all`)

### Admin Notifications
- [ ] Fetch notifications (`GET /api/admin/notifications`)
- [ ] Mark one read (`PUT /api/admin/notifications/:id/read`)
- [ ] Mark all read (`PUT /api/admin/notifications/read-all`)

## Access Control / Guards
- [ ] Non-logged user blocked from `/my-bookings` and `/profile`
- [ ] Non-admin blocked from `/admin/*`
- [ ] Non-technician blocked from `/technician/dashboard`
- [ ] Customer cannot open admin/technician pages

## Known Gaps To Plan Next
- [!] Chat backend exists (`/api/chat/*`) but frontend API service has no chat methods wired in current routed app flow
- [!] Technician route group currently only exposes `/api/technician/health`
- [!] Contact form has no backend endpoint
- [!] Admin Messages page uses mock data (no persistence)
