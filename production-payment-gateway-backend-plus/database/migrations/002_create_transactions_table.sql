```sql
-- Migration 002: Create payment_methods and transactions tables

-- Payment Methods Table
CREATE TABLE payment_methods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(50),
    last_four VARCHAR(4),
    token VARCHAR(255) UNIQUE NOT NULL,
    expiration_month INTEGER,
    expiration_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payment_method_type CHECK (type IN ('credit_card', 'bank_account', 'paypal', 'crypto')),
    CONSTRAINT unique_user_pm_token UNIQUE (user_id, token)
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods (user_id);
CREATE INDEX idx_payment_methods_token ON payment_methods (token);

-- Transaction Status and Type ENUMs
CREATE TYPE TRANSACTION_STATUS AS ENUM ('pending', 'processing', 'successful', 'failed', 'refunded', 'cancelled');
CREATE TYPE TRANSACTION_TYPE AS ENUM ('payment', 'refund', 'withdrawal', 'deposit');

-- Transactions Table
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    payment_method_id BIGINT REFERENCES payment_methods(id) ON DELETE SET NULL,
    external_transaction_id VARCHAR(255) UNIQUE,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status TRANSACTION_STATUS DEFAULT 'pending' NOT NULL,
    type TRANSACTION_TYPE DEFAULT 'payment' NOT NULL,
    description TEXT,
    metadata JSONB,
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_created_at ON transactions (created_at);
CREATE INDEX idx_transactions_external_id ON transactions (external_transaction_id);

INSERT INTO schema_migrations (migration_name) VALUES ('002_create_transactions_table.sql');
```