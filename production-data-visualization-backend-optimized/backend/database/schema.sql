```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create data_sources table
CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path to the stored CSV file
    file_type TEXT NOT NULL DEFAULT 'csv',
    column_headers TEXT NOT NULL, -- JSON array of column names
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create visualizations table
CREATE TABLE IF NOT EXISTS visualizations (
    id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
    user_id TEXT NOT NULL,
    data_source_id TEXT NOT NULL,
    name TEXT NOT NULL,
    chart_type TEXT NOT NULL, -- e.g., 'bar', 'line', 'pie', 'scatter'
    config TEXT NOT NULL,     -- JSON object for chart configuration (e.g., x-axis, y-axis, colors)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

-- Create dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
    id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create dashboard_visualizations junction table
CREATE TABLE IF NOT EXISTS dashboard_visualizations (
    dashboard_id TEXT NOT NULL,
    visualization_id TEXT NOT NULL,
    position TEXT, -- JSON object for layout {x, y, w, h}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dashboard_id, visualization_id),
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    FOREIGN KEY (visualization_id) REFERENCES visualizations(id) ON DELETE CASCADE
);
```