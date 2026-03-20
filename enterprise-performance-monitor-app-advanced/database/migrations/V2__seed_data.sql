```sql
-- Seed Data
-- Only insert if the table is empty to avoid duplicates on re-run

-- Add a default user
INSERT INTO users (id, username, email, password_hash) VALUES
('b0b1d2d3-e4e5-f6f7-a8a9-b0c1d2e3f4f5', 'devuser', 'dev@example.com', '$2a$10$wT0o3V3Cj.gB7kP9oW2v.O5P8V3H1I9V.B3J5R8Q9N4K0L1M2N3') -- password123 (bcrypt hash)
ON CONFLICT (username) DO NOTHING;

-- Add a default application for devuser
INSERT INTO applications (id, user_id, name, description) VALUES
('a0a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'b0b1d2d3-e4e5-f6f7-a8a9-b0c1d2e3f4f5', 'Sample Backend Service', 'A sample service to demonstrate performance monitoring.')
ON CONFLICT (user_id, name) DO NOTHING;

-- Add sample metric definitions for the sample application
INSERT INTO metric_definitions (id, app_id, name, unit, type) VALUES
('m1a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'a0a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'cpu_utilization', '%', 'gauge')
ON CONFLICT (app_id, name) DO NOTHING;

INSERT INTO metric_definitions (id, app_id, name, unit, type) VALUES
('m2a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'a0a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'memory_usage_mb', 'MB', 'gauge')
ON CONFLICT (app_id, name) DO NOTHING;

INSERT INTO metric_definitions (id, app_id, name, unit, type) VALUES
('m3a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'a0a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'request_latency_ms', 'ms', 'gauge')
ON CONFLICT (app_id, name) DO NOTHING;

INSERT INTO metric_definitions (id, app_id, name, unit, type) VALUES
('m4a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'a0a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5', 'error_rate', '#/sec', 'counter')
ON CONFLICT (app_id, name) DO NOTHING;
```