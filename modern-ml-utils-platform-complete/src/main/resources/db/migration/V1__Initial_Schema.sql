```sql
-- Create Roles table
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('ROLE_USER');
INSERT INTO roles (name) VALUES ('ROLE_ADMIN');

-- Create Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- Create User_Roles join table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- Create Models table
CREATE TABLE models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    owner VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Model_Versions table
CREATE TABLE model_versions (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    model_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED', -- e.g., UPLOADED, VALIDATED, DEPLOYED, ARCHIVED
    metadata TEXT, -- JSON string for additional metadata
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE,
    UNIQUE (model_id, version_number)
);

-- Create Prediction_Logs table
CREATE TABLE prediction_logs (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL,
    model_version_number INT NOT NULL,
    request_payload TEXT NOT NULL,
    response_payload TEXT NOT NULL,
    user_id VARCHAR(50), -- Can be anonymous or authenticated user ID
    client_ip VARCHAR(50),
    predicted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    latency_ms BIGINT,
    FOREIGN KEY (model_id) REFERENCES models (id) ON DELETE CASCADE -- Link to models, even if version is deleted
);

```