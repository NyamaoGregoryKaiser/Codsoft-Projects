```sql
-- 002_add_indexes.sql
-- Add indexes to improve query performance

-- Products table
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_price ON products (price);
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_manufacturer_id ON products (manufacturer_id);

-- Combined index for common searches (e.g., products by category and price range)
CREATE INDEX idx_products_category_price ON products (category_id, price);
-- Consider covering index if specific columns are almost always retrieved with category/price filter:
-- CREATE INDEX idx_products_category_price_covering ON products (category_id, price) INCLUDE (name, description, manufacturer_id);

-- Users table
CREATE UNIQUE INDEX idx_users_username ON users (username);

-- Categories table
-- Name is already unique, an index is implicitly created by UNIQUE constraint, but explicitly named for clarity.
CREATE UNIQUE INDEX idx_categories_name ON categories (name);

-- Manufacturers table
-- Name is already unique, an index is implicitly created by UNIQUE constraint.
CREATE UNIQUE INDEX idx_manufacturers_name ON manufacturers (name);

-- Performance consideration: For searching products by name (ILIKE), a trigram index might be useful:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX trgm_idx_products_name ON products USING GIN (name gin_trgm_ops);
-- (This requires pg_trgm extension to be enabled in PostgreSQL)
```