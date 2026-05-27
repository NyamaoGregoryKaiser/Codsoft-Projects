-- Migration 002: Create ml_models table

CREATE TABLE ml_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,

    UNIQUE (owner_id, name, version),

    CONSTRAINT fk_owner
        FOREIGN KEY (owner_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ml_models_owner_id ON ml_models (owner_id);
CREATE INDEX idx_ml_models_name_version ON ml_models (name, version);
```