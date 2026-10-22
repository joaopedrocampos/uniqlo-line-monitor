# Uniqlo Line Monitor - Backend API

Express.js backend API for the Uniqlo Line Monitor application.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup PostgreSQL database:**

   Make sure PostgreSQL is installed and running on your system.

   Create a new database:
   ```bash
   createdb uniqlo_line_monitor
   ```

   Or using psql:
   ```sql
   CREATE DATABASE uniqlo_line_monitor;
   ```

3. **Run the database schema:**

   Connect to your database and run the schema file:
   ```bash
   psql -d uniqlo_line_monitor -f src/db/schema.sql
   ```

   Or using psql:
   ```bash
   psql uniqlo_line_monitor
   \i src/db/schema.sql
   ```

4. **Configure environment variables:**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update the DATABASE_URL with your PostgreSQL credentials:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/uniqlo_line_monitor
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

## API Endpoints

### GET /api/status
Get the current line status based on recent reports (last 30 minutes).

**Response:**
```json
{
  "status": "no_line" | "short_line" | "long_line" | "unknown",
  "lastUpdated": "2024-01-01T12:00:00Z",
  "recentReports": [...],
  "confidence": 85,
  "totalReports": 10
}
```

### POST /api/report
Submit a new line status report.

**Request body:**
```json
{
  "status": "no_line" | "short_line" | "long_line",
  "estimatedPeople": 5  // optional
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": 123,
    "status": "no_line",
    "estimated_people": 5,
    "created_at": "2024-01-01T12:00:00Z"
  },
  "currentStatus": {
    "status": "no_line",
    "lastUpdated": "2024-01-01T12:00:00Z",
    "confidence": 90,
    "totalReports": 11
  }
}
```

**Rate Limiting:**
- 1 report per client per 15 minutes, keyed by a daily-rotating hash of the IP (raw IPs are never stored or logged)
- Returns 429 status code if limit exceeded

### GET /api/report
Get all recent reports (for debugging/admin).

**Query parameters:**
- `limit`: Number of reports to return (default: 50)
- `offset`: Offset for pagination (default: 0)

## Database Schema

### reports table
- `id`: Serial primary key
- `status`: VARCHAR(20) - one of 'no_line', 'short_line', 'long_line'
- `estimated_people`: INTEGER - optional count of people in line
- `created_at`: TIMESTAMP - when the report was created
- `ip_hash`: CHAR(64) - HMAC-SHA256 of the reporter's IP, keyed with `IP_HASH_SECRET` and the current date (for rate limiting only)

Databases created before photos were removed can be updated with `src/db/migrations/001_remove_photos_hash_ips.sql`.

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Main Express app
│   ├── db/
│   │   ├── index.js          # Database connection
│   │   └── schema.sql        # Database schema
│   ├── routes/
│   │   ├── status.js         # GET /api/status
│   │   └── reports.js        # POST /api/report, GET /api/report
│   └── middleware/
│       └── rateLimit.js      # Rate limiting by hashed IP
├── .env.example              # Environment variable template
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Development

Run with auto-reload:
```bash
npm run dev
```

## Production

Start the server:
```bash
npm start
```

## Environment Variables

See `.env.example` for all available configuration options.
