```sql
-- V2__Seed_Data.sql

-- Seed Users
-- Passwords are 'password' (bcrypt encoded)
INSERT INTO users (id, username, email, password, role, first_name, last_name) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'admin@example.com', '$2a$10$N2G.77Xk.GjR.V8jN4Bvye9X6M1yQ.D.P.B.t.L.q.O.w.8.S.C.9.C', 'ADMIN', 'Admin', 'User'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'john.doe', 'john.doe@example.com', '$2a$10$N2G.77Xk.GjR.V8jN4Bvye9X6M1yQ.D.P.B.t.L.q.O.w.8.S.C.9.C', 'USER', 'John', 'Doe'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'jane.smith', 'jane.smith@example.com', '$2a$10$N2G.77Xk.GjR.V8jN4Bvye9X6M1yQ.D.P.B.t.L.q.O.w.8.S.C.9.C', 'USER', 'Jane', 'Smith');

-- Seed Projects
INSERT INTO projects (id, name, description, owner_id) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Project Alpha', 'First development project.', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Project Beta', 'Second development project with more features.', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marketing Campaign Q3', 'Campaign for Q3 products.', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Seed Tags
INSERT INTO tags (id, name) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Frontend'),
('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Backend'),
('30eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Database'),
('40eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Urgent'),
('50eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Review');

-- Seed Tasks
INSERT INTO tasks (id, title, description, status, priority, due_date, assignee_id, project_id) VALUES
('60eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Implement User Authentication', 'Develop JWT-based authentication for the API.', 'IN_PROGRESS', 'HIGH', '2024-06-30 23:59:59', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('70eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Design Database Schema', 'Finalize tables for Users, Tasks, Projects, Tags.', 'COMPLETED', 'HIGH', '2024-06-15 17:00:00', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('80eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Develop Task List UI', 'Create React components for displaying and filtering tasks.', 'PENDING', 'MEDIUM', '2024-07-10 23:59:59', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('90eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Refactor API Endpoints', 'Improve consistency and documentation of existing APIs.', 'IN_PROGRESS', 'LOW', NULL, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Seed Task Tags
INSERT INTO task_tags (task_id, tag_id) VALUES
('60eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'), -- Auth -> Backend
('70eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'), -- DB Schema -> Database
('80eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'), -- Task UI -> Frontend
('60eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'); -- Auth -> Urgent

```