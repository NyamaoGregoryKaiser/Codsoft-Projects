```sql
-- Seed Data for MLOps Core Service
-- Insert some dummy models and versions

-- Models
INSERT INTO models (name, description, created_at, updated_at) VALUES
('Revenue_Prediction_v1', 'Predicts quarterly revenue based on marketing spend and seasonality.', '2023-01-15T10:00:00Z', '2023-01-15T10:00:00Z'),
('Churn_Risk_Detection', 'Detects customers at high risk of churn.', '2023-02-01T11:30:00Z', '2023-02-01T11:30:00Z');

-- Model Versions for Revenue_Prediction_v1 (model_id=1)
INSERT INTO model_versions (model_id, version_tag, model_path, created_at, is_active, parameters, notes) VALUES
(1, 'v1.0.0-stable', './models/revenue_v1_0_0.json', '2023-01-15T10:30:00Z', 1, '{"intercept": 50000.0, "coef_marketing_spend": 2.5, "coef_seasonal_factor": 10000.0}', 'Initial stable version. Linear regression.'),
(1, 'v1.1.0-experiment', './models/revenue_v1_1_0.json', '2023-03-01T14:00:00Z', 0, '{"intercept": 45000.0, "coef_marketing_spend": 2.8, "coef_competitor_activity": -1500.0}', 'Experimental version including competitor activity. Not active for production.');

-- Model Versions for Churn_Risk_Detection (model_id=2)
INSERT INTO model_versions (model_id, version_tag, model_path, created_at, is_active, parameters, notes) VALUES
(2, 'v2.0.0-active', './models/churn_v2_0_0.json', '2023-02-05T09:00:00Z', 1, '{"intercept": 0.1, "coef_usage_frequency": -0.05, "coef_support_tickets": 0.02}', 'Current production version. Logistic regression (dummy linear for now).');

-- Prediction Logs (example entries)
-- For Revenue_Prediction_v1, v1.0.0-stable (model_version_id=1)
INSERT INTO prediction_logs (model_version_id, input_data, output_data, timestamp, status, error_message) VALUES
(1, '{"marketing_spend": 10000.0, "seasonal_factor": 2.0}', '{"predicted_value": 75000.0}', '2023-04-01T12:00:00Z', 'SUCCESS', ''),
(1, '{"marketing_spend": 12000.0, "seasonal_factor": 2.5}', '{"predicted_value": 81250.0}', '2023-04-01T12:05:00Z', 'SUCCESS', '');

-- For Churn_Risk_Detection, v2.0.0-active (model_version_id=3)
INSERT INTO prediction_logs (model_version_id, input_data, output_data, timestamp, status, error_message) VALUES
(3, '{"usage_frequency": 50.0, "support_tickets": 1}', '{"predicted_value": -1.4}', '2023-04-01T12:10:00Z', 'SUCCESS', ''),
(3, '{"usage_frequency": 10.0, "support_tickets": 5}', '{"predicted_value": 0.5}', '2023-04-01T12:15:00Z', 'SUCCESS', '');
```