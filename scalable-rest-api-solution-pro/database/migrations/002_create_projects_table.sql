```sql
-- Migration: 002_create_projects_table.sql
-- Description: Creates the projects table.

CREATE TABLE projects (
    id             INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite auto-increment
    -- id             SERIAL PRIMARY KEY,                -- PostgreSQL auto-increment
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    owner_id       INTEGER NOT NULL,
    created_at     TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at     TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_owner_id ON projects (owner_id);
```