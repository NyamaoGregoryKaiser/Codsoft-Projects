```sql
-- Migration: 001_create_users_table.sql
-- Description: Creates the users table.

CREATE TABLE users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite auto-increment
    -- id             SERIAL PRIMARY KEY,                -- PostgreSQL auto-increment
    username       VARCHAR(255) NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    created_at     TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), -- SQLite timestamp
    updated_at     TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))  -- SQLite timestamp
    -- created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- PostgreSQL timestamp
    -- updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP    -- PostgreSQL timestamp
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
```