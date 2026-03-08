-- V1__initial_schema.sql

-- Create Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    password_reset_token VARCHAR(64),
    password_reset_token_expiry BIGINT, -- Stored as epoch milliseconds
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Roles table
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create User_Roles join table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- Create Tasks table
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create Refresh_Tokens table
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id BIGINT UNIQUE NOT NULL, -- One refresh token per user (can be changed for multiple sessions)
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_tasks_user_id ON tasks (user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expiry_date ON refresh_tokens (expiry_date);
CREATE INDEX idx_users_password_reset_token ON users (password_reset_token);

-- Add comments for better documentation (optional)
COMMENT ON TABLE users IS 'Stores user accounts and their authentication details.';
COMMENT ON COLUMN users.email IS 'Unique email address for user login and communication.';
COMMENT ON COLUMN users.password IS 'Hashed password for user authentication.';
COMMENT ON TABLE roles IS 'Stores predefined roles for authorization (e.g., USER, ADMIN).';
COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles.';
COMMENT ON TABLE tasks IS 'Stores tasks created by users.';
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for persistent login sessions.';
```