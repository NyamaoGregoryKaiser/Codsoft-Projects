INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_USER') ON CONFLICT (name) DO NOTHING;

-- Passwords are 'admin' and 'user' respectively, hashed with BCrypt
INSERT INTO users (first_name, last_name, username, email, password) VALUES
('Admin', 'User', 'admin', 'admin@task.com', '$2a$10$wE0rX/T/jYQx7eC8k0O5M.8vX7C.J4q/oQ/L6G5fP3t2kQ0mZ0R0S') ON CONFLICT (username) DO NOTHING;
-- Password for 'admin' is 'admin', generated via BCryptPasswordEncoder().encode("admin")

INSERT INTO users (first_name, last_name, username, email, password) VALUES
('Regular', 'User', 'user', 'user@task.com', '$2a$10$wE0rX/T/jYQx7eC8k0O5M.8vX7C.J4q/oQ/L6G5fP3t2kQ0mZ0R0S') ON CONFLICT (username) DO NOTHING;
-- Password for 'user' is 'user', generated via BCryptPasswordEncoder().encode("user")

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_USER'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'user' AND r.name = 'ROLE_USER'
ON CONFLICT (user_id, role_id) DO NOTHING;