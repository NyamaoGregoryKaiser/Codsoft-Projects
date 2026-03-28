CREATE TABLE app_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE data_source (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    connection_string TEXT NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255), -- In production, this should be encrypted/vaulted
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE dashboard (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB NOT NULL, -- Stores positions and sizes of visualizations
    owner_id BIGINT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE TABLE visualization (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dashboard_id BIGINT, -- Can be part of a dashboard or standalone
    data_source_id BIGINT NOT NULL,
    chart_type VARCHAR(50) NOT NULL, -- e.g., BAR_CHART, LINE_CHART, PIE_CHART, TABLE
    query_config JSONB NOT NULL, -- Stores SQL/NoSQL query details, filters, aggregations
    chart_config JSONB NOT NULL, -- Stores chart specific options (colors, titles, axes)
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    FOREIGN KEY (dashboard_id) REFERENCES dashboard(id) ON DELETE SET NULL,
    FOREIGN KEY (data_source_id) REFERENCES data_source(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE CASCADE
);