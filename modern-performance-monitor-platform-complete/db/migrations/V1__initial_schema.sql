```sql
-- This migration script is generally identical to init.sql for the first version.
-- In a real migration system (like Flyway or Liquibase), each change would be a new file.

-- Create `users` table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store bcrypt/argon2 hash
    role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- e.g., 'admin', 'viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create `services` table for monitored applications/services
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    api_key UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL, -- For metric ingestion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create `metrics` table for storing performance data
CREATE TABLE metrics (
    id BIGSERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- e.g., 'CPU_USAGE', 'MEMORY_USAGE', 'REQUEST_LATENCY', 'ERROR_RATE', 'CUSTOM_METRIC'
    value DOUBLE PRECISION NOT NULL,
    tags JSONB DEFAULT '{}', -- Flexible key-value pairs for additional context (e.g., region, environment, endpoint)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_metrics_service_id_timestamp ON metrics (service_id, timestamp DESC);
CREATE INDEX idx_metrics_metric_type ON metrics (metric_type);
CREATE INDEX idx_metrics_tags ON metrics USING GIN (tags);

-- Create `alert_rules` table
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    operator VARCHAR(10) NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    target_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, metric_type, name)
);

-- Create `active_alerts` table
CREATE TABLE active_alerts (
    id BIGSERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'critical'
);

-- Seed data for initial setup (these would typically be in a separate `seed.sql` or managed by app logic)
-- For demo, adding here for ease of `docker-compose up` setup.
INSERT INTO users (username, password_hash, role) VALUES
    ('admin', '$2a$10$abcdefghabcdefghabcdefgh.u0L/Vv2hF/4oY/pY2z.q1', 'admin') ON CONFLICT (username) DO NOTHING;
INSERT INTO users (username, password_hash, role) VALUES
    ('viewer', '$2a$10$abcdefghabcdefghabcdefgh.u0L/Vv2hF/4oY/pY2z.q1', 'viewer') ON CONFLICT (username) DO NOTHING;

INSERT INTO services (name, description) VALUES
    ('WebApp Service 1', 'Main customer-facing web application backend.'),
    ('Payment Gateway', 'Critical service for processing payments.'),
    ('Analytics Worker', 'Background service for data processing.')
ON CONFLICT (name) DO NOTHING;

```