```sql
CREATE TABLE IF NOT EXISTS media_assets (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(512) NOT NULL, -- Path relative to upload root
    mimetype VARCHAR(100) NOT NULL,
    filesize_bytes BIGINT NOT NULL,
    description TEXT,
    uploaded_by INT NOT NULL REFERENCES users (id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_assets_filepath ON media_assets (filepath);
CREATE INDEX IF NOT EXISTS idx_media_assets_filename ON media_assets (filename);
```