-- Insert default admin user if not exists (for H2 or if Flyway is disabled)
-- Password for 'admin' is 'password' (encoded with BCrypt for Spring Security)
-- This is mainly for H2/dev. For production PostgreSQL, use V2__Add_users_table.sql with an insert statement or manual insertion.
INSERT INTO users (id, username, password, roles, enabled)
SELECT gen_random_uuid(), 'admin', '$2a$10$wN9i0gIe9S4GzM6C1zN3q.L2Xk/q.y.s8.n/l.K4.m.P.L0.B.Q.B.G', 'ROLE_USER,ROLE_ADMIN', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Password for 'user' is 'password'
INSERT INTO users (id, username, password, roles, enabled)
SELECT gen_random_uuid(), 'user', '$2a$10$wN9i0gIe9S4GzM6C1zN3q.L2Xk/q.y.s8.n/l.K4.m.P.L0.B.Q.B.G', 'ROLE_USER', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'user');