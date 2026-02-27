-- Insert initial users
INSERT INTO users (username, email, password, role) VALUES
    ('admin', 'admin@projectpulse.com', '$2a$10$wE1M2C8Vb/E/y3J3N7H38O.lB3.Z9P0.k7K4k4.Z2L.C6O9L8Q7', 'ADMIN'), -- password: admin
    ('user1', 'user1@projectpulse.com', '$2a$10$yX.b7R.A7z8Q2K2F.C5G3E.y0H.x9P1.k7K4k4.Z2L.C6O9L8Q7', 'USER'),  -- password: password
    ('user2', 'user2@projectpulse.com', '$2a$10$zY.c8S.B8a9R3L3G.y1I.y0J.x9P1.k7K4k4.Z2L.C6O9L8Q7', 'USER');  -- password: password

-- Insert initial projects
INSERT INTO projects (name, description, created_by_user_id) VALUES
    ('ProjectPulse Backend API', 'Develop and maintain the core backend API for ProjectPulse.', (SELECT id FROM users WHERE username = 'admin')),
    ('ProjectPulse Frontend UI', 'Build a modern and responsive user interface using React.', (SELECT id FROM users WHERE username = 'admin')),
    ('Marketing Campaign Q2', 'Plan and execute marketing strategies for Q2 product launch.', (SELECT id FROM users WHERE username = 'user1')),
    ('Database Migration', 'Migrate existing database to PostgreSQL and optimize schemas.', (SELECT id FROM users WHERE username = 'user2'));

-- Insert initial tasks
INSERT INTO tasks (title, description, status, project_id, assigned_to_user_id) VALUES
    ('Implement User Authentication', 'Develop JWT-based authentication endpoints and logic.', 'COMPLETED', (SELECT id FROM projects WHERE name = 'ProjectPulse Backend API'), (SELECT id FROM users WHERE username = 'admin')),
    ('Create Project CRUD Endpoints', 'Implement full CRUD for projects with validation.', 'IN_PROGRESS', (SELECT id FROM projects WHERE name = 'ProjectPulse Backend API'), (SELECT id FROM users WHERE username = 'user1')),
    ('Design Database Schema', 'Define tables for users, projects, and tasks.', 'COMPLETED', (SELECT id FROM projects WHERE name = 'ProjectPulse Backend API'), (SELECT id FROM users WHERE username = 'admin')),
    ('Setup React Environment', 'Initialize React app, configure Tailwind CSS, and routing.', 'COMPLETED', (SELECT id FROM projects WHERE name = 'ProjectPulse Frontend UI'), (SELECT id FROM users WHERE username = 'admin')),
    ('Build Project Listing Page', 'Create a page to display all projects.', 'IN_PROGRESS', (SELECT id FROM projects WHERE name = 'ProjectPulse Frontend UI'), (SELECT id FROM users WHERE username = 'user1')),
    ('Develop Login/Register Forms', 'Implement forms for user login and registration.', 'PENDING', (SELECT id FROM projects WHERE name = 'ProjectPulse Frontend UI'), (SELECT id FROM users WHERE username = 'user2')),
    ('Social Media Strategy', 'Develop a comprehensive social media marketing plan.', 'PENDING', (SELECT id FROM projects WHERE name = 'Marketing Campaign Q2'), (SELECT id FROM users WHERE username = 'user1')),
    ('Email Campaign Setup', 'Configure email marketing platform and design templates.', 'PENDING', (SELECT id FROM projects WHERE name = 'Marketing Campaign Q2'), (SELECT id FROM users WHERE username = 'user1')),
    ('PostgreSQL Schema Refinement', 'Review and refine table definitions and relationships.', 'IN_PROGRESS', (SELECT id FROM projects WHERE name = 'Database Migration'), (SELECT id FROM users WHERE username = 'user2')),
    ('Data Migration Scripting', 'Write scripts to transfer data from old database to new PostgreSQL.', 'PENDING', (SELECT id FROM projects WHERE name = 'Database Migration'), (SELECT id FROM users WHERE username = 'user2'));
```

***

### 3. Configuration & Setup

**`docker-compose.yml`**
```yaml