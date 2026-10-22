# Roadmap

What I'm planning for the Uniqlo Munich Line Monitor. Hours are rough estimates for one person working evenings and weekends. Order matters more than dates.

**Where things stand:** the MVP works locally with Docker Compose. You can see the current status (the most common report from the last 30 minutes), submit a report, and see a text summary of typical busy times. There's no deployment yet and only the history service and IP hashing have tests. The experimental photo-upload feature has been removed and raw IPs are no longer stored (see Done below).

**Out of scope on purpose:** photos or video of the queue, user accounts or profiles, location tracking, and any AI/ML-based estimation. The app only collects anonymous "no line / short line / long line" taps.

---

## Done

- Removed the photo-upload feature (routes, storage service, UI, `multer`/`uuid`, Cloudinary config). Migration `backend/src/db/migrations/001_remove_photos_hash_ips.sql` drops the `photos` table and `has_photo` column.
- Stopped storing and logging raw IPs. `reports.ip_hash` holds an HMAC-SHA256 of the IP keyed with `IP_HASH_SECRET` and the current date, used only for rate limiting.

## Phase 1: Cleanup and privacy (~6h)

| Item | Est. |
|------|------|
| **Short privacy note in the app footer** saying what's stored (status, timestamp, temporary hashed rate-limit key) and how long it's kept. | 1h |
| **Data retention**: delete or aggregate reports older than N days (configurable) so the table doesn't grow forever. | 2h |
| **Lock down `GET /api/report`.** It's an open debug endpoint with no upper bound on `limit`. Put it behind an admin token or turn it off in production. | 1h |
| **Remove noisy logging.** `db/index.js` logs every SQL query and the status route logs on every request. Add a small logger with levels. | 2h |

## Phase 2: Bug fixes and backend refactor (~14h)

| Item | Est. |
|------|------|
| **Fix the SIGTERM handler.** It calls `server.close()`, but `app.listen()` is never assigned to `server`, so shutdown crashes. Also close the pg pool on shutdown. | 0.5h |
| **Timezone bug in history.** `EXTRACT(HOUR/DOW FROM created_at)` uses the DB session timezone (UTC in Docker), so "busy at 1pm" is really 1pm UTC. Convert with `AT TIME ZONE 'Europe/Berlin'` and add a test across a DST change. | 2h |
| **Parameterize the `days` interval** in `getReportsForPeriod` instead of putting it in the SQL string (it's validated today, but the pattern is fragile). | 0.5h |
| **Pull the status calculation into one service.** The "most common status in the last 30 min" logic is copied in `status.js` and `reports.js`. Move it into `statusService.js` and define tie-breaking (right now ties go to whichever status comes first). | 2h |
| **Weight recent reports more** (e.g. a report from 2 min ago counts more than one from 28 min ago) and show "low confidence" when there are only one or two reports. Plain arithmetic, no ML. | 3h |
| **Rate limiter fixes.** The 429 message always says "15 minutes" even in dev, `x-forwarded-for` is read without `trust proxy` being set, and state is in-memory, so it resets on restart. Make the window/limit configurable, set `trust proxy` properly, and consider storing it in Postgres. | 3h |
| **Input validation.** `estimatedPeople` is accepted but the frontend never sends it, so either remove it or add a UI for it. Return consistent error shapes. | 1h |
| **Schema migrations.** Swap "edit schema.sql and recreate the DB" for a small migration tool (e.g. `node-pg-migrate`) so schema changes don't wipe data. | 2h |

## Phase 3: Tests and CI (~13h)

| Item | Est. |
|------|------|
| **API integration tests** with Supertest against a test Postgres: `/api/status` (empty, single report, tie, expiry after 30 min), `/api/report` (validation, rate limit), `/api/history`. | 5h |
| **Split `index.js`** into `app.js` (builds the Express app) and `server.js` (listens), so tests can import the app without opening a port. | 1h |
| **Frontend tests** (Vitest + React Testing Library) for `lib/api.ts` status mapping, `StatusDisplay`, `QuickReport` error and success states, `BusyTimes` with little data. | 4h |
| **GitHub Actions CI**: backend tests with a Postgres service container, frontend lint + type check + build, on every push and PR. | 2h |
| **Dependabot or Renovate** for npm and Docker base images. | 1h |

## Phase 4: Features (~20h)

| Item | Est. |
|------|------|
| **Auto-refresh status** every 60s, and when the tab regains focus, with a visible "updated X min ago" and a stale warning after 30 min. | 2h |
| **Store opening hours.** Add a config with Munich store hours and holidays. Show "Store closed" outside them instead of an old status, and leave closed hours out of the history stats. | 3h |
| **Busy-times chart.** A weekday × hour heatmap (or a bar chart for today) built from the existing hourly/daily scores, plus a new endpoint that returns the raw buckets instead of only the text summary. | 6h |
| **"Best time to go today"** hint built from the historical buckets for the current weekday. | 2h |
| **Undo a report** within ~1 minute of submitting it (for accidental taps), tied to the hashed rate-limit key. | 2h |
| **Accessibility pass**: color isn't the only signal (icons/text alongside green/yellow/red), focus states, screen-reader labels, contrast check. | 2h |
| **German localization** (de/en toggle) since the audience is in Munich. | 3h |

## Phase 5: Deployment and ops (~15h)

| Item | Est. |
|------|------|
| **Production Dockerfiles.** Both Dockerfiles currently run `npm run dev`. Add multi-stage builds: `next build` + `next start` for the frontend, `npm ci --omit=dev` + `node` for the backend, running as a non-root user. | 3h |
| **Production compose / env config**: no hard-coded `postgres:postgres` credentials, secrets read from env, DB not exposed on a public port, enable pg SSL option. | 2h |
| **Deploy** to a small host (e.g. a VPS or Fly.io/Render) with HTTPS and a domain. | 4h |
| **Database backups** (scheduled `pg_dump`) and a written restore procedure. | 2h |
| **Health check endpoint** that also checks the DB, plus basic uptime monitoring. | 1h |
| **Security headers** (helmet), request body size limits, CORS check for production origins. | 1h |
| **Write up the deploy** in a `docs/deploy.md`. | 2h |

## Phase 6: Docs (~5h)

| Item | Est. |
|------|------|
| Keep README, CLAUDE.md and `backend/README.md` in sync with new endpoints. `backend/README.md` repeats the root README and could be trimmed. | 2h |
| Short architecture/decisions doc: how status is calculated, privacy choices, why no photos. | 2h |
| Screenshot/GIF of the UI in the README. | 1h |

---

## Later / maybe

- Support more than one store (e.g. other Uniqlo locations in Germany). This would mean a `stores` table and a store picker. (~10h)
- A PWA "add to home screen" setup with an offline fallback page. (~3h)
- Opt-in browser push ("tell me when the line is short") that doesn't need an account. (~6h)

**Planned total (Phases 1–6): about 73 hours.**
