```sql
-- Seed data for CppDBOptimizer - Product Catalog Management System

-- Seed Users (passwords are 'password' hashed with bcrypt, for example)
-- In a real scenario, use actual bcrypt hashing in the application.
-- For this seed, we'll use a placeholder for hashed passwords.
-- Example bcrypt hash for 'password': $2a$10$wN1Q/Xv/Xb/Y.Z.0.Z.0.u.Z.0.Z.0.Z.0.u.Z.0.Z.0.u. (This is fake, generate real ones)
INSERT INTO users (username, password_hash) VALUES
('admin', '$2a$10$Qj2S/p.h6d/gL0h.n4n7cO.tB/0P0z.e.k.1A0.j/0.m.C.y.0.a.A0.'), -- password: adminpass
('testuser', '$2a$10$Qj2S/p.h6d/gL0h.n4n7cO.tB/0P0z.e.k.1A0.j/0.m.C.y.0.a.A1.'); -- password: userpass

-- Seed Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Gadgets and electronic devices.'),
('Books', 'Fictional and non-fictional books.'),
('Home & Kitchen', 'Appliances and items for home and kitchen use.'),
('Apparel', 'Clothing and accessories.'),
('Sports', 'Sports equipment and gear.');

-- Seed Manufacturers
INSERT INTO manufacturers (name, country, website) VALUES
('TechCorp', 'USA', 'http://www.techcorp.com'),
('Bookworm Publishers', 'UK', 'http://www.bookwormpub.co.uk'),
('Global Home Goods', 'China', 'http://www.globalhomegoods.com'),
('ActiveWear Inc.', 'Canada', 'http://www.activewear.ca'),
('SportPro', 'Germany', 'http://www.sportpro.de');

-- Seed Products
INSERT INTO products (name, description, price, category_id, manufacturer_id) VALUES
('Laptop Pro X', 'High performance laptop for professionals.', 1200.00, (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM manufacturers WHERE name = 'TechCorp')),
('The Great Adventure', 'A thrilling fantasy novel.', 15.50, (SELECT id FROM categories WHERE name = 'Books'), (SELECT id FROM manufacturers WHERE name = 'Bookworm Publishers')),
('Smart Coffee Maker', 'Brew perfect coffee with smart features.', 89.99, (SELECT id FROM categories WHERE name = 'Home & Kitchen'), (SELECT id FROM manufacturers WHERE name = 'Global Home Goods')),
('Running Shoes V2', 'Lightweight and durable running shoes.', 75.00, (SELECT id FROM categories WHERE name = 'Apparel'), (SELECT id FROM manufacturers WHERE name = 'ActiveWear Inc.')),
('Wireless Earbuds', 'Noise-cancelling earbuds with long battery life.', 129.99, (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM manufacturers WHERE name = 'TechCorp')),
('Cookbook: Italian Delights', 'Delicious Italian recipes for every occasion.', 22.00, (SELECT id FROM categories WHERE name = 'Books'), (SELECT id FROM manufacturers WHERE name = 'Bookworm Publishers')),
('Ergonomic Office Chair', 'Comfortable chair for long working hours.', 199.99, (SELECT id FROM categories WHERE name = 'Home & Kitchen'), (SELECT id FROM manufacturers WHERE name = 'Global Home Goods')),
('Hiking Backpack 50L', 'Spacious backpack for outdoor adventures.', 110.00, (SELECT id FROM categories WHERE name = 'Sports'), (SELECT id FROM manufacturers WHERE name = 'SportPro')),
('T-Shirt Organic Cotton', 'Soft and eco-friendly t-shirt.', 29.95, (SELECT id FROM categories WHERE name = 'Apparel'), (SELECT id FROM manufacturers WHERE name = 'ActiveWear Inc.')),
('Gaming Keyboard RGB', 'Mechanical keyboard with customizable RGB lighting.', 99.00, (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM manufacturers WHERE name = 'TechCorp')),
('Yoga Mat Deluxe', 'Premium non-slip yoga mat.', 45.00, (SELECT id FROM categories WHERE name = 'Sports'), (SELECT id FROM manufacturers WHERE name = 'SportPro')),
('Blender Pro 1000', 'High-speed blender for smoothies and soups.', 149.00, (SELECT id FROM categories WHERE name = 'Home & Kitchen'), (SELECT id FROM manufacturers WHERE name = 'Global Home Goods')),
('Science Fiction Anthology', 'Collection of classic sci-fi stories.', 18.75, (SELECT id FROM categories WHERE name = 'Books'), (SELECT id FROM manufacturers WHERE name = 'Bookworm Publishers')),
('Waterproof Jacket', 'Lightweight and waterproof jacket for all weather.', 85.50, (SELECT id FROM categories WHERE name = 'Apparel'), (SELECT id FROM manufacturers WHERE name = 'ActiveWear Inc.')),
('External SSD 1TB', 'Fast and portable storage solution.', 115.00, (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM manufacturers WHERE name = 'TechCorp'));
```