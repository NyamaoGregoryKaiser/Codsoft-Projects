-- PostgreSQL schema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE data_table (
    id SERIAL PRIMARY KEY,
    data JSONB  -- Example data type, adapt as needed
);

-- Add indexes as needed based on query patterns.  Consider adding partial indexes or
-- GIN/GIN indexes for JSONB data depending on your query requirements.
CREATE INDEX idx_data_table_data ON data_table USING GIN (data);