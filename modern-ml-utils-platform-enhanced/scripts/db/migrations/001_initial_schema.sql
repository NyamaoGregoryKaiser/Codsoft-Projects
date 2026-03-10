```sql
-- Migration 001: Initial schema for models and model_versions
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    version_tag TEXT NOT NULL,
    model_path TEXT NOT NULL, -- Path to the actual model file/directory
    created_at TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 0,
    parameters TEXT, -- JSON string of model parameters (e.g., coefficients)
    notes TEXT,
    FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE,
    UNIQUE(model_id, version_tag)
);

CREATE INDEX IF NOT EXISTS idx_model_versions_model_id ON model_versions (model_id);
CREATE INDEX IF NOT EXISTS idx_models_name ON models (name);
```