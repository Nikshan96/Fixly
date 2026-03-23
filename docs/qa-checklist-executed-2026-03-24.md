# Fixly QA Checklist - Executed (Pass/Fail)

## Environment boot
- Backend starts without runtime errors. Pass
- Frontend starts/builds without compile errors. Pass
- Socket connection establishes with valid JWT. Fail

## Auth and role routing
- Admin login redirects to admin dashboard. Pass
- Customer login redirects to home. Pass
- Technician login redirects to technician dashboard. Pass
- Technician is not forced to reset password on first login. Pass

## Technician job flow
- Technician can view available jobs. Pass
- Accepting job moves it to My Jobs. Pass
- Completing job moves it to Completed Jobs. Pass
- Declining job behaves correctly and does not remain a fake success. Pass

## Messaging (shared model)
- Admin can view conversations and send messages. Pass
- Customer can open booking chat and send messages. Pass
- Technician can open booking chat and send messages. Pass
- New messages appear realtime for counterpart user. Pass
- Unread counts update appropriately. Pass

## Notification flow
- Profile/password/booking events create notifications. Pass
- notification:new emits realtime to the target user room. Pass
- Admin notification dropdown updates live. Pass
- Customer notification dropdown updates live. Pass
- Technician notification panel updates live. Pass

## Revenue and payments
- Marking booking completed creates payment row if missing. Pass
- Payment split is 5 percent platform fee and 95 percent technician amount. Pass
- Admin revenue stats endpoint returns non-zero when completed jobs exist. Pass
- Admin monthly revenue endpoint returns chart-ready points. Pass
- Admin revenue page shows real monthly bars and payout totals. Pass
- Technician earnings page reflects completed job payouts and chart. Pass

## Review/rating removal
- Admin /reviews routes are absent or inaccessible. Fail
- Frontend has no active review API calls. Fail
- Technician/profile cards do not show rating values. Pass
- Reassign modal does not show technician star rating. Pass
- Notification icon maps do not include review types in UI logic. Fail

## Post-completion privacy masking
- Customer page hides technician phone/address for completed jobs. Fail
- Technician page hides customer location/call/map for completed jobs. Fail
- Privacy note appears in UI after completion. Fail
- Backend still retains full historical records for admin/audit use. Pass

## Reassignment behavior sanity
- Reassign available only for non-closed job states. Pass
- Completed/cancelled jobs cannot be reassigned from admin jobs page. Pass
- Conversation continuity remains correct after assignment/reassignment. Pass

## Additional Payment Verification
- eSewa initiate endpoint: Pass (HTTP 200)
- Khalti initiate endpoint: Fail (HTTP 400 with current placeholder/invalid key)
- Customer payment history endpoint: Pass (HTTP 200)
- Admin payment history endpoint: Pass (HTTP 200)

## Blocker
- Khalti still requires a valid sandbox secret key value in backend environment to pass initiation and verification in real gateway flow.
