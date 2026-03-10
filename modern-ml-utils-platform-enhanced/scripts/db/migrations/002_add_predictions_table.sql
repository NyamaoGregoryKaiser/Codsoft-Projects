```sql
-- Migration 002: Add table for prediction logs
CREATE TABLE IF NOT EXISTS prediction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_version_id INTEGER NOT NULL,
    input_data TEXT NOT NULL, -- JSON string of input features
    output_data TEXT NOT NULL, -- JSON string of prediction output
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL, -- e.g., "SUCCESS", "ERROR"
    error_message TEXT,
    FOREIGN KEY (model_version_id) REFERENCES model_versions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prediction_logs_model_version_id ON prediction_logs (model_version_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_timestamp ON prediction_logs (timestamp);
```