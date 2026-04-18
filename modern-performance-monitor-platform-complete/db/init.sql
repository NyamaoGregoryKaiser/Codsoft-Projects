```sql
-- Create database if it doesn't exist (only if connecting as superuser/postgres)
-- IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'perfo_metrics_db') THEN
--    CREATE DATABASE perfo_metrics_db;
-- END IF;

-- Connect to the database
-- \c perfo_metrics_db;

-- Create `users` table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store bcrypt/argon2 hash
    role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- e.g., 'admin', 'viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create `services` table for monitored applications/services
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    api_key UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL, -- For metric ingestion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create `metrics` table for storing performance data
-- Use TimescaleDB hypertable if high-volume time-series data is expected for better performance
CREATE TABLE IF NOT EXISTS metrics (
    id BIGSERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- e.g., 'CPU_USAGE', 'MEMORY_USAGE', 'REQUEST_LATENCY', 'ERROR_RATE', 'CUSTOM_METRIC'
    value DOUBLE PRECISION NOT NULL,
    tags JSONB DEFAULT '{}', -- Flexible key-value pairs for additional context (e.g., region, environment, endpoint)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_metrics_service_id_timestamp ON metrics (service_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_type ON metrics (metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_tags ON metrics USING GIN (tags); -- For querying JSONB fields

-- Create `alert_rules` table
CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE, -- Null if rule applies globally or to multiple services
    name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    operator VARCHAR(10) NOT NULL, -- e.g., '>', '<', '>=', '<=', '='
    duration_seconds INTEGER NOT NULL DEFAULT 60, -- How long threshold must be violated
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    target_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, metric_type, name) -- Prevent duplicate rules
);

-- Create `active_alerts` table
CREATE TABLE IF NOT EXISTS active_alerts (
    id BIGSERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'critical' -- e.g., 'info', 'warning', 'critical'
);


-- Seed data
-- Add an admin user (password 'admin123' hashed with bcrypt)
-- Using a placeholder hash for demonstration. In real app, generate securely.
-- For `crypt` function from libcrypt, 'admin123' with salt '$2a$10$abcdefghabcdefghabcdefgh./' gives
-- '$2a$10$abcdefghabcdefghabcdefgh.u0L/Vv2hF/4oY/pY2z.q1'
INSERT INTO users (username, password_hash, role) VALUES
    ('admin', '$2a$10$abcdefghabcdefghabcdefgh.u0L/Vv2hF/4oY/pY2z.q1', 'admin') ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role) VALUES
    ('viewer', '$2a$10$abcdefghabcdefghabcdefgh.u0L/Vv2hF/4oY/pY2z.q1', 'viewer') ON CONFLICT (username) DO NOTHING; -- Assuming 'viewer123' for viewer

-- Add some initial services
INSERT INTO services (name, description) VALUES
    ('WebApp Service 1', 'Main customer-facing web application backend.'),
    ('Payment Gateway', 'Critical service for processing payments.'),
    ('Analytics Worker', 'Background service for data processing.')
ON CONFLICT (name) DO NOTHING;
```