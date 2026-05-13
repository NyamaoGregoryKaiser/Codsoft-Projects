```sql
-- Insert a dummy user (password 'password123' hashed with bcrypt)
-- You'd typically generate this hash in your app or a setup script.
-- For demonstration, let's use a common bcrypt hash prefix.
-- NOTE: In a real app, generate this hash securely.
-- Example: password_hash for 'password123' might be like '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdef.1234567890'
INSERT INTO users (id, username, email, password_hash, first_name, last_name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@example.com', '$2a$10$R9n5B2qL.v1z.Yx4.M.bM.e9U.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.', 'Admin', 'User')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (id, username, email, password_hash, first_name, last_name) VALUES
    ('22222222-2222-2222-2222-222222222222', 'john.doe', 'john.doe@example.com', '$2a$10$R9n5B2qL.v1z.Yx4.M.bM.e9U.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.', 'John', 'Doe')
ON CONFLICT (username) DO NOTHING;

-- Insert some dummy products
INSERT INTO products (id, name, description, price, stock_quantity) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Laptop Pro X', 'Powerful laptop for professionals', 1200.00, 50),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Wireless Mouse', 'Ergonomic wireless mouse', 25.50, 200),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mechanical Keyboard', 'RGB Mechanical keyboard with tactile switches', 89.99, 100),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'USB-C Hub', 'Multi-port USB-C hub', 49.99, 150)
ON CONFLICT (id) DO NOTHING;

-- Insert a dummy order for 'john.doe'
INSERT INTO orders (id, user_id, total_amount, status, shipping_address) VALUES
    ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1225.50, 'processed', '123 Main St, Anytown, USA')
ON CONFLICT (id) DO NOTHING;

-- Insert order items for the dummy order
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
    ('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 1200.00),
    ('00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 25.50)
ON CONFLICT (id) DO NOTHING;
```