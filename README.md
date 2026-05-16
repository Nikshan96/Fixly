# Fixly

Fixly is a full-stack service marketplace project with a Node.js/Express backend and a React + Vite frontend.

## Project Structure

```text
Fixly/
├── backend/    # API server, auth, admin/customer/technician routes
├── frontend/   # React + Vite client app
├── .gitignore
└── README.md
```

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Sequelize, PostgreSQL

## Getting Started

### 1) Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Notes

- Keep all environment variables in `.env` files (ignored by git).
- Active code lives in `backend/` and `frontend/`.

## Current Routing Behavior

- `/` shows the public marketing landing page for visitors.
- Logged-in users are redirected by role:
	- `customer` -> `/home`
	- `admin` -> `/admin/dashboard`
	- `technician` -> `/technician/dashboard`
- Customer pages (`/home`, `/services`, `/contact`) use the customer navbar/footer layout.
- Admin pages are under `/admin/*` and use the admin dashboard layout.

## Booking and Admin Flow

- Customers can create bookings from services, view them in `My Bookings`, and cancel eligible bookings.
- `My Bookings` includes categorized sections (active/completed/canceled), search/date filtering, and rebook support.
- Admin `All Jobs` loads bookings from `GET /api/admin/bookings` and supports assign/reassign actions.
- Assigning a technician via `PUT /api/admin/bookings/:id`:
	- assigns/reassigns technician
	- auto-updates `pending` bookings to `accepted`
	- sends notifications to customer, assigned technician, and previous technician (if reassigned)

## API Health Check

- Backend health endpoint: `GET http://localhost:5000/api/health`
- If frontend shows auth/role issues, clear local session data (`token`, `user`) and log in again.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express, PostgreSQL
- **Deployment:** TBD

