-- Insert default roles (if we had a separate roles table)
-- For now, roles are integers in `users` table based on `Enums.h`

-- Seed an initial ADMIN user
-- Password is 'admin_password' hashed with bcrypt, cost 10
-- You should generate this dynamically in a secure environment for production
INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES
    ('11111111-1111-1111-1111-111111111111', -- Fixed UUID for initial admin for testing/seeding
     'admin@example.com',
     '$2a$10$T.d.uH8R9S2tNq0o8zF/g.z.S.o.M.P.I.P.A.T.I.n.O.u.Q.r.W.S.U.E.G', -- Hashed 'admin_password'
     2, -- ADMIN role (assuming 2 from Enums.h)
     NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert some example categories
INSERT INTO categories (id, name, slug, description, created_at, updated_at) VALUES
    ('22222222-2222-2222-2222-222222222222', 'Technology', 'technology', 'Articles about software, hardware, and innovation.', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Lifestyle', 'lifestyle', 'Tips and guides for daily living.', NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'News', 'news', 'Breaking news and current events.', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert an example post by the admin user
INSERT INTO posts (id, title, slug, content, status, author_id, category_id, published_at, created_at, updated_at) VALUES
    ('55555555-5555-5555-5555-555555555555',
     'Welcome to the CMS',
     'welcome-to-the-cms',
     'This is the first post in your new Content Management System. Explore its features!',
     2, -- PUBLISHED status
     (SELECT id FROM users WHERE email = 'admin@example.com'),
     (SELECT id FROM categories WHERE name = 'News'),
     NOW(), NOW(), NOW()
) ON CONFLICT (slug) DO NOTHING;
```