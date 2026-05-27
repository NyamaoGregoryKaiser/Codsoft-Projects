-- Seed Data for ML Utilities System

-- Add a default admin user (password 'adminpass' hashed with bcrypt mock)
-- In a real scenario, use a robust bcrypt library to generate hashes.
-- Hash for 'adminpass' using our mock BCrypt (for integration tests/local dev)
-- $2a$10$SALT_PREFIX_MOCK_XYZadminpass_HASH
INSERT INTO users (email, password_hash, role, created_at, updated_at) VALUES
('admin@example.com', '$2a$10$SALT_PREFIX_MOCK_XYZadminpass_HASH', 'admin', NOW(), NOW()),
('user@example.com', '$2a$10$SALT_PREFIX_MOCK_XYZuserpass_HASH', 'user', NOW(), NOW());

-- Add some sample ML models (owned by admin and a regular user)
INSERT INTO ml_models (name, version, type, file_path, description, owner_id, created_at, metadata) VALUES
('SentimentAnalyzer', '1.0', 'classification', '/models/sentiment_v1.onnx', 'Analyzes sentiment of text input.', (SELECT id FROM users WHERE email = 'admin@example.com'), NOW(), '{"input_schema": {"text": "string"}, "output_schema": {"sentiment": "string", "score": "number"}, "metrics": {"accuracy": 0.92}}'),
('FraudDetector', '2.1', 'classification', '/models/fraud_v2_1.pb', 'Detects fraudulent transactions.', (SELECT id FROM users WHERE email = 'admin@example.com'), NOW(), '{"input_schema": {"amount": "number", "location": "string"}, "performance": {"f1_score": 0.88}}'),
('ImageClassifier', '3.0', 'deep_learning', '/models/image_resnet.pt', 'Classifies images into categories.', (SELECT id FROM users WHERE email = 'user@example.com'), NOW(), '{"classes": ["cat", "dog", "bird"], "framework": "pytorch"}');

-- Add some sample data points (inference records)
INSERT INTO data_points (model_id, user_id, input_data, prediction, created_at) VALUES
((SELECT id FROM ml_models WHERE name = 'SentimentAnalyzer' AND version = '1.0'), (SELECT id FROM users WHERE email = 'user@example.com'),
'{"text": "This product is amazing!"}', '{"sentiment": "positive", "score": 0.98}', NOW()),

((SELECT id FROM ml_models WHERE name = 'SentimentAnalyzer' AND version = '1.0'), (SELECT id FROM users WHERE email = 'user@example.com'),
'{"text": "I am very disappointed."}', '{"sentiment": "negative", "score": 0.91}', NOW() - INTERVAL '1 hour'),

((SELECT id FROM ml_models WHERE name = 'FraudDetector' AND version = '2.1'), (SELECT id FROM users WHERE email = 'admin@example.com'),
'{"amount": 120.50, "location": "NY"}', '{"is_fraud": false, "probability": 0.05}', NOW() - INTERVAL '30 minutes'),

((SELECT id FROM ml_models WHERE name = 'ImageClassifier' AND version = '3.0'), (SELECT id FROM users WHERE email = 'user@example.com'),
'{"image_url": "https://example.com/cat.jpg"}', '{"class": "cat", "confidence": 0.99}', NOW() - INTERVAL '2 hours');
```