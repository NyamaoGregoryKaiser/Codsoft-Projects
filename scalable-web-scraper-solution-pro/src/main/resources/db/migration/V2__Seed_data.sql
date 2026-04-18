```sql
-- V2__Seed_data.sql

-- Insert admin user (password 'adminpass' encrypted with BCrypt, change in production!)
INSERT INTO app_user (username, password, email, created_at, updated_at) VALUES
('admin', '$2a$10$T/mXh6eL7.f0R.D0P/B5l.X9zL.W.p0V.g7x.G6D/o.0K.x8X0V6', 'admin@scrapify.com', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert roles for admin user
INSERT INTO user_roles (user_id, roles) VALUES
((SELECT id FROM app_user WHERE username = 'admin'), 'ADMIN'),
((SELECT id FROM app_user WHERE username = 'admin'), 'USER')
ON CONFLICT (user_id, roles) DO NOTHING;

-- Insert regular user (password 'userpass' encrypted with BCrypt)
INSERT INTO app_user (username, password, email, created_at, updated_at) VALUES
('user', '$2a$10$J5.B3G.E.Z2X.9L.L.L5V.p0V.g7x.G6D/o.0K.x8X0V6', 'user@scrapify.com', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert roles for regular user
INSERT INTO user_roles (user_id, roles) VALUES
((SELECT id FROM app_user WHERE username = 'user'), 'USER')
ON CONFLICT (user_id, roles) DO NOTHING;

-- Example Scraping Job for 'user' (simple static content)
-- Requires a user with username 'user' to exist
WITH user_id_val AS (
    SELECT id FROM app_user WHERE username = 'user'
)
INSERT INTO scraping_job (name, target_url, config, status, cron_schedule, user_id, created_at, updated_at)
SELECT
    'Example Article Scraper',
    'https://example.com/',
    '{"title": "h1", "paragraph": "p:first-of-type", "more_info_link": "a[href]:contains(More information)[href]"}'::jsonb,
    'PENDING',
    '0 0/10 * * * ?', -- Every 10 minutes
    user_id_val.id,
    NOW(),
    NOW()
FROM user_id_val
ON CONFLICT (id) DO NOTHING; -- Ensure idempotent if UUIDs were predictable
```