```sql
-- V2__seed_data.sql

-- Insert Sample Users
INSERT INTO users (id, username, email, password_hash) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@example.com', '$2a$10$o8.jQfL6N.c0Z.h6Z.jRKu/E0kS.o2Z.i.M9x9x9x9x9x9x9x9x9'), -- password: password123 (bcrypt hash)
    ('22222222-2222-2222-2222-222222222222', 'jane_doe', 'jane.doe@example.com', '$2a$10$o8.jQfL6N.c0Z.h6Z.jRKu/E0kS.o2Z.i.M9x9x9x9x9x9x9x9x9') -- password: password123 (bcrypt hash)
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Products
INSERT INTO products (id, name, description, price, stock_quantity) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Smartphone X', 'Latest generation smartphone with AI features.', 799.99, 150),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbbbb', 'Wireless Earbuds Pro', 'Noise-cancelling earbuds with long battery life.', 199.50, 300),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Smart Watch 3', 'Fitness tracker and smartwatch with heart rate monitor.', 249.00, 100),
    ('dddddddd-dddd-dddd-dddd-dddddddddddddd', 'Laptop Pro 14', 'High-performance laptop for professionals.', 1499.00, 50)
ON CONFLICT (name) DO NOTHING;

-- Insert Sample Order for admin user
INSERT INTO orders (id, user_id, total_amount, status) VALUES
    ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 999.49, 'processed')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Order Items for Order 00000000-0000-0000-0000-000000000001
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
    ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 799.99),
    ('00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbbbb', 1, 199.50)
ON CONFLICT (order_id, product_id) DO NOTHING;

-- Insert another Sample Order for jane_doe user
INSERT INTO orders (id, user_id, total_amount, status) VALUES
    ('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 249.00, 'pending')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Order Items for Order 00000000-0000-0000-0000-000000000002
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
    ('00000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 249.00)
ON CONFLICT (order_id, product_id) DO NOTHING;
```