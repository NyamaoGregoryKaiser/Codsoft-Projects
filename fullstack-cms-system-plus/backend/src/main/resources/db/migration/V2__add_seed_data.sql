```sql
-- V2__add_seed_data.sql

-- Add default users
-- Passwords are 'password' for all. Remember to hash them properly in production!
-- For this seed data, we use BCrypt with strength 10.
-- 'password' hashed with BCrypt (e.g., using https://www.bcryptcalculator.com/encode/)
-- $2a$10$w09tMhYp2qgL9B2M9K9YwO.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP
INSERT INTO app_users (first_name, last_name, email, password, role, created_at) VALUES
('Admin', 'User', 'admin@example.com', '$2a$10$w09tMhYp2qgL9B2M9K9YwO.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP', 'ADMIN', NOW()),
('Editor', 'User', 'editor@example.com', '$2a$10$w09tMhYp2qgL9B2M9K9YwO.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP', 'EDITOR', NOW()),
('Normal', 'User', 'user@example.com', '$2a$10$w09tMhYp2qgL9B2M9K9YwO.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP.J9jP', 'USER', NOW());

-- Add default categories
INSERT INTO categories (name, slug, description, created_at) VALUES
('Technology', 'technology', 'Articles about software, hardware, and gadgets.', NOW()),
('Lifestyle', 'lifestyle', 'Tips and guides for everyday living.', NOW()),
('News', 'news', 'Breaking news and current events.', NOW());

-- Add sample content
INSERT INTO contents (title, slug, body, status, type, author_id, category_id, created_at, published_at) VALUES
('The Future of AI', 'the-future-of-ai', 'Artificial intelligence is rapidly evolving...', 'PUBLISHED', 'POST', 1, 1, NOW(), NOW()),
('Healthy Eating Habits', 'healthy-eating-habits', 'A guide to maintaining a balanced diet...', 'PUBLISHED', 'POST', 2, 2, NOW(), NOW()),
('Spring Boot 3.0 Features', 'spring-boot-3-0-features', 'Explore the new features in Spring Boot 3...', 'DRAFT', 'POST', 1, 1, NOW(), NULL),
('About Us', 'about-us', 'Learn more about our mission and vision.', 'PUBLISHED', 'PAGE', 1, NULL, NOW(), NOW()),
('Contact Page', 'contact-page', 'Get in touch with us via our contact form.', 'PUBLISHED', 'PAGE', 2, NULL, NOW(), NOW()),
('Latest Tech Innovations', 'latest-tech-innovations', 'Overview of the most recent advancements in technology.', 'PUBLISHED', 'POST', 1, 1, NOW(), NOW() - INTERVAL '1 day');
```