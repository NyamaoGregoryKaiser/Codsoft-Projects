-- Insert initial users
INSERT INTO users (username, email, password, role, created_at, updated_at) VALUES
('admin', 'admin@example.com', '$2a$10$T8B1oP7S.v.l.J.z.9.QY.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), -- password: admin
('user1', 'user1@example.com', '$2a$10$T8B1oP7S.v.l.J.z.9.QY.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),   -- password: user1
('user2', 'user2@example.com', '$2a$10$T8B1oP7S.v.l.J.z.9.QY.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z.J.z', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);   -- password: user2

-- Insert initial projects
INSERT INTO projects (name, description, created_by_user_id, created_at, updated_at) VALUES
('DevOps Automation', 'Automate CI/CD for ETMS application.', (SELECT id FROM users WHERE username = 'admin'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Frontend Revamp', 'Improve UI/UX of the React application.', (SELECT id FROM users WHERE username = 'user1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Database Optimization', 'Optimize database queries and schema.', (SELECT id FROM users WHERE username = 'admin'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert initial tasks
INSERT INTO tasks (title, description, status, priority, project_id, assigned_to_user_id, due_date, created_at, updated_at) VALUES
('Setup GitHub Actions', 'Configure workflows for build and deploy.', 'IN_PROGRESS', 'HIGH', (SELECT id FROM projects WHERE name = 'DevOps Automation'), (SELECT id FROM users WHERE username = 'admin'), '2024-06-30 23:59:59', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Implement React Components', 'Develop reusable UI components for forms.', 'OPEN', 'MEDIUM', (SELECT id FROM projects WHERE name = 'Frontend Revamp'), (SELECT id FROM users WHERE username = 'user1'), '2024-07-15 17:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Write Unit Tests for Services', 'Achieve 80% coverage for backend services.', 'REVIEW', 'HIGH', (SELECT id FROM projects WHERE name = 'DevOps Automation'), (SELECT id FROM users WHERE username = 'admin'), '2024-06-25 10:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Refactor Project Dashboard', 'Enhance project overview page.', 'OPEN', 'LOW', (SELECT id FROM projects WHERE name = 'Frontend Revamp'), (SELECT id FROM users WHERE username = 'user2'), '2024-07-30 23:59:59', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Index frequently queried tables', 'Add B-tree indexes to optimize select statements.', 'DONE', 'HIGH', (SELECT id FROM projects WHERE name = 'Database Optimization'), (SELECT id FROM users WHERE username = 'admin'), '2024-06-20 12:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);