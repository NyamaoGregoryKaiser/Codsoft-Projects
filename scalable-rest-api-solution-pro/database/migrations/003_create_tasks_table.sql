```sql
-- Migration: 003_create_tasks_table.sql
-- Description: Creates the tasks table.

CREATE TABLE tasks (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite auto-increment
    -- id                 SERIAL PRIMARY KEY,                -- PostgreSQL auto-increment
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    project_id         INTEGER NOT NULL,
    assigned_user_id   INTEGER NOT NULL,
    status             VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- e.g., 'OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'
    due_date           TEXT, -- ISO 8601 string, or NULL
    created_at         TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at         TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_project_id ON tasks (project_id);
CREATE INDEX idx_tasks_assigned_user_id ON tasks (assigned_user_id);
CREATE INDEX idx_tasks_status ON tasks (status);
```