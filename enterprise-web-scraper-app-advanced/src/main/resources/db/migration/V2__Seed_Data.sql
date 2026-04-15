-- Seed an admin user (password 'adminpass')
INSERT INTO app_user (username, password, role, created_at, updated_at)
VALUES ('admin', '$2a$10$vW3qM6ZfV9FfT7M7F8L7l.m9n.r7j0p0c6W.g4D.h.j.g.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j.j', 'ADMIN', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Seed a regular user (password 'userpass')
INSERT INTO app_user (username, password, role, created_at, updated_at)
VALUES ('user', '$2a$10$T8Z.E.Y8L.W.J.V.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P.P', 'USER', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Retrieve user IDs for scraper definitions
SELECT id INTO TEMP TABLE tmp_admin_id FROM app_user WHERE username = 'admin';
SELECT id INTO TEMP TABLE tmp_user_id FROM app_user WHERE username = 'user';

-- Seed example scraper definition 1 (created by admin, scheduled)
INSERT INTO scraper_definition (name, target_url, item_css_selector, field_definitions_json, schedule_interval_minutes, active, created_by_user_id, created_at, updated_at)
SELECT
    'Example Blog Scraper',
    'https://blog.scrapinghub.com/',
    'div.post-card',
    '{"title": "h2.post-title", "url": "a.post-title-link[href]", "author": "span.author-name"}',
    10, -- Every 10 minutes
    TRUE,
    tmp_admin_id.id,
    NOW(),
    NOW()
FROM tmp_admin_id
ON CONFLICT (name) DO NOTHING;

-- Seed example scraper definition 2 (created by user, manual)
INSERT INTO scraper_definition (name, target_url, item_css_selector, field_definitions_json, schedule_interval_minutes, active, created_by_user_id, created_at, updated_at)
SELECT
    'Example Product Scraper (Manual)',
    'http://books.toscrape.com/',
    'article.product_pod',
    '{"title": "h3 a[title]", "price": "p.price_color", "rating": "p.star-rating[class]", "image": ".image_container img[src]"}',
    0, -- Manual only
    TRUE,
    tmp_user_id.id,
    NOW(),
    NOW()
FROM tmp_user_id
ON CONFLICT (name) DO NOTHING;

-- Clean up temporary tables
DROP TABLE IF EXISTS tmp_admin_id;
DROP TABLE IF EXISTS tmp_user_id;
```