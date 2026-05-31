```sql
-- Disable foreign key checks for initial schema import if needed, or ensure correct order
-- SET CONSTRAINTS ALL DEFERRED;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store Argon2/BCrypt hash
    full_name VARCHAR(100),
    address TEXT,
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'customer' NOT NULL, -- e.g., 'customer', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for faster lookups during login
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- 2. Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g., 'credit_card', 'bank_account', 'paypal'
    provider VARCHAR(50), -- e.g., 'Visa', 'Mastercard', 'BankName'
    last_four VARCHAR(4), -- Last 4 digits of card number or account number
    token VARCHAR(255) UNIQUE NOT NULL, -- Tokenized payment method from gateway (PCI-DSS compliance)
    expiration_month INTEGER, -- For credit cards
    expiration_year INTEGER, -- For credit cards
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payment_method_type CHECK (type IN ('credit_card', 'bank_account', 'paypal', 'crypto')),
    CONSTRAINT unique_user_pm_token UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_token ON payment_methods (token);

-- 3. Transactions Table
CREATE TYPE TRANSACTION_STATUS AS ENUM ('pending', 'processing', 'successful', 'failed', 'refunded', 'cancelled');
CREATE TYPE TRANSACTION_TYPE AS ENUM ('payment', 'refund', 'withdrawal', 'deposit');

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- RESTRICT to prevent deleting user with active transactions
    payment_method_id BIGINT REFERENCES payment_methods(id) ON DELETE SET NULL, -- SET NULL if payment method is deleted
    external_transaction_id VARCHAR(255) UNIQUE, -- ID from external payment gateway
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL, -- ISO 4217, e.g., 'USD', 'EUR'
    status TRANSACTION_STATUS DEFAULT 'pending' NOT NULL,
    type TRANSACTION_TYPE DEFAULT 'payment' NOT NULL,
    description TEXT,
    metadata JSONB, -- For additional non-structured data
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions (external_transaction_id);

-- 4. Audit Logs Table (Optional but highly recommended for financial systems)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- User who performed the action
    action VARCHAR(100) NOT NULL, -- e.g., 'user_login', 'transaction_created', 'user_updated'
    entity_type VARCHAR(100) NOT NULL, -- e.g., 'user', 'transaction', 'payment_method'
    entity_id BIGINT, -- ID of the affected entity
    details JSONB, -- Detailed old/new values, IP address, user agent etc.
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs (entity_type, entity_id);

-- Enable dblink or other extensions if needed for cross-database operations or specific functions
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For UUID generation
```