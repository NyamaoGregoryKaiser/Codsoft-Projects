-- Insert default roles
INSERT INTO roles (name) VALUES ('ROLE_USER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_EDITOR') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT (name) DO NOTHING;

-- Initial admin user is handled by AuthService @PostConstruct for simplicity in development.
-- In a production setup, you might seed an admin here with a hashed password,
-- or use environment variables for sensitive data.
-- Example (DO NOT USE THIS PASSWORD IN PRODUCTION):
-- INSERT INTO users (username, email, password, enabled, created_at, updated_at)
-- VALUES ('admin', 'admin@example.com', '$2a$10$89X7bF6c9s0Z.F2e1m2q.e/j7o0V.A5w.Q4.D.c.c.H.z.x.y.w.A.', TRUE, NOW(), NOW())
-- ON CONFLICT (username) DO NOTHING;
-- Then link roles
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT u.id, r.id FROM users u, roles r
-- WHERE u.username = 'admin' AND r.name IN ('ROLE_ADMIN', 'ROLE_EDITOR', 'ROLE_USER')
-- ON CONFLICT (user_id, role_id) DO NOTHING;