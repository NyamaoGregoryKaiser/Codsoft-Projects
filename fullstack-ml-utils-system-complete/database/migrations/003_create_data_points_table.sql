-- Migration 003: Create data_points table

CREATE TABLE data_points (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    input_data JSONB NOT NULL,
    prediction JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_model
        FOREIGN KEY (model_id)
        REFERENCES ml_models (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_data_points_model_user ON data_points (model_id, user_id);
CREATE INDEX idx_data_points_created_at ON data_points (created_at DESC);
```