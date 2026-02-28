```sql
-- V1__create_initial_tables.sql

-- User Roles
CREATE TYPE user_role AS ENUM ('USER', 'EDITOR', 'ADMIN');

-- Content Status
CREATE TYPE content_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Content Type
CREATE TYPE content_type AS ENUM ('POST', 'PAGE');

-- Users Table
CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- Categories Table
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

-- Content Table (Posts/Pages)
CREATE TABLE contents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) UNIQUE, -- Increased size for slug based on title + potential hash
    body TEXT NOT NULL,
    featured_image VARCHAR(512), -- URL or path to image
    status content_status NOT NULL DEFAULT 'DRAFT',
    type content_type NOT NULL DEFAULT 'POST',
    author_id BIGINT NOT NULL,
    category_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Media Table
CREATE TABLE media (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    url VARCHAR(512) NOT NULL,
    alt_text VARCHAR(255),
    file_size BIGINT,
    uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX idx_users_email ON app_users (email);
CREATE INDEX idx_categories_name ON categories (name);
CREATE INDEX idx_categories_slug ON categories (slug);
CREATE INDEX idx_contents_status ON contents (status);
CREATE INDEX idx_contents_type ON contents (type);
CREATE INDEX idx_contents_author_id ON contents (author_id);
CREATE INDEX idx_contents_category_id ON contents (category_id);
CREATE INDEX idx_contents_slug ON contents (slug);
```