```sql
-- Insert initial roles
INSERT INTO roles (name) VALUES ('USER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ADMIN') ON CONFLICT (name) DO NOTHING;

-- Retrieve role IDs
DO $$
DECLARE
    user_role_id UUID;
    admin_role_id UUID;
BEGIN
    SELECT id INTO user_role_id FROM roles WHERE name = 'USER';
    SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';

    -- Insert an admin user (password 'admin123' hashed with BCrypt)
    -- You can generate a BCrypt hash for 'admin123' using a tool or in code:
    -- new BCryptPasswordEncoder().encode("admin123") -> "$2a$10$Q78/92N/m4r.h.D5jRkY.e.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E"
    INSERT INTO users (first_name, last_name, email, password) VALUES
    ('Admin', 'User', 'admin@example.com', '$2a$10$Q78/92N/m4r.h.D5jRkY.e.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E')
    ON CONFLICT (email) DO NOTHING;

    -- Insert a regular user (password 'user123' hashed with BCrypt)
    INSERT INTO users (first_name, last_name, email, password) VALUES
    ('Regular', 'User', 'user@example.com', '$2a$10$L0F0s.K1Q78/92N/m4r.h.D5jRkY.e.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E.f.E')
    ON CONFLICT (email) DO NOTHING;

    -- Assign roles to users
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, admin_role_id FROM users u WHERE u.email = 'admin@example.com'
    ON CONFLICT (user_id, role_id) DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, user_role_id FROM users u WHERE u.email = 'admin@example.com'
    ON CONFLICT (user_id, role_id) DO NOTHING;

    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, user_role_id FROM users u WHERE u.email = 'user@example.com'
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Insert some initial products
    INSERT INTO products (name, description, price, stock_quantity) VALUES
    ('Laptop Pro', 'High-performance laptop for professionals', 1200.00, 50) ON CONFLICT (name) DO NOTHING,
    ('Wireless Mouse', 'Ergonomic wireless mouse with long battery life', 25.50, 200) ON CONFLICT (name) DO NOTHING,
    ('Mechanical Keyboard', 'RGB mechanical keyboard with tactile switches', 80.00, 100) ON CONFLICT (name) DO NOTHING;

END $$;
```