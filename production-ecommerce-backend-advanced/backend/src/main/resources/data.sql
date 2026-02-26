-- Seed Roles
INSERT INTO roles (name) VALUES ('ROLE_USER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT (name) DO NOTHING;

-- Seed Admin User (password: admin_password)
INSERT INTO users (username, password, email, first_name, last_name, created_at, updated_at)
VALUES ('admin', '$2a$10$wU0uG.w9iX0xX0xX0xX0x.eR5jP3L8X5K.u9C6t.N7P8M2Y4A5Q9S8', 'admin@example.com', 'Admin', 'User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Assign ROLE_ADMIN to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT
    (SELECT id FROM users WHERE username = 'admin'),
    (SELECT id FROM roles WHERE name = 'ROLE_ADMIN')
ON CONFLICT DO NOTHING;

-- Seed Regular User (password: user_password)
INSERT INTO users (username, password, email, first_name, last_name, created_at, updated_at)
VALUES ('testuser', '$2a$10$wU0uG.w9iX0xX0xX0xX0x.eR5jP3L8X5K.u9C6t.N7P8M2Y4A5Q9S8', 'user@example.com', 'Test', 'User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Assign ROLE_USER to testuser
INSERT INTO user_roles (user_id, role_id)
SELECT
    (SELECT id FROM users WHERE username = 'testuser'),
    (SELECT id FROM roles WHERE name = 'ROLE_USER')
ON CONFLICT DO NOTHING;

-- Seed Categories
INSERT INTO categories (name, description, created_at, updated_at) VALUES
('Electronics', 'Gadgets, devices, and electronic components.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name, description, created_at, updated_at) VALUES
('Books', 'A wide range of books from various genres.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (name) DO NOTHING;
INSERT INTO categories (name, description, created_at, updated_at) VALUES
('Apparel', 'Clothing and fashion accessories.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (name) DO NOTHING;

-- Seed Products
INSERT INTO products (name, description, price, stock_quantity, image_url, category_id, created_at, updated_at)
SELECT
    'Laptop Pro X',
    'Powerful laptop with 16GB RAM and 512GB SSD.',
    1200.00,
    50,
    'https://example.com/laptop.jpg',
    (SELECT id FROM categories WHERE name = 'Electronics'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Laptop Pro X');

INSERT INTO products (name, description, price, stock_quantity, image_url, category_id, created_at, updated_at)
SELECT
    'The Great Novel',
    'A captivating story that will keep you on the edge of your seat.',
    25.00,
    200,
    'https://example.com/novel.jpg',
    (SELECT id FROM categories WHERE name = 'Books'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'The Great Novel');

INSERT INTO products (name, description, price, stock_quantity, image_url, category_id, created_at, updated_at)
SELECT
    'T-Shirt V-Neck',
    'Comfortable cotton V-neck t-shirt, various sizes.',
    15.00,
    300,
    'https://example.com/tshirt.jpg',
    (SELECT id FROM categories WHERE name = 'Apparel'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'T-Shirt V-Neck');