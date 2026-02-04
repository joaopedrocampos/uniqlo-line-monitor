# Uniqlo Munich Line Monitor

A crowdsourced web app to check if there's a line at the Uniqlo store in Munich. Help others know when it's a good time to visit!

## Features

- **Real-time Status**: See the current line status at a glance (No Line / Short Line / Long Line)
- **Quick Reporting**: One-tap buttons to report what you see at the store
- **Mobile-First Design**: Optimized for checking on your phone while walking to the store
- **Crowdsourced Data**: Status is based on recent reports from visitors

### Coming Soon
- Photo uploads with reports
- Historical patterns showing typical busy times
- AI-powered line length estimation from photos

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, PostgreSQL
- **Deployment**: Docker Compose for local development

## Getting Started

### Prerequisites

- Docker and Docker Compose (recommended)
- OR Node.js 18+ and PostgreSQL (for manual setup)

### Quick Start with Docker (Recommended)

Run everything with a single command:

```bash
docker-compose up
```

That's it! The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on port 5432

The database schema is automatically initialized on first run.

To stop everything:
```bash
docker-compose down
```

To rebuild after code changes:
```bash
docker-compose up --build
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

The app will run on http://localhost:3000

</details>

## Project Structure

```
uniqlo-line-monitor/
├── frontend/           # Next.js frontend
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # Utilities and API client
├── backend/            # Express backend
│   └── src/
│       ├── routes/     # API endpoints
│       ├── db/         # Database connection and schema
│       └── middleware/ # Rate limiting, etc.
├── docker-compose.yml  # Docker orchestration
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Get current line status |
| POST | `/api/report` | Submit a new status report |

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
