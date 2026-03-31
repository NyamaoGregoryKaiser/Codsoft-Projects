-- V2__Add_Seed_Data.sql
-- Seed data for roles and an initial admin user

-- Insert roles
INSERT INTO roles (name) VALUES ('ROLE_USER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT (name) DO NOTHING;

-- Insert an initial admin user
-- Password for 'adminuser' is 'admin123' (BCrypt encoded)
INSERT INTO users (username, email, password, created_at, created_by, updated_at, updated_by)
VALUES ('adminuser', 'admin@example.com', '$2a$10$wN9iLd4j/gSg.wXb.y/oM.gT0bL0J1p.qY0f8Q.a/s.N.J.8X/O.S', CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system')
ON CONFLICT (username) DO NOTHING;

-- Assign ROLE_ADMIN to the admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'adminuser' AND r.name = 'ROLE_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign ROLE_USER to the admin user (admin users usually have both for broader access)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'adminuser' AND r.name = 'ROLE_USER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert a regular user
-- Password for 'testuser' is 'user123' (BCrypt encoded)
INSERT INTO users (username, email, password, created_at, created_by, updated_at, updated_by)
VALUES ('testuser', 'test@example.com', '$2a$10$f3N7eZ3uWf6aZ.vX.1Q.V.L.0P.k.L.z.b.M.2R.1Q.0R.J.5X/Q.R', CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system')
ON CONFLICT (username) DO NOTHING;

-- Assign ROLE_USER to the test user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'testuser' AND r.name = 'ROLE_USER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert some initial notes for testuser
INSERT INTO notes (title, content, user_id, created_at, created_by, updated_at, updated_by)
SELECT 'Test Note 1', 'This is the first note for the test user.', u.id, CURRENT_TIMESTAMP, u.username, CURRENT_TIMESTAMP, u.username
FROM users u WHERE u.username = 'testuser'
ON CONFLICT (id) DO NOTHING;

INSERT INTO notes (title, content, user_id, created_at, created_by, updated_at, updated_by)
SELECT 'Test Note 2', 'This is the second note for the test user.', u.id, CURRENT_TIMESTAMP, u.username, CURRENT_TIMESTAMP, u.username
FROM users u WHERE u.username = 'testuser'
ON CONFLICT (id) DO NOTHING;

-- Insert some initial notes for adminuser
INSERT INTO notes (title, content, user_id, created_at, created_by, updated_at, updated_by)
SELECT 'Admin Note', 'This is a note created by the admin user.', u.id, CURRENT_TIMESTAMP, u.username, CURRENT_TIMESTAMP, u.username
FROM users u WHERE u.username = 'adminuser'
ON CONFLICT (id) DO NOTHING;
```
*(Note: The `password` values are BCrypt hashes for `admin123` and `user123` respectively. You can generate them using `BCryptPasswordEncoder` in a Spring Boot app if you need different ones.)*

---

### 3. Core Application (React Frontend)

#### `frontend/package.json`
```json