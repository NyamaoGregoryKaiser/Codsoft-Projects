```sql
-- Seed data for initial development

-- Insert a test user
INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES
('testuser', 'test@example.com', '', (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))), -- Password 'password' simpleXORHash
('adminuser', 'admin@example.com', '', (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))); -- Password 'password'

-- Insert some projects for testuser (id=1)
INSERT INTO projects (name, description, owner_id, created_at, updated_at) VALUES
('Project Alpha', 'First project managed by testuser.', 1, (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))),
('Project Beta', 'Second project, more complex requirements.', 1, (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')));

-- Insert some tasks for Project Alpha (id=1) and Project Beta (id=2)
INSERT INTO tasks (title, description, project_id, assigned_user_id, status, due_date, created_at, updated_at) VALUES
('Implement user registration', 'Backend endpoint for new user signups.', 1, 1, 'IN_PROGRESS', '2023-12-31T23:59:59Z', (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))),
('Design API documentation', 'Write comprehensive OpenAPI docs for all endpoints.', 1, 1, 'OPEN', '2024-01-15T17:00:00Z', (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))),
('Setup CI/CD pipeline', 'Configure GitHub Actions for automated builds and tests.', 2, 1, 'OPEN', '2024-01-20T09:00:00Z', (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))),
('Perform performance testing', 'Benchmark API endpoints under load.', 2, 1, 'OPEN', '2024-02-01T12:00:00Z', (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')), (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')));
```