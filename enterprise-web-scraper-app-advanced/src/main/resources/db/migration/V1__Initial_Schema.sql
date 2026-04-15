CREATE TABLE IF NOT EXISTS app_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS scraper_definition (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    item_css_selector TEXT NOT NULL,
    field_definitions_json JSONB,
    schedule_interval_minutes INTEGER DEFAULT 0 NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES app_user(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS scraping_task (
    id BIGSERIAL PRIMARY KEY,
    scraper_definition_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITHOUT TIME ZONE,
    end_time TIMESTAMP WITHOUT TIME ZONE,
    error_message TEXT,
    executed_by_user_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_scraper_definition FOREIGN KEY (scraper_definition_id) REFERENCES scraper_definition(id) ON DELETE CASCADE,
    CONSTRAINT fk_executed_by_user FOREIGN KEY (executed_by_user_id) REFERENCES app_user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS scraped_data_item (
    id BIGSERIAL PRIMARY KEY,
    scraping_task_id BIGINT NOT NULL,
    scraper_definition_id BIGINT NOT NULL,
    data JSONB,
    scraped_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_scraping_task FOREIGN KEY (scraping_task_id) REFERENCES scraping_task(id) ON DELETE CASCADE,
    CONSTRAINT fk_data_scraper_definition FOREIGN KEY (scraper_definition_id) REFERENCES scraper_definition(id) ON DELETE CASCADE
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_user_username ON app_user(username);
CREATE INDEX IF NOT EXISTS idx_scraper_def_name ON scraper_definition(name);
CREATE INDEX IF NOT EXISTS idx_scraper_def_active_schedule ON scraper_definition(active, schedule_interval_minutes);
CREATE INDEX IF NOT EXISTS idx_scraping_task_definition_id ON scraping_task(scraper_definition_id);
CREATE INDEX IF NOT EXISTS idx_scraping_task_status ON scraping_task(status);
CREATE INDEX IF NOT EXISTS idx_scraped_data_task_id ON scraped_data_item(scraping_task_id);
CREATE INDEX IF NOT EXISTS idx_scraped_data_scraper_id ON scraped_data_item(scraper_definition_id);
-- Optional: GIN index for JSONB columns if full-text search or frequent key-value lookups are needed
-- CREATE INDEX IF NOT EXISTS idx_scraped_data_gin ON scraped_data_item USING GIN (data);
```