```sql
-- Seed Data for development environment

-- Insert Admin User (password: password123)
INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (
    'admin_user_id',
    'admin',
    'admin@example.com',
    '$2a$10$B50Q7uU/0eN3pM0n/uT2M.N/vS3.jT2k/m.G/w.W/O.V/o.V/o.V', -- Hashed 'password123'
    'admin'
);

-- Insert Regular User (password: password123)
INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (
    'regular_user_id',
    'user',
    'user@example.com',
    '$2a$10$B50Q7uU/0eN3pM0n/uT2M.N/vS3.jT2k/m.G/w.W/O.V/o.V/o.V', -- Hashed 'password123'
    'user'
);

-- Insert Sample Data Source for Admin User
INSERT OR IGNORE INTO data_sources (id, user_id, name, file_path, file_type, column_headers) VALUES (
    'admin_data_source_1',
    'admin_user_id',
    'Monthly Sales Data',
    './data/admin_monthly_sales.csv', -- This file should exist for full functionality
    'csv',
    '["Month", "Revenue", "Expenses", "Profit"]'
);
-- Create a dummy CSV file for the above data source
-- === backend/data/admin_monthly_sales.csv ===
-- Month,Revenue,Expenses,Profit
-- Jan,10000,5000,5000
-- Feb,12000,6000,6000
-- Mar,11000,5500,5500
-- Apr,13000,6500,6500
-- May,15000,7000,8000
-- Jun,14000,6800,7200
-- === END DUMMY CSV ===


-- Insert Sample Visualization for Admin User (Bar Chart: Month vs Revenue)
INSERT OR IGNORE INTO visualizations (id, user_id, data_source_id, name, chart_type, config) VALUES (
    'admin_viz_1',
    'admin_user_id',
    'admin_data_source_1',
    'Monthly Revenue Bar Chart',
    'bar',
    '{
        "x_axis": "Month",
        "y_axis": "Revenue",
        "label_column": "Month",
        "data_column": "Revenue",
        "backgroundColor": "rgba(75, 192, 192, 0.6)",
        "borderColor": "rgba(75, 192, 192, 1)",
        "borderWidth": 1,
        "title": "Monthly Revenue"
    }'
);

-- Insert Sample Visualization for Admin User (Line Chart: Month vs Profit)
INSERT OR IGNORE INTO visualizations (id, user_id, data_source_id, name, chart_type, config) VALUES (
    'admin_viz_2',
    'admin_user_id',
    'admin_data_source_1',
    'Monthly Profit Line Chart',
    'line',
    '{
        "x_axis": "Month",
        "y_axis": "Profit",
        "label_column": "Month",
        "data_column": "Profit",
        "borderColor": "rgba(153, 102, 255, 1)",
        "backgroundColor": "rgba(153, 102, 255, 0.2)",
        "borderWidth": 2,
        "fill": true,
        "title": "Monthly Profit"
    }'
);


-- Insert Sample Dashboard for Admin User
INSERT OR IGNORE INTO dashboards (id, user_id, name, description) VALUES (
    'admin_dashboard_1',
    'admin_user_id',
    'Sales Overview Dashboard',
    'Key performance indicators for monthly sales.'
);

-- Link visualizations to the dashboard
INSERT OR IGNORE INTO dashboard_visualizations (dashboard_id, visualization_id, position) VALUES (
    'admin_dashboard_1',
    'admin_viz_1',
    '{"x":0, "y":0, "w":6, "h":6}'
);

INSERT OR IGNORE INTO dashboard_visualizations (dashboard_id, visualization_id, position) VALUES (
    'admin_dashboard_1',
    'admin_viz_2',
    '{"x":6, "y":0, "w":6, "h":6}'
);


-- Insert Sample Data Source for Regular User
INSERT OR IGNORE INTO data_sources (id, user_id, name, file_path, file_type, column_headers) VALUES (
    'user_data_source_1',
    'regular_user_id',
    'Website Traffic Data',
    './data/user_website_traffic.csv', -- This file should exist for full functionality
    'csv',
    '["Date", "Page Views", "Unique Visitors", "Bounce Rate"]'
);
-- Create a dummy CSV file for the above data source
-- === backend/data/user_website_traffic.csv ===
-- Date,Page Views,Unique Visitors,Bounce Rate
-- 2023-01-01,1500,500,0.45
-- 2023-01-02,1700,550,0.42
-- 2023-01-03,1600,520,0.48
-- === END DUMMY CSV ===

-- Insert Sample Visualization for Regular User (Line Chart: Page Views)
INSERT OR IGNORE INTO visualizations (id, user_id, data_source_id, name, chart_type, config) VALUES (
    'user_viz_1',
    'regular_user_id',
    'user_data_source_1',
    'Daily Page Views',
    'line',
    '{
        "x_axis": "Date",
        "y_axis": "Page Views",
        "label_column": "Date",
        "data_column": "Page Views",
        "borderColor": "rgba(255, 99, 132, 1)",
        "backgroundColor": "rgba(255, 99, 132, 0.2)",
        "borderWidth": 2,
        "fill": false,
        "title": "Daily Website Page Views"
    }'
);

INSERT OR IGNORE INTO dashboards (id, user_id, name, description) VALUES (
    'user_dashboard_1',
    'regular_user_id',
    'Website Analytics',
    'Daily website traffic summary.'
);

INSERT OR IGNORE INTO dashboard_visualizations (dashboard_id, visualization_id, position) VALUES (
    'user_dashboard_1',
    'user_viz_1',
    '{"x":0, "y":0, "w":12, "h":8}'
);
```