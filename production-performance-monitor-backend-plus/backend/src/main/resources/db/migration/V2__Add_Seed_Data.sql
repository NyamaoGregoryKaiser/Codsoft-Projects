```sql
-- V2__Add_Seed_Data.sql

-- Insert admin user (password 'adminpass' -> hashed with BCrypt)
-- You would typically hash this password in your application logic.
-- For a raw SQL insert, we'll use a pre-hashed password if you have one.
-- Example BCrypt hash for 'adminpass': $2a$10$wE9l1.S1XJ/Q2Jz5.jX5y.0bZ8K/tJ/Jz5.jX5y.0bZ8K/tJ/
INSERT INTO users (username, email, password) VALUES
    ('admin', 'admin@tasksycpro.com', '$2a$10$wE9l1.S1XJ/Q2Jz5.jX5y.0bZ8K/tJ/Jz5.jX5y.0bZ8K/tJ/'); -- Placeholder, replace with actual hash of 'adminpass'

-- Assign ADMIN and USER roles to admin
INSERT INTO user_roles (user_id, role_id) VALUES
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ADMIN')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'USER'));

-- Insert a regular user (password 'userpass' -> hashed)
INSERT INTO users (username, email, password) VALUES
    ('john.doe', 'john.doe@example.com', '$2a$10$wE9l1.S1XJ/Q2Jz5.jX5y.0bZ8K/tJ/Jz5.jX5y.0bZ8K/tJ/'); -- Placeholder, replace with actual hash of 'userpass'

-- Assign USER role to john.doe
INSERT INTO user_roles (user_id, role_id) VALUES
    ((SELECT id FROM users WHERE username = 'john.doe'), (SELECT id FROM roles WHERE name = 'USER'));

-- Insert sample projects
INSERT INTO projects (name, description, owner_id) VALUES
    ('TaskSync Pro Backend Development', 'Develop the backend API for TaskSync Pro.', (SELECT id FROM users WHERE username = 'admin')),
    ('TaskSync Pro Frontend UI', 'Design and implement the React frontend for TaskSync Pro.', (SELECT id FROM users WHERE username = 'john.doe')),
    ('Monitoring & Observability Setup', 'Set up Prometheus, Grafana, Jaeger, and ELK stack.', (SELECT id FROM users WHERE username = 'admin'));

-- Add members to projects
INSERT INTO project_members (project_id, user_id) VALUES
    ((SELECT id FROM projects WHERE name = 'TaskSync Pro Backend Development'), (SELECT id FROM users WHERE username = 'admin')),
    ((SELECT id FROM projects WHERE name = 'TaskSync Pro Backend Development'), (SELECT id FROM users WHERE username = 'john.doe')),
    ((SELECT id FROM projects WHERE name = 'TaskSync Pro Frontend UI'), (SELECT id FROM users WHERE username = 'john.doe')),
    ((SELECT id FROM projects WHERE name = 'Monitoring & Observability Setup'), (SELECT id FROM users WHERE username = 'admin'));

-- Insert sample tasks
INSERT INTO tasks (title, description, status, project_id, assigned_to_id, due_date) VALUES
    ('Implement User Authentication', 'Develop JWT-based authentication for user login/registration.', 'IN_PROGRESS',
     (SELECT id FROM projects WHERE name = 'TaskSync Pro Backend Development'), (SELECT id FROM users WHERE username = 'admin'), '2024-06-15 23:59:59'),
    ('Design Database Schema', 'Define tables for users, projects, tasks, and roles.', 'DONE',
     (SELECT id FROM projects WHERE name = 'TaskSync Pro Backend Development'), (SELECT id FROM users WHERE username = 'admin'), '2024-05-20 23:59:59'),
    ('Create Project Management UI', 'Develop React components for listing, creating, and updating projects.', 'TODO',
     (SELECT id FROM projects WHERE name = 'TaskSync Pro Frontend UI'), (SELECT id FROM users WHERE username = 'john.doe'), '2024-06-30 23:59:59'),
    ('Set up Prometheus & Grafana', 'Configure Prometheus to scrape metrics and Grafana dashboards.', 'IN_PROGRESS',
     (SELECT id FROM projects WHERE name = 'Monitoring & Observability Setup'), (SELECT id FROM users WHERE username = 'admin'), '2024-06-25 23:59:59'),
    ('Integrate OpenTelemetry for Tracing', 'Add OpenTelemetry agent and configure Jaeger exporter.', 'TODO',
     (SELECT id FROM projects WHERE name = 'Monitoring & Observability Setup'), (SELECT id FROM users WHERE username = 'admin'), '2024-07-05 23:59:59');
```