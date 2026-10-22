-- Migrates databases created before photos were removed and IPs were hashed.
-- Fresh databases get this shape from schema.sql and don't need it.
-- Run with: docker compose exec -T db psql -U postgres -d uniqlo_line_monitor < backend/src/db/migrations/001_remove_photos_hash_ips.sql

BEGIN;

DROP TABLE IF EXISTS photos;

ALTER TABLE reports DROP COLUMN IF EXISTS has_photo;

-- Existing raw IPs can't be re-keyed with the app's secret, so they are discarded.
-- Old rows only matter for history stats, which don't use the client identifier.
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ip_hash CHAR(64);
UPDATE reports SET ip_hash = repeat('0', 64) WHERE ip_hash IS NULL;
ALTER TABLE reports ALTER COLUMN ip_hash SET NOT NULL;

DROP INDEX IF EXISTS idx_reports_ip_created;
ALTER TABLE reports DROP COLUMN IF EXISTS ip_address;
CREATE INDEX IF NOT EXISTS idx_reports_ip_hash_created ON reports(ip_hash, created_at);

COMMIT;
