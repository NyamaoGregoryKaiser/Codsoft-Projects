```sql
-- Seed Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Gadgets and electronic devices.'),
('Books', 'All kinds of books.'),
('Apparel', 'Clothing and fashion items.'),
('Home Goods', 'Items for your home.'),
('Sports', 'Equipment for various sports and outdoor activities.');

-- Seed Users
INSERT INTO users (username, email, password_hash, role) VALUES
('adminuser', 'admin@example.com', '$2a$10$w4rB.r/s.m.P0j.J5u.t0.l.a.z.x.C.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U.V.W.X.Y.Z', 'admin'), -- Password 'adminpass'
('johndoe', 'john.doe@example.com', '$2a$10$t.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U.V.W.X.Y.Z.a.b.c.d.e.f.g.h.i.j.k.l.m', 'user'), -- Password 'userpass'
('janedoe', 'jane.doe@example.com', '$2a$10$U.V.W.X.Y.Z.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.A.B', 'user'); -- Password 'userpass'

-- Seed Products
INSERT INTO products (name, description, price, stock_quantity, category_id, image_url) VALUES
('Laptop Pro X', 'Powerful laptop for professionals.', 1200.00, 50, (SELECT id FROM categories WHERE name = 'Electronics'), 'https://example.com/laptop.jpg'),
('Wireless Earbuds', 'High-quality sound with noise cancellation.', 150.00, 200, (SELECT id FROM categories WHERE name = 'Electronics'), 'https://example.com/earbuds.jpg'),
('The Great Novel', 'A captivating story.', 25.00, 100, (SELECT id FROM categories WHERE name = 'Books'), 'https://example.com/novel.jpg'),
('T-Shirt Basic', 'Comfortable cotton t-shirt.', 15.00, 300, (SELECT id FROM categories WHERE name = 'Apparel'), 'https://example.com/tshirt.jpg'),
('Coffee Maker', 'Automatic drip coffee maker.', 75.00, 80, (SELECT id FROM categories WHERE name = 'Home Goods'), 'https://example.com/coffee_maker.jpg');

-- Seed Product Reviews
INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES
((SELECT id FROM products WHERE name = 'Laptop Pro X'), (SELECT id FROM users WHERE email = 'johndoe@example.com'), 5, 'Absolutely fantastic laptop!'),
((SELECT id FROM products WHERE name = 'Wireless Earbuds'), (SELECT id FROM users WHERE email = 'janedoe@example.com'), 4, 'Great sound, but battery life could be better.'),
((SELECT id FROM products WHERE name = 'The Great Novel'), (SELECT id FROM users WHERE email = 'johndoe@example.com'), 5, 'Couldn''t put it down!');

-- Seed Carts (empty for new users usually)
INSERT INTO carts (user_id) VALUES
((SELECT id FROM users WHERE email = 'johndoe@example.com')),
((SELECT id FROM users WHERE email = 'janedoe@example.com'));

-- Seed Cart Items
INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
((SELECT id FROM carts WHERE user_id = (SELECT id FROM users WHERE email = 'johndoe@example.com')), (SELECT id FROM products WHERE name = 'Wireless Earbuds'), 1),
((SELECT id FROM carts WHERE user_id = (SELECT id FROM users WHERE email = 'johndoe@example.com')), (SELECT id FROM products WHERE name = 'T-Shirt Basic'), 2);

-- Seed Orders (example for johndoe)
INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, payment_status) VALUES
((SELECT id FROM users WHERE email = 'johndoe@example.com'), 1200.00, 'delivered', '123 Main St, Anytown, USA', 'Credit Card', 'paid');

INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
((SELECT id FROM orders WHERE user_id = (SELECT id FROM users WHERE email = 'johndoe@example.com') AND total_amount = 1200.00), (SELECT id FROM products WHERE name = 'Laptop Pro X'), 1, 1200.00);

-- Update stock quantities for ordered products
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE name = 'Laptop Pro X';
```