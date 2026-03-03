```sql
-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Administrator with full system access'),
('editor', 'Can create, edit, and publish content'),
('author', 'Can create and edit own content, but not publish'),
('user', 'Basic authenticated user, can view published content')
ON CONFLICT (name) DO NOTHING;

-- Insert an initial admin user (replace with secure credentials)
-- Password 'adminpass' hashed with salt 'adminsalt' using SHA256 (for demo)
-- In production, hash this with Argon2/bcrypt
INSERT INTO users (username, email, password_hash, password_salt, first_name, last_name, is_active) VALUES
('admin', 'admin@apexcontent.com', 'a3ddc45b85a18a58a2d7c2a715a319a9a5f4a7c8d9e0f1g2h3i4j5k6l7m8n9o0', '0123456789abcdef', 'System', 'Admin', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Link admin user to 'admin' role
INSERT INTO user_roles (user_id, role_id) VALUES
((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'admin'))
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert example content types
INSERT INTO content_types (name, slug, description, schema, created_by) VALUES
('Blog Post', 'blog-post', 'Schema for blog articles', '{
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "body": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["summary", "body"]
}', (SELECT id FROM users WHERE username = 'admin'))
ON CONFLICT (slug) DO NOTHING;

INSERT INTO content_types (name, slug, description, schema, created_by) VALUES
('Page', 'page', 'Schema for static pages', '{
    "type": "object",
    "properties": {
        "subtitle": {"type": "string"},
        "content_blocks": {"type": "array", "items": {"type": "object"}}
    },
    "required": ["subtitle", "content_blocks"]
}', (SELECT id FROM users WHERE username = 'admin'))
ON CONFLICT (slug) DO NOTHING;
```