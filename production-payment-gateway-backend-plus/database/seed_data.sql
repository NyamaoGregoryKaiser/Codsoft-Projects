```sql
-- Seed Data for Zenith Payments

-- Users
INSERT INTO users (username, email, password_hash, full_name, address, phone_number, role) VALUES
('adminuser', 'admin@zenith.com', '1234_hashed_admin_password', 'Admin User', '123 Admin St, Admin City', '555-1111', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (username, email, password_hash, full_name, address, phone_number, role) VALUES
('johndoe', 'john.doe@example.com', '5678_hashed_john_password', 'John Doe', '456 Main St, Anytown', '555-2222', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (username, email, password_hash, full_name, address, phone_number) VALUES
('janedoe', 'jane.doe@example.com', 'abcd_hashed_jane_password', 'Jane Doe', '789 Oak Ave, Otherville', '555-3333')
ON CONFLICT (email) DO NOTHING;

-- Retrieve user IDs for foreign key constraints
DO $$
DECLARE
    admin_id BIGINT;
    john_id BIGINT;
    jane_id BIGINT;
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = 'admin@zenith.com';
    SELECT id INTO john_id FROM users WHERE email = 'john.doe@example.com';
    SELECT id INTO jane_id FROM users WHERE email = 'jane.doe@example.com';

    -- Payment Methods for John Doe
    IF john_id IS NOT NULL THEN
        INSERT INTO payment_methods (user_id, type, provider, last_four, token, expiration_month, expiration_year, is_default) VALUES
        (john_id, 'credit_card', 'Visa', '1111', 'tok_visa_john', 12, 2025, TRUE)
        ON CONFLICT (user_id, token) DO NOTHING;

        INSERT INTO payment_methods (user_id, type, provider, last_four, token, expiration_month, expiration_year, is_default) VALUES
        (john_id, 'bank_account', 'BankA', '5678', 'tok_bank_john', NULL, NULL, FALSE)
        ON CONFLICT (user_id, token) DO NOTHING;
    END IF;

    -- Payment Methods for Jane Doe
    IF jane_id IS NOT NULL THEN
        INSERT INTO payment_methods (user_id, type, provider, last_four, token, expiration_month, expiration_year, is_default) VALUES
        (jane_id, 'credit_card', 'Mastercard', '2222', 'tok_mc_jane', 6, 2024, TRUE)
        ON CONFLICT (user_id, token) DO NOTHING;
    END IF;

    -- Retrieve payment method IDs for foreign key constraints
    DECLARE
        john_visa_pm_id BIGINT;
        jane_mc_pm_id BIGINT;
    BEGIN
        SELECT id INTO john_visa_pm_id FROM payment_methods WHERE user_id = john_id AND token = 'tok_visa_john';
        SELECT id INTO jane_mc_pm_id FROM payment_methods WHERE user_id = jane_id AND token = 'tok_mc_jane';

        -- Transactions for John Doe
        IF john_id IS NOT NULL AND john_visa_pm_id IS NOT NULL THEN
            INSERT INTO transactions (user_id, payment_method_id, external_transaction_id, amount, currency, status, type, description) VALUES
            (john_id, john_visa_pm_id, 'ext_tx_001', 100.50, 'USD', 'successful', 'payment', 'Online purchase')
            ON CONFLICT (external_transaction_id) DO NOTHING;

            INSERT INTO transactions (user_id, payment_method_id, external_transaction_id, amount, currency, status, type, description) VALUES
            (john_id, john_visa_pm_id, 'ext_tx_002', 25.00, 'USD', 'pending', 'payment', 'Subscription fee')
            ON CONFLICT (external_transaction_id) DO NOTHING;

            INSERT INTO transactions (user_id, payment_method_id, external_transaction_id, amount, currency, status, type, description, error_code, error_message) VALUES
            (john_id, john_visa_pm_id, 'ext_tx_003', 50.00, 'EUR', 'failed', 'payment', 'Failed payment attempt', 'E101', 'Insufficient funds')
            ON CONFLICT (external_transaction_id) DO NOTHING;
        END IF;

        -- Transactions for Jane Doe
        IF jane_id IS NOT NULL AND jane_mc_pm_id IS NOT NULL THEN
            INSERT INTO transactions (user_id, payment_method_id, external_transaction_id, amount, currency, status, type, description) VALUES
            (jane_id, jane_mc_pm_id, 'ext_tx_004', 75.25, 'USD', 'successful', 'payment', 'Service payment')
            ON CONFLICT (external_transaction_id) DO NOTHING;
        END IF;

        -- Audit Logs (Examples)
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES
        (admin_id, 'user_login', 'user', admin_id, '{"device": "web", "browser": "Chrome"}', '192.168.1.10'),
        (john_id, 'transaction_created', 'transaction', (SELECT id FROM transactions WHERE external_transaction_id = 'ext_tx_001'), '{"amount": "100.50 USD"}', '10.0.0.5'),
        (john_id, 'payment_method_added', 'payment_method', john_visa_pm_id, '{"type": "credit_card", "last_four": "1111"}', '10.0.0.5');

    END; -- End inner BEGIN for pm_id declarations
END $$;
```