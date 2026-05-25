```sql
-- Seed Data

-- Clear existing data (optional, for development only)
TRUNCATE TABLE messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE user_rooms RESTART IDENTITY CASCADE;
TRUNCATE TABLE rooms RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Insert Users
-- Passwords are 'password123' hashed with a dummy salt for demonstration
-- In a real scenario, use PasswordHasher::create_password_hash during seed generation
INSERT INTO users (username, email, password_hash) VALUES
('alice', 'alice@example.com', 'dummy_salt_alice$2a$10$abcdefghijklmnopqrstuvwx.y.z.12345'), -- Replace with actual hash
('bob', 'bob@example.com', 'dummy_salt_bob$2a$10$ABCDEFGHIJKLMNOPQRSTUVW.X.Y.Z.12345'),   -- Replace with actual hash
('charlie', 'charlie@example.com', 'dummy_salt_charlie$2a$10$abcdefghijklmnopqrs.tuvwx.yz.1'), -- Replace with actual hash
('diana', 'diana@example.com', 'dummy_salt_diana$2a$10$abcdefghijklmnopqrstuvw.xy.z.1234'); -- Replace with actual hash

-- Insert Rooms
INSERT INTO rooms (name, owner_id) VALUES
('General Chat', (SELECT id FROM users WHERE username = 'alice')),
('Dev Discussion', (SELECT id FROM users WHERE username = 'bob')),
('Random Stuff', (SELECT id FROM users WHERE username = 'alice'));

-- Add users to rooms
-- Alice joins General Chat
INSERT INTO user_rooms (user_id, room_id) VALUES
((SELECT id FROM users WHERE username = 'alice'), (SELECT id FROM rooms WHERE name = 'General Chat'));
-- Bob joins General Chat and Dev Discussion
INSERT INTO user_rooms (user_id, room_id) VALUES
((SELECT id FROM users WHERE username = 'bob'), (SELECT id FROM rooms WHERE name = 'General Chat')),
((SELECT id FROM users WHERE username = 'bob'), (SELECT id FROM rooms WHERE name = 'Dev Discussion'));
-- Charlie joins General Chat
INSERT INTO user_rooms (user_id, room_id) VALUES
((SELECT id FROM users WHERE username = 'charlie'), (SELECT id FROM rooms WHERE name = 'General Chat'));
-- Diana joins Dev Discussion
INSERT INTO user_rooms (user_id, room_id) VALUES
((SELECT id FROM users WHERE username = 'diana'), (SELECT id FROM rooms WHERE name = 'Dev Discussion'));

-- Insert Messages
INSERT INTO messages (room_id, sender_id, content) VALUES
((SELECT id FROM rooms WHERE name = 'General Chat'), (SELECT id FROM users WHERE username = 'alice'), 'Hello everyone in General Chat!'),
((SELECT id FROM rooms WHERE name = 'General Chat'), (SELECT id FROM users WHERE username = 'bob'), 'Hey Alice!'),
((SELECT id FROM rooms WHERE name = 'Dev Discussion'), (SELECT id FROM users WHERE username = 'bob'), 'Starting a discussion on microservices architecture.'),
((SELECT id FROM rooms WHERE name = 'General Chat'), (SELECT id FROM users WHERE username = 'charlie'), 'Good to see you all.'),
((SELECT id FROM rooms WHERE name = 'Dev Discussion'), (SELECT id FROM users WHERE username = 'diana'), 'I''m in! What specific patterns are we looking at?');
```