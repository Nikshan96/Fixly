# Fixly QA Checklist (Pass/Fail)

Use this checklist for independent verification after implementation.
Mark exactly one per row: `[ ] Pass` or `[ ] Fail`.

## Environment boot
- Backend starts without runtime errors. [ ] Pass [ ] Fail
- Frontend starts/builds without compile errors. [ ] Pass [ ] Fail
- Socket connection establishes with valid JWT. [ ] Pass [ ] Fail

## Auth and role routing
- Admin login redirects to admin dashboard. [ ] Pass [ ] Fail
- Customer login redirects to home. [ ] Pass [ ] Fail
- Technician login redirects to technician dashboard. [ ] Pass [ ] Fail
- Technician is not forced to reset password on first login. [ ] Pass [ ] Fail

## Technician job flow
- Technician can view available jobs. [ ] Pass [ ] Fail
- Accepting job moves it to My Jobs. [ ] Pass [ ] Fail
- Completing job moves it to Completed Jobs. [ ] Pass [ ] Fail
- Declining job behaves correctly and does not remain a fake success. [ ] Pass [ ] Fail

## Messaging (shared model)
- Admin can view conversations and send messages. [ ] Pass [ ] Fail
- Customer can open booking chat and send messages. [ ] Pass [ ] Fail
- Technician can open booking chat and send messages. [ ] Pass [ ] Fail
- New messages appear realtime for counterpart user. [ ] Pass [ ] Fail
- Unread counts update appropriately. [ ] Pass [ ] Fail

## Notification flow
- Profile/password/booking events create notifications. [ ] Pass [ ] Fail
- notification:new emits realtime to the target user room. [ ] Pass [ ] Fail
- Admin notification dropdown updates live. [ ] Pass [ ] Fail
- Customer notification dropdown updates live. [ ] Pass [ ] Fail
- Technician notification panel updates live. [ ] Pass [ ] Fail

## Revenue and payments
- Marking booking completed creates payment row if missing. [ ] Pass [ ] Fail
- Payment split is 5 percent platform fee and 95 percent technician amount. [ ] Pass [ ] Fail
- Admin revenue stats endpoint returns non-zero when completed jobs exist. [ ] Pass [ ] Fail
- Admin monthly revenue endpoint returns chart-ready points. [ ] Pass [ ] Fail
- Admin revenue page shows real monthly bars and payout totals. [ ] Pass [ ] Fail
- Technician earnings page reflects completed job payouts and chart. [ ] Pass [ ] Fail

## Review/rating removal
- Admin /reviews routes are absent or inaccessible. [ ] Pass [ ] Fail
- Frontend has no active review API calls. [ ] Pass [ ] Fail
- Technician/profile cards do not show rating values. [ ] Pass [ ] Fail
- Reassign modal does not show technician star rating. [ ] Pass [ ] Fail
- Notification icon maps do not include review types in UI logic. [ ] Pass [ ] Fail

## Post-completion privacy masking
- Customer page hides technician phone/address for completed jobs. [ ] Pass [ ] Fail
- Technician page hides customer location/call/map for completed jobs. [ ] Pass [ ] Fail
- Privacy note appears in UI after completion. [ ] Pass [ ] Fail
- Backend still retains full historical records for admin/audit use. [ ] Pass [ ] Fail

## Reassignment behavior sanity
- Reassign available only for non-closed job states. [ ] Pass [ ] Fail
- Completed/cancelled jobs cannot be reassigned from admin jobs page. [ ] Pass [ ] Fail
- Conversation continuity remains correct after assignment/reassignment. [ ] Pass [ ] Fail
