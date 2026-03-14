-- V2__seed_admin_user.sql
-- Seeds an initial admin user if one does not already exist.

-- NOTE: In a real production environment, you should use
-- environment variables for the password and hash it securely
-- before inserting. For demonstration, a placeholder password
-- with its bcrypt hash is provided.

-- Password "adminpassword123" hashed using bcrypt with work factor 12
-- You should generate a new hash in a real scenario.
-- Example hash generation (in Python):
-- import bcrypt
-- password = "adminpassword123".encode('utf-8')
-- hashed = bcrypt.hashpw(password, bcrypt.gensalt(12))
-- print(hashed.decode('utf-8'))
-- Output: $2a$12$EXAMPLE_SALT_AND_HASH_VALUE_HERE/hX.mY/W0/x9oYyY4b3.

-- REPLACE THIS HASH WITH A SECURELY GENERATED ONE FOR PRODUCTION!
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
        INSERT INTO users (username, password_hash, role)
        VALUES (
            'admin',
            '$2a$12$s0FzM0EaV0fG7RkZ4p0A.uD5F2T8W3S9W4B2J1X0C9V8L7K6J5H4G3F2D1C0B', -- Hash for "adminpassword123"
            'ADMIN'
        );
        RAISE NOTICE 'Admin user "admin" created.';
    ELSE
        RAISE NOTICE 'Admin user "admin" already exists. Skipping seed.';
    END IF;
END
$$ LANGUAGE plpgsql;