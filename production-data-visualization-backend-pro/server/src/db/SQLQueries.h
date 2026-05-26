#pragma once

#include <string>

namespace SQLQueries {

// User Management
const std::string CREATE_USER_TABLE = R"(
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
)";

const std::string INSERT_USER = R"(
    INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id;
)";

const std::string SELECT_USER_BY_USERNAME = R"(
    SELECT id, username, email, password_hash FROM users WHERE username = $1;
)";

const std::string SELECT_USER_BY_ID = R"(
    SELECT id, username, email FROM users WHERE id = $1;
)";

// Dataset Management
const std::string CREATE_DATASET_TABLE = R"(
    CREATE TABLE IF NOT EXISTS datasets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        file_path VARCHAR(255) NOT NULL, -- Path to the stored CSV/JSON file
        data_schema JSONB,              -- Store schema (column names, types) as JSON
        row_count INT DEFAULT 0,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
    );
)";

const std::string INSERT_DATASET = R"(
    INSERT INTO datasets (user_id, name, description, file_path, data_schema, row_count)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
)";

const std::string SELECT_DATASET_BY_ID_AND_USER = R"(
    SELECT id, user_id, name, description, file_path, data_schema, row_count, uploaded_at
    FROM datasets WHERE id = $1 AND user_id = $2;
)";

const std::string SELECT_ALL_DATASETS_BY_USER = R"(
    SELECT id, user_id, name, description, row_count, uploaded_at FROM datasets WHERE user_id = $1 ORDER BY uploaded_at DESC;
)";

const std::string UPDATE_DATASET = R"(
    UPDATE datasets
    SET name = $1, description = $2, data_schema = $3, row_count = $4, updated_at = CURRENT_TIMESTAMP
    WHERE id = $5 AND user_id = $6 RETURNING id;
)";

const std::string DELETE_DATASET = R"(
    DELETE FROM datasets WHERE id = $1 AND user_id = $2 RETURNING id;
)";

// Dashboard Management
const std::string CREATE_DASHBOARD_TABLE = R"(
    CREATE TABLE IF NOT EXISTS dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        config JSONB,                   -- Store layout, widget config as JSON
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
    );
)";

const std::string INSERT_DASHBOARD = R"(
    INSERT INTO dashboards (user_id, name, description, config)
    VALUES ($1, $2, $3, $4) RETURNING id;
)";

const std::string SELECT_DASHBOARD_BY_ID_AND_USER = R"(
    SELECT id, user_id, name, description, config, created_at, updated_at
    FROM dashboards WHERE id = $1 AND user_id = $2;
)";

const std::string SELECT_ALL_DASHBOARDS_BY_USER = R"(
    SELECT id, user_id, name, description, created_at FROM dashboards WHERE user_id = $1 ORDER BY created_at DESC;
)";

const std::string UPDATE_DASHBOARD = R"(
    UPDATE dashboards
    SET name = $1, description = $2, config = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND user_id = $5 RETURNING id;
)";

const std::string DELETE_DASHBOARD = R"(
    DELETE FROM dashboards WHERE id = $1 AND user_id = $2 RETURNING id;
)";

} // namespace SQLQueries
```