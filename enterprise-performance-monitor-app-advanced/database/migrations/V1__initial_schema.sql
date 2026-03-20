```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For gen_random_uuid() if not available by default

-- Table for Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE UNIQUE INDEX idx_applications_user_id_name ON applications(user_id, name);

-- Table for Metric Definitions
CREATE TABLE metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'cpu_utilization', 'memory_usage_mb', 'request_latency_ms'
    unit VARCHAR(50),           -- e.g., '%', 'MB', 'ms'
    type VARCHAR(50) NOT NULL,  -- e.g., 'gauge', 'counter', 'histogram'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_id, name)
);
CREATE INDEX idx_metric_definitions_app_id ON metric_definitions(app_id);

-- Table for Metric Data
CREATE TABLE metric_data (
    id BIGSERIAL PRIMARY KEY,
    definition_id UUID NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    value DOUBLE PRECISION NOT NULL
);
CREATE INDEX idx_metric_data_definition_id_timestamp ON metric_data(definition_id, timestamp DESC);
```