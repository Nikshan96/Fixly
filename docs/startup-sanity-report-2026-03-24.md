# Startup Sanity Report - 2026-03-24

## Observed Runtime State
- Port 5000 listener exists and backend health endpoint responds with HTTP 200.
- Port 5173 listener exists and frontend root responds with HTTP 200.
- Attempting to start additional backend/frontend instances fails with EADDRINUSE (expected when one healthy instance is already running).

## Verified Commands
- Backend health check:
  - `Invoke-WebRequest -UseBasicParsing http://localhost:5000/api/health`
- Frontend health check:
  - `Invoke-WebRequest -UseBasicParsing http://localhost:5173`

## Recommended Normal Start (single-instance)
- Backend:
  - `Set-Location C:/projects/clone/Fixly/backend`
  - `npm run dev`
- Frontend:
  - `Set-Location C:/projects/clone/Fixly/frontend`
  - `npm run dev`

## If Port Conflict Happens
- Find current listener PID:
  - `Get-NetTCPConnection -State Listen -LocalPort 5000,5173 | Select-Object LocalPort,OwningProcess`
- Stop only the conflicting process ID:
  - `Stop-Process -Id <PID> -Force`

## Conclusion
- Startup sanity passes with currently running instances.
- Conflicts are from duplicate launches, not from current code syntax/route issues.
