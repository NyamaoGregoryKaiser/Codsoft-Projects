```sql
-- V1__Initial_schema.sql

-- Table for application users
CREATE TABLE IF NOT EXISTS app_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for user roles (many-to-many relationship simplified as element collection)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    roles VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, roles),
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- Table for scraping jobs
CREATE TABLE IF NOT EXISTS scraping_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    target_url TEXT NOT NULL,
    config JSONB NOT NULL, -- JSONB for flexible key-value configuration
    status VARCHAR(50) NOT NULL,
    cron_schedule VARCHAR(255),
    user_id BIGINT NOT NULL,
    last_run_at TIMESTAMP WITHOUT TIME ZONE,
    next_run_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_scraping_job_user_id FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- Table for scraped data
CREATE TABLE IF NOT EXISTS scraped_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    data JSONB NOT NULL, -- JSONB for storing the actual scraped content
    scraped_url TEXT NOT NULL,
    scraped_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_scraped_data_job_id FOREIGN KEY (job_id) REFERENCES scraping_job(id) ON DELETE CASCADE
);

-- Index for faster lookup of scraped data by job
CREATE INDEX IF NOT EXISTS idx_scraped_data_job_id ON scraped_data(job_id);
-- Index for faster lookup by scraped_at
CREATE INDEX IF NOT EXISTS idx_scraped_data_scraped_at ON scraped_data(scraped_at DESC);


-- Table for job execution logs
CREATE TABLE IF NOT EXISTS job_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_time TIMESTAMP WITHOUT TIME ZONE,
    error_message TEXT,
    data_count INTEGER,
    CONSTRAINT fk_job_execution_log_job_id FOREIGN KEY (job_id) REFERENCES scraping_job(id) ON DELETE CASCADE
);

-- Index for faster lookup of job execution logs by job
CREATE INDEX IF NOT EXISTS idx_job_execution_log_job_id ON job_execution_log(job_id);
-- Index for faster lookup by start_time
CREATE INDEX IF NOT EXISTS idx_job_execution_log_start_time ON job_execution_log(start_time DESC);

```