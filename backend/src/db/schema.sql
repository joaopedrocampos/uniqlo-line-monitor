-- Uniqlo Line Monitor Database Schema

-- Reports table: stores line status reports from users
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL CHECK (status IN ('no_line', 'short_line', 'long_line')),
    estimated_people INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    has_photo BOOLEAN DEFAULT FALSE
);

-- Photos table: stores photo uploads (for Phase 2)
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    cloudinary_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_report_id ON photos(report_id);
CREATE INDEX IF NOT EXISTS idx_reports_ip_created ON reports(ip_address, created_at);
