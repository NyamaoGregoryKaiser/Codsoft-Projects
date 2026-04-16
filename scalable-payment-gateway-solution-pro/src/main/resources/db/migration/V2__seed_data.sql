```sql
-- Insert a test admin user (password is 'adminpassword' bcrypt encoded)
INSERT INTO users (id, username, password, email, role, created_at, updated_at) VALUES
(uuid_generate_v4(), 'admin', '$2a$10$T1UaYhN8F.3sWbT.w4lV9.v1Q6yE2.p3JqW9.x2k3Z6yV2f.w9z', 'admin@example.com', 'ADMIN', NOW(), NOW());
-- Password for 'admin' is 'adminpassword' (run through BCryptPasswordEncoder)

-- Insert a test merchant (API key is 'test_api_key_123')
INSERT INTO merchants (id, name, api_key, email, is_active, created_at, updated_at) VALUES
('4e21d6e1-9128-4b72-911b-7489e2c608a0', 'Test Merchant A', 'test_api_key_123', 'merchant.a@example.com', TRUE, NOW(), NOW());

-- Insert a test merchant user
INSERT INTO users (id, username, password, email, role, created_at, updated_at) VALUES
(uuid_generate_v4(), 'merchuserA', '$2a$10$f/9N/J/fG.f.W4Y/k1M5.e5H2.d1K4S1.u1R6yD2.p3JqW9.x2k3Z6yV2f.w9z', 'merchuserA@example.com', 'MERCHANT_USER', NOW(), NOW());
-- Password for 'merchuserA' is 'merchantpassword'
```