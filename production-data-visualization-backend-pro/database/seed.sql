-- Ensure uuid-ossp is enabled for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data (for development/testing only!)
-- TRUNCATE TABLE dashboards CASCADE;
-- TRUNCATE TABLE datasets CASCADE;
-- TRUNCATE TABLE users CASCADE;
-- TRUNCATE TABLE _migrations CASCADE;

-- Seed Users
-- Passwords are SHA256 hashes of 'password123' (INSECURE! Use strong hashing in production.)
INSERT INTO users (id, username, email, password_hash) VALUES
('b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f', 'admin', 'admin@example.com', 'a1f7d6a5c8b9e0d1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5') -- 'password123' SHA256
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (id, username, email, password_hash) VALUES
('c1f3c5d1-6d8b-4a2c-8e0f-1c3d5e7f9a1b', 'john_doe', 'john.doe@example.com', 'a1f7d6a5c8b9e0d1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5')
ON CONFLICT (username) DO NOTHING;

-- Seed Datasets (assuming files 'data_storage/b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f/sales_data.csv' exist)
-- The file_path should point to an actual file created by the backend.
INSERT INTO datasets (id, user_id, name, description, file_path, data_schema, row_count) VALUES
('d2e4e6f1-7f9c-4b3d-9a2c-2d4e6f8a0b2c',
 'b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f',
 'Sales Data Q1',
 'Quarter 1 Sales figures for regions.',
 'data_storage/b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f/d2e4e6f1-7f9c-4b3d-9a2c-2d4e6f8a0b2c_sales_data.csv', -- Placeholder path
 '{
   "columns": [
     {"name": "Date", "type": "date"},
     {"name": "Region", "type": "string"},
     {"name": "Product", "type": "string"},
     {"name": "Sales", "type": "number"},
     {"name": "Units", "type": "number"}
   ]
 }',
 1500)
ON CONFLICT (user_id, name) DO NOTHING;

-- Seed Dashboards
INSERT INTO dashboards (id, user_id, name, description, config) VALUES
('e3f5f7g1-8a0d-4c4e-9b3d-3e5f7g9b1d3e',
 'b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f',
 'Executive Sales Overview',
 'Key performance indicators for sales executives.',
 '{
   "layout": [
     {"i": "chart1", "x": 0, "y": 0, "w": 6, "h": 5, "minW": 2, "minH": 3},
     {"i": "chart2", "x": 6, "y": 0, "w": 6, "h": 5, "minW": 2, "minH": 3},
     {"i": "table1", "x": 0, "y": 5, "w": 12, "h": 7, "minW": 4, "minH": 4}
   ],
   "widgets": {
     "chart1": {
       "type": "bar_chart",
       "title": "Sales by Region",
       "datasetId": "d2e4e6f1-7f9c-4b3d-9a2c-2d4e6f8a0b2c",
       "xField": "Region",
       "yField": "Sales"
     },
     "chart2": {
       "type": "line_chart",
       "title": "Monthly Sales Trend",
       "datasetId": "d2e4e6f1-7f9c-4b3d-9a2c-2d4e6f8a0b2c",
       "xField": "Date",
       "yField": "Sales"
     },
     "table1": {
       "type": "data_table",
       "title": "Raw Sales Data",
       "datasetId": "d2e4e6f1-7f9c-4b3d-9a2c-2d4e6f8a0b2c",
       "columns": ["Date", "Region", "Product", "Sales", "Units"]
     }
   }
 }')
ON CONFLICT (user_id, name) DO NOTHING;
```