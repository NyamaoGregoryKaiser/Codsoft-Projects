```sql
-- Seed an initial admin user for development/testing
-- In a real application, this should be handled by a secure provisioning process.
-- The password hash here is for "Password123!" using Argon2 default parameters.
-- It MUST be replaced with a dynamically generated and securely stored hash in production.

-- To generate a hash for "Password123!" using argon2-cpp command line tool (conceptual):
-- echo "Password123!" | argon2 hash

-- Example hash for "Password123!" (this is just an example, generate your own for security)
-- $argon2id$v=19$m=4096,t=3,p=1$c29tZXNhbHQxMg$SOMEHASH_BASE64_ENCODED_VALUE

INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES (
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', -- Example UUID
    'admin',
    'admin@example.com',
    '$argon2id$v=19$m=4096,t=3,p=1$c29tZXNhbHQxMg$dDds7eYmEwYc9pX1X2qGgA' -- Hash for "Password123!" using arbitrary salt, please regenerate!
);
```