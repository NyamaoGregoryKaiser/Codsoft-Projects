```cpp
#pragma once

#include <string>

namespace mlops {
namespace database {

// Database schema SQL statements
// These are primarily for reference, actual migrations are done via scripts/db/migrate.py
// and sqlite_orm uses C++ structs for schema definition.

// Initial schema for models and model_versions
const std::string INITIAL_SCHEMA_SQL = R"(
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
)";

// Schema for prediction logs (migration 002)
const std::string PREDICTION_LOGS_SCHEMA_SQL = R"(
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
)";

} // namespace database
} // namespace mlops
```