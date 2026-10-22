-- Uniqlo Line Monitor Database Schema

-- Reports table: stores line status reports from users
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL CHECK (status IN ('no_line', 'short_line', 'long_line')),
    estimated_people INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- HMAC-SHA256 of the client IP with a daily-rotating key; raw IPs are never stored
    ip_hash CHAR(64) NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_ip_hash_created ON reports(ip_hash, created_at);
