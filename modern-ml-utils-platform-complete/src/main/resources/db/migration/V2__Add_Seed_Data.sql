```sql
-- Add a default admin user
-- Password is 'admin123' encoded with BCrypt (use a stronger password in production)
INSERT INTO users (name, username, email, password) VALUES
('Admin User', 'admin', 'admin@example.com', '$2a$10$T8kY0nQ3/b8cK8rBv8kQ6.n/rT.t8t8t8t8t8t8t8t8t8t8t8t8t8t8t8t8'); -- placeholder hash for 'admin123'

-- Link admin user to ADMIN role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';

-- Add a default regular user
-- Password is 'user123' encoded with BCrypt (use a stronger password in production)
INSERT INTO users (name, username, email, password) VALUES
('Regular User', 'user', 'user@example.com', '$2a$10$T8kY0nQ3/b8cK8rBv8kQ6.n/rT.t8t8t8t8t8t8t8t8t8t8t8t8t8t8t8t8'); -- placeholder hash for 'user123'

-- Link regular user to USER role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'user' AND r.name = 'ROLE_USER';

-- Example ML Model Registration (for seeding purposes)
INSERT INTO models (name, description, owner, created_at, updated_at) VALUES
('Customer Churn Prediction', 'Predicts whether a customer is likely to churn', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Image Classifier', 'Classifies images into predefined categories', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Example Model Versions for 'Customer Churn Prediction' (Model ID 1)
INSERT INTO model_versions (model_id, version_number, model_path, file_name, file_type, status, metadata, is_active, uploaded_at) VALUES
((SELECT id FROM models WHERE name = 'Customer Churn Prediction'), 1, 's3://ml-models/churn_v1.onnx', 'churn_v1.onnx', 'ONNX', 'ARCHIVED', '{"input_schema": {"features": ["age", "gender", "tenure"]}, "metrics": {"accuracy": 0.85}}', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 days'),
((SELECT id FROM models WHERE name = 'Customer Churn Prediction'), 2, 's3://ml-models/churn_v2.pmml', 'churn_v2.pmml', 'PMML', 'DEPLOYED', '{"input_schema": {"features": ["age", "gender", "tenure", "support_calls"]}, "metrics": {"accuracy": 0.88}}', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Example Model Versions for 'Image Classifier' (Model ID 2)
INSERT INTO model_versions (model_id, version_number, model_path, file_name, file_type, status, metadata, is_active, uploaded_at) VALUES
((SELECT id FROM models WHERE name = 'Image Classifier'), 1, 's3://ml-models/image_classifier_v1.tflite', 'image_classifier_v1.tflite', 'TFLITE', 'DEPLOYED', '{"labels": ["cat", "dog", "bird"], "metrics": {"accuracy": 0.92}}', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 day');

```