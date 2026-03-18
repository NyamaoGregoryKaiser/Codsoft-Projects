-- Seed Data for an initial admin user
-- NOTE: In a real application, you'd use a strong password hashing library like Argon2 or bcrypt
-- and never hardcode passwords. This is for demonstration purposes with a simple mock hash.
-- The password "password123" with mock hash would be "mock_hash_password123"

INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES
('b3333333-3333-4333-8333-333333333333', 'admin', 'admin@example.com', 'mock_hash_password123');

-- Seed Data for some example models
INSERT OR IGNORE INTO models (id, user_id, name, description, version, status, model_path, metadata) VALUES
('a0000000-0000-4000-8000-000000000000', 'b3333333-3333-4333-8333-333333333333', 'Churn Prediction V1', 'A model to predict customer churn.', '1.0.0', 'ready', '/models/churn_v1.pkl', '{"accuracy": 0.85, "features": ["age", "tenure", "balance"]}'),
('a1111111-1111-4111-8111-111111111111', 'b3333333-3333-4333-8333-333333333333', 'Fraud Detection V2', 'Second iteration of fraud detection model.', '2.0.0', 'deployed', '/models/fraud_v2.pt', '{"precision": 0.92, "recall": 0.78, "model_type": "deep_learning"}');
```