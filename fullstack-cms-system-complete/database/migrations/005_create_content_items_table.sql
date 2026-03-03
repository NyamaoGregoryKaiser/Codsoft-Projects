```sql
CREATE TABLE IF NOT EXISTS content_items (
    id SERIAL PRIMARY KEY,
    content_type_id INT NOT NULL REFERENCES content_types (id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL, -- Unique per content type, e.g., 'blog-post-1'
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}', -- The actual content data, conforming to content_type_id's schema
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- e.g., 'draft', 'published', 'archived'
    version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by INT NOT NULL REFERENCES users (id),
    updated_by INT NOT NULL REFERENCES users (id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (content_type_id, slug) -- Slug must be unique within a content type
);

CREATE INDEX IF NOT EXISTS idx_content_items_content_type_id ON content_items (content_type_id);
CREATE INDEX IF NOT EXISTS idx_content_items_slug ON content_items (slug);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items (status);
```