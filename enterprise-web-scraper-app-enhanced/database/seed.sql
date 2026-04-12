```sql
-- Seed Data for Web Scraping Tools System

-- Insert a default user
INSERT INTO users (id, username, email, password_hash) VALUES
('b0e2f1d4-8c7a-4a5b-9d6e-0c1b2a3d4e5f', 'testuser', 'test@example.com', '$2a$10$abcdefghijklmnopqrstuuR8wD/xL8q/x/x/x/x.y/x/x/x/x.y/x/x/x/x');
-- Note: The password hash above is a dummy. For 'testuser' with password 'password123',
-- a real bcrypt hash would be generated during registration.
-- The `$2a$10$abcdefghijklmnopqrstuuR8wD/xL8q/x/x/x/x.y/x/x/x/x.y/x/x/x/x` is a placeholder
-- mimicking a bcrypt hash structure.

-- Insert some example scraping jobs for 'testuser'
INSERT INTO scraping_jobs (id, user_id, name, target_url, cron_schedule, css_selector, status) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'b0e2f1d4-8c7a-4a5b-9d6e-0c1b2a3d4e5f', 'Example Product Scraper', 'https://example.com/products/item-1', 'every 30 minutes', 'h1.product-title, span.price', 'PENDING'),
('b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'b0e2f1d4-8c7a-4a5b-9d6e-0c1b2a3d4e5f', 'Daily News Headlines', 'https://example.com/news', 'every 12 hours', 'article h2.headline, article p.summary', 'PENDING'),
('c3d4e5f6-a7b8-9012-3456-7890abcdef12', 'b0e2f1d4-8c7a-4a5b-9d6e-0c1b2a3d4e5f', 'Manual Price Check', 'https://example.com/item/another-item', 'manual', 'div.current-price', 'PENDING');

-- Insert some dummy scraped data for the first job
INSERT INTO scraped_data (id, job_id, url, data, scraped_at) VALUES
('d4e5f6a7-b8c9-0123-4567-890abcdef34', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'https://example.com/products/item-1', '{"product_name": "Gadget X", "price": "$99.99", "availability": "In Stock"}', NOW() - INTERVAL '1 day'),
('e5f6a7b8-c9d0-1234-5678-90abcdef456', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'https://example.com/products/item-1', '{"product_name": "Gadget X", "price": "$95.00", "availability": "Limited Stock"}', NOW());
```