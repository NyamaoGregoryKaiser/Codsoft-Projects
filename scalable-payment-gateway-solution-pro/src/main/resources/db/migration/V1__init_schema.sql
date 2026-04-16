```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for system users (e.g., admin, support, internal merchant users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL, -- e.g., 'ADMIN', 'MERCHANT_USER', 'SUPPORT'
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for Merchants
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE, -- Used for API authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table for Merchant Bank Accounts (for payouts)
CREATE TABLE merchant_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    routing_number VARCHAR(255),
    currency VARCHAR(3) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(merchant_id, account_number, currency)
);

-- Table for Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id UUID NOT NULL, -- Merchant's reference ID
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    amount NUMERIC(19, 4) NOT NULL,
    currency CHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL, -- PENDING, AUTHORIZED, CAPTURED, FAILED, VOIDED, REFUNDED, PARTIALLY_REFUNDED, REVERSED
    type VARCHAR(50) NOT NULL, -- SALE, AUTHORIZE, REFUND, VOID
    description TEXT,
    card_last_four CHAR(4),
    card_type VARCHAR(20),
    processing_fee NUMERIC(19, 4),
    captured_at TIMESTAMP WITHOUT TIME ZONE,
    refunded_at TIMESTAMP WITHOUT TIME ZONE,
    voided_at TIMESTAMP WITHOUT TIME ZONE,
    failure_reason TEXT,
    idempotency_key VARCHAR(255) UNIQUE, -- For request idempotency
    psp_transaction_id VARCHAR(255), -- ID from the external PSP
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(merchant_id, external_id)
);

-- Table for Transactions (detailed financial movements)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    type VARCHAR(50) NOT NULL, -- CHARGE, AUTHORIZATION, CAPTURE, REFUND, VOID, CHARGEBACK, PAYOUT
    status VARCHAR(50) NOT NULL, -- PENDING, SUCCESS, FAILED, REVERSED, CANCELLED
    amount NUMERIC(19, 4) NOT NULL,
    currency CHAR(3) NOT NULL,
    description TEXT,
    reference_id VARCHAR(255), -- E.g., PSP's transaction ID, or another internal ref
    fee_amount NUMERIC(19, 4),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_merchants_api_key ON merchants (api_key);
CREATE INDEX idx_payments_merchant_id ON payments (merchant_id);
CREATE INDEX idx_payments_external_id ON payments (external_id);
CREATE INDEX idx_payments_idempotency_key ON payments (idempotency_key);
CREATE INDEX idx_transactions_payment_id ON transactions (payment_id);
CREATE INDEX idx_transactions_merchant_id ON transactions (merchant_id);
```