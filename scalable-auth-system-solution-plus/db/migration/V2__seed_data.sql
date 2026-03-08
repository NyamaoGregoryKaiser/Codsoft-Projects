-- V2__seed_data.sql

-- Insert default roles
INSERT INTO roles (name, created_at, updated_at) VALUES
('USER', NOW(), NOW()),
('ADMIN', NOW(), NOW())
ON CONFLICT (name) DO NOTHING; -- Prevents errors if roles already exist

-- Insert an admin user
-- Password for admin@example.com is 'adminpass' (hashed with BCrypt)
-- You should replace this with a securely generated hash in production.
INSERT INTO users (username, email, password, enabled, created_at, updated_at) VALUES
('admin', 'admin@example.com', '$2a$10$T8B.rWz3j5XhN/Xj.B.L8O.HjT.V8P.R6A.H3K.E.A0Y.Z7.W7', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password; -- Update if user exists

-- Link admin user to ADMIN and USER roles
DO $$
DECLARE
    admin_user_id BIGINT;
    user_role_id BIGINT;
    admin_role_id BIGINT;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@example.com';
    SELECT id INTO user_role_id FROM roles WHERE name = 'USER';
    SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';

    IF admin_user_id IS NOT NULL AND user_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (admin_user_id, user_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    IF admin_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (admin_user_id, admin_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
END $$;


-- Insert a regular user
-- Password for user@example.com is 'userpass' (hashed with BCrypt)
INSERT INTO users (username, email, password, enabled, created_at, updated_at) VALUES
('regularuser', 'user@example.com', '$2a$10$x4S4.B9j.L8O.HjT.V8P.R6A.H3K.E.A0Y.Z7.W7.L8O.HjT.V8P.R6A.H3K.E.A0Y.Z7.W7', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password;

-- Link regular user to USER role
DO $$
DECLARE
    regular_user_id BIGINT;
    user_role_id BIGINT;
BEGIN
    SELECT id INTO regular_user_id FROM users WHERE email = 'user@example.com';
    SELECT id INTO user_role_id FROM roles WHERE name = 'USER';

    IF regular_user_id IS NOT NULL AND user_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (regular_user_id, user_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
END $$;

-- Insert some tasks for the admin user
DO $$
DECLARE
    admin_user_id BIGINT;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@example.com';

    IF admin_user_id IS NOT NULL THEN
        INSERT INTO tasks (title, description, completed, user_id, created_at, updated_at) VALUES
        ('Setup CI/CD pipeline', 'Configure GitHub Actions for automated builds and deployments.', FALSE, admin_user_id, NOW(), NOW()),
        ('Write API documentation', 'Document all REST endpoints using OpenAPI/Swagger.', TRUE, admin_user_id, NOW(), NOW()),
        ('Review PR #123', 'Check code quality and functionality of the new feature.', FALSE, admin_user_id, NOW(), NOW())
        ON CONFLICT DO NOTHING; -- Prevents inserting duplicate tasks if they are run again
    END IF;
END $$;

-- Insert some tasks for the regular user
DO $$
DECLARE
    regular_user_id BIGINT;
BEGIN
    SELECT id INTO regular_user_id FROM users WHERE email = 'user@example.com';

    IF regular_user_id IS NOT NULL THEN
        INSERT INTO tasks (title, description, completed, user_id, created_at, updated_at) VALUES
        ('Pay bills', 'Monthly electricity and internet bills.', FALSE, regular_user_id, NOW(), NOW()),
        ('Buy groceries', 'Milk, eggs, bread, vegetables.', TRUE, regular_user_id, NOW(), NOW()),
        ('Walk the dog', 'Evening walk for an hour.', FALSE, regular_user_id, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
```