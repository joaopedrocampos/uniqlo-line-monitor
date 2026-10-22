# Uniqlo Munich Line Monitor

A crowdsourced web app to check if there's a line at the Uniqlo store in Munich. Help others know when it's a good time to visit!

## Who It's For

People in Munich who want to know whether it's worth heading to Uniqlo right now, or who are already there and can tap a button to tell everyone else. No account needed: you see the current status and report what you see.

## Features

- **Real-time Status**: See the current line status at a glance (No Line / Short Line / Long Line)
- **Quick Reporting**: One-tap buttons to report what you see at the store
- **Mobile-First Design**: Optimized for checking on your phone while walking to the store
- **Crowdsourced Data**: Status is the most common report from the last 30 minutes, with a confidence percentage
- **Typical Busy Times**: A summary of busy and quiet hours/days, calculated from the last 7 days of reports

> **Note:** The repo still contains an experimental photo-upload feature (`backend/src/routes/photos.js`, `frontend/components/PhotoUpload.tsx`). Photos of a queue can show other people, so I'm dropping this feature instead of building on it. Removing it is on the [roadmap](ROADMAP.md).

### Coming Soon
- Status that refreshes on its own and a "how fresh is this" indicator
- Store opening hours, so the app doesn't show stale status when the store is closed
- Busy-times chart by hour and weekday (instead of a text summary only)
- Privacy cleanup: stop storing raw IP addresses
- A public deployment

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, date-fns
- **Backend**: Node.js 20, Express 5, PostgreSQL 16 (`pg`), Jest + Supertest for tests
- **Deployment**: Docker Compose for local development (no production deployment yet)

## Getting Started

### Prerequisites

- Docker and Docker Compose (recommended)
- OR Node.js 20+ and PostgreSQL 16 (for manual setup)

### Quick Start with Docker (Recommended)

Run everything with a single command:

```bash
docker compose up
```

(Older Docker installs use `docker-compose` with a hyphen; both work.)

That's it! The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on port 5432

The database schema is automatically initialized on first run (`backend/src/db/schema.sql` is mounted into the Postgres init directory). If you change the schema later, reset the volume with `docker compose down -v`.

To stop everything:
```bash
docker compose down
```

To rebuild after code changes:
```bash
docker compose up --build
```

### Manual Setup (Alternative)

<details>
<summary>Click to expand manual setup instructions</summary>

**1. Setup Database:**

Create a PostgreSQL database:
```bash
createdb uniqlo_line_monitor
```

Run the database schema:
```bash
cd backend
psql -d uniqlo_line_monitor -f src/db/schema.sql
```

**2. Backend Setup:**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your DATABASE_URL
npm run dev
```

The API will run on http://localhost:3001

**3. Frontend Setup:**

```bash
cd frontend
npm install
npm run dev
```

The app will run on http://localhost:3000. If the API isn't on `http://localhost:3001`, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

</details>

### Running Tests

Backend unit tests (history calculations and local storage):

```bash
cd backend
npm test
npm run test:coverage   # with coverage report
```

Frontend lint:

```bash
cd frontend
npm run lint
```

## Project Structure

```
uniqlo-line-monitor/
├── frontend/           # Next.js frontend
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # Utilities and API client
├── backend/            # Express backend
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # History analysis, file storage
│   │   ├── db/         # Database connection and schema
│   │   └── middleware/ # Rate limiting, etc.
│   └── tests/          # Jest tests
├── docs/plans/         # Design notes
├── docker-compose.yml  # Docker orchestration
├── ROADMAP.md          # What's planned next
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Get current line status |
| POST | `/api/report` | Submit a new status report (rate limited per IP) |
| GET | `/api/report` | List recent reports (debug; will be locked down) |
| GET | `/api/history?days=7` | Busy/quiet patterns for the last N days (max 30) |

The `/api/photos` endpoints still exist but are being removed (see the note above).

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned work: bug fixes, privacy cleanup, tests, better busy-times views, and deployment.

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
