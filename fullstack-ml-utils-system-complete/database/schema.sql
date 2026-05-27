-- SQL Schema Definition for ML Utilities System

-- Drop tables if they exist to allow for clean re-creation in development/migration scenarios
DROP TABLE IF EXISTS data_points CASCADE;
DROP TABLE IF EXISTS ml_models CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
-- Stores user authentication and profile information.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Stores bcrypt hash
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- e.g., 'user', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick email lookup (used during login/registration)
CREATE INDEX idx_users_email ON users (email);

-- 2. ML Models Table
-- Stores metadata about registered machine learning models.
CREATE TABLE ml_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., 'classification', 'regression', 'onnx', 'tensorflow'
    file_path TEXT NOT NULL,    -- Path to the actual model file in storage
    description TEXT,
    owner_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,             -- JSONB for flexible, structured model metadata (e.g., input schema, metrics)

    -- Ensure unique name and version combination per owner
    UNIQUE (owner_id, name, version),

    -- Foreign key to users table
    CONSTRAINT fk_owner
        FOREIGN KEY (owner_id)
        REFERENCES users (id)
        ON DELETE CASCADE -- If a user is deleted, their models are also deleted
);

-- Index for quick lookup of models by owner
CREATE INDEX idx_ml_models_owner_id ON ml_models (owner_id);
-- Index for quick lookup of models by name and version
CREATE INDEX idx_ml_models_name_version ON ml_models (name, version);

-- 3. Data Points Table
-- Stores input data and prediction results for ML model inferences.
CREATE TABLE data_points (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    input_data JSONB NOT NULL,   -- The input features provided for inference
    prediction JSONB,            -- The prediction result from the model
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to ml_models table
    CONSTRAINT fk_model
        FOREIGN KEY (model_id)
        REFERENCES ml_models (id)
        ON DELETE CASCADE, -- If a model is deleted, its associated data points are also deleted

    -- Foreign key to users table
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE -- If a user is deleted, their data points are also deleted
);

-- Index for quick lookup of data points by model and user
CREATE INDEX idx_data_points_model_user ON data_points (model_id, user_id);
-- Index for chronological access
CREATE INDEX idx_data_points_created_at ON data_points (created_at DESC);

-- Query Optimization Notes:
-- - `JSONB` type is used for `metadata`, `input_data`, and `prediction` for efficient storage and querying of JSON data.
-- - GIN indexes can be added to JSONB columns if full-text search or specific key-value lookups within JSON are frequently performed.
--   Example: CREATE INDEX idx_ml_models_metadata_gin ON ml_models USING GIN (metadata);
--   CREATE INDEX idx_data_points_input_data_gin ON data_points USING GIN (input_data);
-- - `ON DELETE CASCADE` ensures data integrity and simplifies cleanup for related records.
-- - `UNIQUE` constraints ensure data consistency for key fields.
-- - `TIMESTAMP WITH TIME ZONE` is used for consistent time handling across different servers/zones.
```