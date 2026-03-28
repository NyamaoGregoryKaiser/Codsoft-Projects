-- Insert default admin user (password 'admin123' encoded with BCrypt)
INSERT INTO app_user (id, username, password, email, created_at)
VALUES (1, 'admin', '$2a$10$G092xUu.k6z7E2xMvY.S.eP.gD.x.1.R.hT.Q.z.jZ.z.wZ.x.Q.wZ.', 'admin@datavizpro.com', NOW())
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password, email = EXCLUDED.email;

INSERT INTO user_roles (user_id, role)
VALUES (1, 'ADMIN'), (1, 'USER')
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert a regular user (password 'user123' encoded with BCrypt)
INSERT INTO app_user (id, username, password, email, created_at)
VALUES (2, 'user', '$2a$10$eE.P.a.M.q.Q.z.Z.x.w.Q.y.c.J.k.N.D.a.G.d.e.P.W.E.M.', 'user@datavizpro.com', NOW())
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password, email = EXCLUDED.email;

INSERT INTO user_roles (user_id, role)
VALUES (2, 'USER')
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert a viewer user (password 'viewer123' encoded with BCrypt)
INSERT INTO app_user (id, username, password, email, created_at)
VALUES (3, 'viewer', '$2a$10$fF.P.a.M.q.Q.z.Z.x.w.Q.y.c.J.k.N.D.a.G.d.e.P.W.E.N.', 'viewer@datavizpro.com', NOW())
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password, email = EXCLUDED.email;

INSERT INTO user_roles (user_id, role)
VALUES (3, 'VIEWER')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add a dummy data source for user 'admin'
INSERT INTO data_source (id, name, type, connection_string, username, password, owner_id, created_at)
VALUES (101, 'Sample PostgreSQL DB', 'POSTGRESQL', 'jdbc:postgresql://localhost:5432/sampledb', 'testuser', 'testpass', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Add a dummy dashboard for user 'admin'
INSERT INTO dashboard (id, name, description, layout, owner_id, is_public, created_at)
VALUES (201, 'Sales Overview', 'Dashboard showing key sales metrics.', '{"panels":[]}', 1, TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Add a dummy visualization for user 'admin'
INSERT INTO visualization (id, name, description, dashboard_id, data_source_id, chart_type, query_config, chart_config, owner_id, created_at)
VALUES (301, 'Monthly Sales Bar Chart', 'Sales by month', 201, 101, 'BAR_CHART',
        '{"sql":"SELECT month, SUM(sales) FROM orders GROUP BY month ORDER BY month", "x_axis":"month", "y_axis":"sum"}',
        '{"title":"Monthly Sales", "legend":true, "tooltip":true}',
        1, NOW())
ON CONFLICT (id) DO NOTHING;
```
*Note: Passwords are BCrypt encoded for `admin123`, `user123`, `viewer123` respectively. You can generate your own using `BCryptPasswordEncoder` if you change them.*

### 3. **Configuration & Setup**

#### `backend/src/main/resources/application.yml`
```yaml