```sql
-- V1_create_initial_schema.sql

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Target Databases Table
CREATE TABLE IF NOT EXISTS target_databases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port VARCHAR(10) NOT NULL DEFAULT '5432',
    db_name VARCHAR(100) NOT NULL,
    db_user VARCHAR(100) NOT NULL,
    db_password_enc TEXT NOT NULL, -- Encrypted password for the target DB
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE', -- e.g., 'ACTIVE', 'INACTIVE', 'ERROR'
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name) -- A user cannot have two target databases with the same name
);

-- Query Metrics Table (collected from target databases)
CREATE TABLE IF NOT EXISTS query_metrics (
    id BIGSERIAL PRIMARY KEY,
    target_db_id BIGINT NOT NULL REFERENCES target_databases(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL, -- The actual SQL query
    total_time_ms DOUBLE PRECISION NOT NULL,
    calls BIGINT NOT NULL,
    mean_time_ms DOUBLE PRECISION NOT NULL,
    stddev_time_ms DOUBLE PRECISION NOT NULL,
    rows_returned BIGINT NOT NULL,
    query_plan TEXT, -- JSON or TEXT output of EXPLAIN ANALYZE
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Redundant with collected_at, but keeping BaseModel consistency
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Add index for efficient querying of metrics by target_db_id and time
CREATE INDEX IF NOT EXISTS idx_query_metrics_target_db_id_collected_at ON query_metrics (target_db_id, collected_at DESC);


-- Recommendations Table
CREATE TYPE recommendation_type AS ENUM ('INDEX_SUGGESTION', 'SCHEMA_CHANGE', 'QUERY_REWRITE', 'CONFIGURATION_TWEAK');

CREATE TABLE IF NOT EXISTS recommendations (
    id BIGSERIAL PRIMARY KEY,
    target_db_id BIGINT NOT NULL REFERENCES target_databases(id) ON DELETE CASCADE,
    query_metric_id BIGINT REFERENCES query_metrics(id) ON DELETE SET NULL, -- Optional: Link to a specific problematic query
    type recommendation_type NOT NULL,
    description TEXT NOT NULL,
    suggestion_sql TEXT, -- The SQL code to apply the recommendation (e.g., CREATE INDEX statement)
    rationale TEXT,
    estimated_impact_score DOUBLE PRECISION DEFAULT 0.0, -- e.g., 0-100 score
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Add index for efficient querying of recommendations by target_db_id
CREATE INDEX IF NOT EXISTS idx_recommendations_target_db_id ON recommendations (target_db_id);

-- Trigger function to update `updated_at` column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at') THEN
        CREATE TRIGGER set_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_target_databases_updated_at') THEN
        CREATE TRIGGER set_target_databases_updated_at
        BEFORE UPDATE ON target_databases
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_query_metrics_updated_at') THEN
        CREATE TRIGGER set_query_metrics_updated_at
        BEFORE UPDATE ON query_metrics
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_recommendations_updated_at') THEN
        CREATE TRIGGER set_recommendations_updated_at
        BEFORE UPDATE ON recommendations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

```