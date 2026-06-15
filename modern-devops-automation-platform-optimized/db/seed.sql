```sql
-- db/seed.sql
-- Seed data for the Product Catalog System

-- Add some sample products if they don't exist
INSERT INTO products (name, description, price, stock, category) VALUES
('Laptop Pro X', 'High performance laptop for professionals.', 1200.00, 50, 'Electronics')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, price, stock, category) VALUES
('Wireless Keyboard', 'Ergonomic wireless keyboard with backlit keys.', 75.50, 200, 'Peripherals')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, price, stock, category) VALUES
('Gaming Mouse RGB', 'Precision gaming mouse with customizable RGB lighting.', 49.99, 150, 'Peripherals')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, price, stock, category) VALUES
('4K Monitor 27 inch', 'Stunning 4K resolution monitor for immersive viewing.', 350.00, 75, 'Monitors')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, price, stock, category) VALUES
('USB-C Hub', 'Multi-port USB-C hub with HDMI, USB 3.0, and PD.', 30.00, 300, 'Accessories')
ON CONFLICT (name) DO NOTHING;

-- Seed user data (matching initial schema migration for consistency)
-- Passwords should be hashed using bcrypt in a real application
INSERT INTO users (username, password_hash, is_admin) VALUES
('admin', '$2a$10$wN2J.oX2Q0wS.xR/C9hVduzM.S4o9/L2a/e5f.1z5o.X0K9j/O0K', TRUE) -- password: adminpass
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, is_admin) VALUES
('user', '$2a$10$wN2J.oX2Q0wS.xR/C9hVduzM.S4o9/L2a/e5f.1z5o.X0K9j/O0K', FALSE) -- password: userpass (same for simplicity)
ON CONFLICT (username) DO NOTHING;
```