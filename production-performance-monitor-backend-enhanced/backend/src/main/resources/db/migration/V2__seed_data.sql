```sql
-- V2__seed_data.sql

-- Seed Admin User (password: 'password')
INSERT INTO users (id, username, email, password, roles) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@taskflow.com', '$2a$10$wE4H5E/hP/sK4XgB6.g1t.t9S8N0d8A2g5L7k9I0j6M2y7c.S8O0q0', 'ROLE_ADMIN,ROLE_USER') -- BCrypt for 'password'
ON CONFLICT (username) DO NOTHING;

-- Seed Regular User (password: 'password')
INSERT INTO users (id, username, email, password, roles) VALUES
    ('22222222-2222-2222-2222-222222222222', 'john.doe', 'john.doe@example.com', '$2a$10$wE4H5E/hP/sK4XgB6.g1t.t9S8N0d8A2g5L7k9I0j6M2y7c.S8O0q0', 'ROLE_USER') -- BCrypt for 'password'
ON CONFLICT (username) DO NOTHING;

-- Seed Another Regular User (password: 'password')
INSERT INTO users (id, username, email, password, roles) VALUES
    ('33333333-3333-3333-3333-333333333333', 'jane.smith', 'jane.smith@example.com', '$2a$10$wE4H5E/hP/sK4XgB6.g1t.t9S8N0d8A2g5L7k9I0j6M2y7c.S8O0q0', 'ROLE_USER') -- BCrypt for 'password'
ON CONFLICT (username) DO NOTHING;

-- Seed Projects
INSERT INTO projects (id, name, description, owner_id) VALUES
    ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'TaskFlow Backend Development', 'Develop the Spring Boot backend for the TaskFlow application.', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, owner_id) VALUES
    ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'TaskFlow Frontend UI/UX', 'Design and implement the React frontend for a seamless user experience.', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, owner_id) VALUES
    ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Marketing Campaign Q2', 'Plan and execute marketing activities for Q2.', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Seed Tasks
INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assignee_id) VALUES
    ('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Implement User Authentication', 'Develop JWT-based authentication and authorization for the backend.', 'IN_PROGRESS', 'HIGH', '2024-06-15 17:00:00+00', 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assignee_id) VALUES
    ('e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', 'Design Database Schema', 'Define tables, relationships, and indices for User, Project, and Task entities.', 'DONE', 'HIGH', '2024-05-30 17:00:00+00', 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assignee_id) VALUES
    ('f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5', 'Create Project Listing Page', 'Build a React component to display a list of projects with CRUD actions.', 'TO_DO', 'MEDIUM', '2024-06-20 17:00:00+00', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assignee_id) VALUES
    ('g6g6g6g6-g6g6-g6g6-g6g6-g6g6g6g6g6g6', 'Develop REST API for Tasks', 'Implement CRUD endpoints for task management in the Spring Boot backend.', 'IN_PROGRESS', 'HIGH', '2024-06-25 17:00:00+00', 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assignee_id) VALUES
    ('h7h7h7h7-h7h7-h7h7-h7h7-h7h7h7h7h7h7', 'Social Media Content Creation', 'Create engaging posts for Facebook, Twitter, and LinkedIn.', 'TO_DO', 'MEDIUM', '2024-06-18 17:00:00+00', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;
```