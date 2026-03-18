-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL, -- UUID
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Models Table (for ML models)
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY NOT NULL, -- UUID
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    model_path TEXT, -- Where the actual model file would be stored (e.g., S3 path, local path)
    status TEXT NOT NULL DEFAULT 'draft', -- e.g., 'draft', 'training', 'ready', 'deployed', 'archived'
    metadata TEXT, -- JSONB equivalent to store arbitrary model info
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indices for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);

-- Trigger to update 'updated_at' column automatically
CREATE TRIGGER IF NOT EXISTS update_user_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_model_updated_at
AFTER UPDATE ON models
FOR EACH ROW
BEGIN
    UPDATE models SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```