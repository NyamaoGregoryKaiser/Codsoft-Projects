```sql
-- Migration 001: Initial Schema Setup

-- Drop tables if they exist to allow clean re-runs during development
DROP TABLE IF EXISTS scraped_data;
DROP TABLE IF EXISTS scraping_jobs;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster username lookups
CREATE INDEX idx_users_username ON users (username);

-- Scraping Jobs Table
CREATE TABLE scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_url TEXT NOT NULL,
    cron_schedule VARCHAR(255) DEFAULT 'manual', -- e.g., "0 0 * * *", or "manual"
    css_selector TEXT NOT NULL, -- e.g., "div.price::text, a.title::attr(href)"
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
    last_run_message TEXT,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_job_name_for_user UNIQUE (user_id, name)
);

-- Index for faster job lookups by user
CREATE INDEX idx_scraping_jobs_user_id ON scraping_jobs (user_id);

-- Scraped Data Table
CREATE TABLE scraped_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES scraping_jobs(id) ON DELETE CASCADE,
    url TEXT NOT NULL, -- The actual URL from which the data was scraped
    data JSONB NOT NULL, -- Stores the extracted data in JSON format
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster data lookups by job
CREATE INDEX idx_scraped_data_job_id ON scraped_data (job_id);

-- Add functions/triggers for 'updated_at' column
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_scraping_jobs_updated_at
BEFORE UPDATE ON scraping_jobs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Optional: Add extensions for UUID if not available by default (e.g., on some older PG versions)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- gen_random_uuid() is typically built-in >= PG 13

-- Add a comment for documentation purposes
COMMENT ON TABLE users IS 'Stores user accounts for the scraping platform.';
COMMENT ON TABLE scraping_jobs IS 'Stores configurations for web scraping tasks.';
COMMENT ON TABLE scraped_data IS 'Stores the results of executed web scraping jobs.';
```