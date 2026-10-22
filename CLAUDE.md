# CLAUDE.md - AI Assistant Guide

This file helps AI assistants understand and work with this codebase effectively.

## Project Overview

**Uniqlo Munich Line Monitor** - A crowdsourced web app to check if there's a line at the Uniqlo store in Munich.

**Status**: MVP complete with history patterns. Photo uploads were removed for privacy (photos of a queue show other people); don't reintroduce them. See ROADMAP.md for planned work.

## Quick Start

```bash
docker-compose up        # Start all services
docker-compose down      # Stop all services
docker-compose up --build  # Rebuild after code changes
```

**URLs when running:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: PostgreSQL on port 5432

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  PostgreSQL │
│  (Next.js)  │     │  (Express)  │     │             │
│  Port 3000  │     │  Port 3001  │     │  Port 5432  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Directory Structure

```
.
├── frontend/                 # Next.js 16 (App Router)
│   ├── app/                  # Pages and layouts
│   │   ├── page.tsx          # Main page
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── StatusDisplay.tsx # Status indicator
│   │   ├── QuickReport.tsx   # Report buttons
│   │   └── BusyTimes.tsx     # Historical patterns
│   └── lib/
│       └── api.ts            # API client functions
│
├── backend/                  # Express server
│   ├── src/
│   │   ├── index.js          # App entry point
│   │   ├── routes/
│   │   │   ├── status.js     # GET /api/status
│   │   │   ├── reports.js    # POST /api/report
│   │   │   └── history.js    # GET /api/history
│   │   ├── services/
│   │   │   └── historyService.js
│   │   ├── utils/
│   │   │   └── clientHash.js # Daily-rotating keyed hash of client IPs
│   │   ├── middleware/
│   │   │   └── rateLimit.js  # Rate limiting by hashed IP
│   │   └── db/
│   │       ├── index.js      # PostgreSQL connection
│   │       ├── schema.sql    # Database schema
│   │       └── migrations/   # SQL for upgrading existing databases
│   └── tests/                # Jest tests
│
├── docker-compose.yml        # Docker orchestration
└── docs/plans/               # Design documents
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Current line status |
| POST | `/api/report` | Submit status report |
| GET | `/api/history?days=7` | Historical patterns |

## Database Schema

```sql
-- Reports: stores line status reports
reports (
  id SERIAL PRIMARY KEY,
  status VARCHAR(20),        -- 'no_line', 'short_line', 'long_line'
  estimated_people INTEGER,
  created_at TIMESTAMP,
  ip_hash CHAR(64)           -- HMAC-SHA256(IP_HASH_SECRET, date:ip); never store raw IPs
)
```

## Key Design Decisions

1. **Privacy**: Only status, optional people count and timestamp are stored. Client IPs are hashed with a daily-rotating key (`utils/clientHash.js`) and never stored or logged in plain form.

2. **Status Mapping**: Backend uses lowercase (`no_line`), frontend uses uppercase (`NO_LINE`). Conversion happens in `frontend/lib/api.ts`.

3. **Rate Limiting**: Keyed by the hashed client IP. Dev: 10/min, Prod: 1/15min.

4. **History Analysis**: Calculates busy/quiet hours from reports in last N days. Scores: no_line=0, short_line=1, long_line=2.

## Running Tests

```bash
cd backend
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage  # Coverage report
```

## Common Tasks

**Add a new API endpoint:**
1. Create route in `backend/src/routes/`
2. Register in `backend/src/index.js`
3. Add types and function in `frontend/lib/api.ts`

**Modify database schema:**
1. Update `backend/src/db/schema.sql`
2. Recreate database or run migrations manually

## Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uniqlo_line_monitor
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
IP_HASH_SECRET=change_me   # openssl rand -hex 32
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
