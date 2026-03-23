-- V2__seed_data.sql

-- Seed Users
-- Passwords are 'password123' encoded with BCrypt (spring security default strength)
INSERT INTO users (username, password, email, created_at, updated_at) VALUES
('alice', '$2a$10$wTfV/G2L3LwB.oP5o/XW2u.G0g9oJ/vL.nJ8bJ7q/Z8g5r.5u.9Q', 'alice@example.com', NOW(), NOW()),
('bob', '$2a$10$wTfV/G2L3LwB.oP5o/XW2u.G0g9oJ/vL.nJ8bJ7q/Z8g5r.5u.9Q', 'bob@example.com', NOW(), NOW()),
('charlie', '$2a$10$wTfV/G2L3LwB.oP5o/XW2u.G0g9oJ/vL.nJ8bJ7q/Z8g5r.5u.9Q', 'charlie@example.com', NOW(), NOW());

-- Get user IDs for relationship tables
DO $$
DECLARE
    alice_id BIGINT;
    bob_id BIGINT;
    charlie_id BIGINT;
    room1_id BIGINT;
    room2_id BIGINT;
BEGIN
    SELECT id INTO alice_id FROM users WHERE username = 'alice';
    SELECT id INTO bob_id FROM users WHERE username = 'bob';
    SELECT id INTO charlie_id FROM users WHERE username = 'charlie';

    -- Seed Chat Rooms
    INSERT INTO chat_rooms (name, description, creator_id, created_at, updated_at) VALUES
    ('General Discussion', 'A chat room for general topics.', alice_id, NOW(), NOW())
    RETURNING id INTO room1_id;

    INSERT INTO chat_rooms (name, description, creator_id, created_at, updated_at) VALUES
    ('Development Team', 'Discussions for the dev team.', bob_id, NOW(), NOW())
    RETURNING id INTO room2_id;

    -- Seed Chat Room Participants
    INSERT INTO chat_room_participants (user_id, chat_room_id, joined_at) VALUES
    (alice_id, room1_id, NOW()),
    (bob_id, room1_id, NOW()),
    (charlie_id, room1_id, NOW()), -- Charlie joins General Discussion

    (bob_id, room2_id, NOW()),
    (alice_id, room2_id, NOW()); -- Alice joins Development Team

    -- Seed Messages for General Discussion
    INSERT INTO messages (chat_room_id, sender_id, content, timestamp) VALUES
    (room1_id, alice_id, 'Hello everyone! Welcome to the General Discussion.', NOW() - INTERVAL '30 minutes'),
    (room1_id, bob_id, 'Hi Alice! Glad to be here.', NOW() - INTERVAL '28 minutes'),
    (room1_id, charlie_id, 'Hey folks!', NOW() - INTERVAL '25 minutes'),
    (room1_id, alice_id, 'What are we discussing today?', NOW() - INTERVAL '20 minutes'),
    (room1_id, bob_id, 'Maybe latest tech news?', NOW() - INTERVAL '15 minutes');

    -- Seed Messages for Development Team
    INSERT INTO messages (chat_room_id, sender_id, content, timestamp) VALUES
    (room2_id, bob_id, 'Team, remember the sprint review at 2 PM.', NOW() - INTERVAL '40 minutes'),
    (room2_id, alice_id, 'Got it, Bob. My features are ready for demo.', NOW() - INTERVAL '35 minutes'),
    (room2_id, bob_id, 'Great to hear, Alice!', NOW() - INTERVAL '30 minutes');

END $$;
```