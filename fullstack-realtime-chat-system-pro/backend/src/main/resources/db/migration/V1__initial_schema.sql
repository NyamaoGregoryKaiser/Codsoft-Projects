-- V1__initial_schema.sql

-- Drop tables in reverse order of dependency if they exist, for clean migration during development
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chat_room_participants;
DROP TABLE IF EXISTS chat_rooms;
DROP TABLE IF EXISTS users;

-- Create Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for faster lookup by username and email
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);


-- Create Chat Rooms Table
CREATE TABLE chat_rooms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_creator
        FOREIGN KEY (creator_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Index for faster lookup by chat room name
CREATE INDEX idx_chat_rooms_name ON chat_rooms(name);


-- Create Chat Room Participants Table (Many-to-Many relationship)
CREATE TABLE chat_room_participants (
    user_id BIGINT NOT NULL,
    chat_room_id BIGINT NOT NULL,
    joined_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, chat_room_id),
    CONSTRAINT fk_crp_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_crp_chat_room
        FOREIGN KEY (chat_room_id)
        REFERENCES chat_rooms(id)
        ON DELETE CASCADE
);

-- Index for faster lookup of participants by chat room or user
CREATE INDEX idx_crp_user_id ON chat_room_participants(user_id);
CREATE INDEX idx_crp_chat_room_id ON chat_room_participants(chat_room_id);


-- Create Messages Table
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_room_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_message_chat_room
        FOREIGN KEY (chat_room_id)
        REFERENCES chat_rooms(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_message_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Indexes for efficient message retrieval
CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_room_timestamp ON messages(chat_room_id, timestamp DESC);
```