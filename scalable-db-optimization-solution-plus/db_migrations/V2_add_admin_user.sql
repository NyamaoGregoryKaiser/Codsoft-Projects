```sql
-- V2_add_admin_user.sql
-- This script relies on `BCrypt::generateHash("adminpass")`
-- In production, the password hash should be generated dynamically or stored securely.
-- For demonstration, let's use a pre-generated hash for "adminpass" for a simple bcrypt.
-- A typical bcrypt hash looks like: $2a$10$abcdefghijklmnopqrstuvwxyzaBCDEFGH.IJKLMNOPQRSTUVWX.Y/Z1234567890
-- Example hash for "adminpass" (will vary): $2a$10$wN3d4R6M3N2fM7Y0W9c8wO.xL1H4y2D6g3E9f0B.i.jKkLmMmNnOoPpQqRrSsTtUuVvWwXxYyZz

-- IMPORTANT: Replace with a real generated hash for "adminpass" or similar in production!
-- For a quick demo, I'll use a placeholder. The C++ app will use bcrypt.
-- Running `BCrypt::generateHash("adminpass")` in a scratch C++ program might yield:
-- "$2a$10$d6b2q9e8a7g5c4v3b2z1x0w9u8t7r6p5o4i3u2y1t0r9e8w7q6a5s4d3f2g1h0j" (example only)
INSERT INTO users (username, email, password_hash) VALUES
('admin', 'admin@optidb.com', '$2a$10$0z/h8S9D0M1J2i3U4v5W6e7R8t9Y0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r')
ON CONFLICT (username) DO NOTHING;
```