-- V1__create_users_table.sql
-- Creates the users table for the authentication system.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER', -- e.g., 'USER', 'ADMIN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a unique index on username for faster lookups and to enforce uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Function to update 'updated_at' column automatically
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update_timestamp function before update operations on the users table
CREATE OR REPLACE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

COMMENT ON TABLE users IS 'Stores user accounts, including authentication credentials and roles.';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user.';
COMMENT ON COLUMN users.username IS 'Unique username for login.';
COMMENT ON COLUMN users.password_hash IS 'Hashed password for the user.';
COMMENT ON COLUMN users.role IS 'User role (e.g., USER, ADMIN) for authorization.';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created.';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user account was last updated.';

-- Add check constraint for valid roles (optional, but good practice)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN'));
    END IF;
END
$$;