```python
import os
import sys
from datetime import datetime, timedelta

# Adjust path to import from the application
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models import User, Role, DataSource, Visualization, Dashboard

def seed_data(app):
    with app.app_context():
        print("Seeding database...")
        db.create_all() # Ensure all tables exist

        # 1. Create Roles
        admin_role = Role.query.filter_by(name='admin').first()
        if not admin_role:
            admin_role = Role(name='admin', description='Administrator with full access')
            db.session.add(admin_role)
            print("Created 'admin' role.")

        editor_role = Role.query.filter_by(name='editor').first()
        if not editor_role:
            editor_role = Role(name='editor', description='Can create/edit data sources, visualizations, dashboards')
            db.session.add(editor_role)
            print("Created 'editor' role.")

        user_role = Role.query.filter_by(name='user').first()
        if not user_role:
            user_role = Role(name='user', description='Can view own and public dashboards')
            db.session.add(user_role)
            print("Created 'user' role.")
        db.session.commit()

        # 2. Create Users
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(username='admin', email='admin@example.com')
            admin_user.set_password('adminpass')
            admin_user.roles.append(admin_role)
            admin_user.roles.append(editor_role) # Admins are also editors
            db.session.add(admin_user)
            print("Created 'admin' user.")

        editor_user = User.query.filter_by(username='editor').first()
        if not editor_user:
            editor_user = User(username='editor', email='editor@example.com')
            editor_user.set_password('editorpass')
            editor_user.roles.append(editor_role)
            db.session.add(editor_user)
            print("Created 'editor' user.")

        viewer_user = User.query.filter_by(username='viewer').first()
        if not viewer_user:
            viewer_user = User(username='viewer', email='viewer@example.com')
            viewer_user.set_password('viewerpass')
            viewer_user.roles.append(user_role)
            db.session.add(viewer_user)
            print("Created 'viewer' user.")
        db.session.commit()

        # 3. Create Data Sources
        # NOTE: For real data sources, connection strings must be valid and encrypted.
        # Here we use placeholders.
        pg_ds = DataSource.query.filter_by(name='Sample PostgreSQL', user_id=editor_user.id).first()
        if not pg_ds:
            pg_ds = DataSource(
                user_id=editor_user.id,
                name='Sample PostgreSQL',
                type='postgresql',
                connection_string='postgresql://user:password@db:5432/dashboard_db' # Use same as app
            )
            db.session.add(pg_ds)
            print("Created 'Sample PostgreSQL' data source.")

        csv_data = """
id,name,value,category,date
1,Apple,100,Fruit,2023-01-01
2,Orange,150,Fruit,2023-01-05
3,Banana,80,Fruit,2023-01-10
4,Carrot,120,Vegetable,2023-01-15
5,Potato,90,Vegetable,2023-01-20
6,Grapes,200,Fruit,2023-01-25
"""
        csv_ds = DataSource.query.filter_by(name='Sample CSV Data', user_id=editor_user.id).first()
        if not csv_ds:
            csv_ds = DataSource(
                user_id=editor_user.id,
                name='Sample CSV Data',
                type='csv',
                connection_string=csv_data.strip()
            )
            db.session.add(csv_ds)
            print("Created 'Sample CSV Data' data source.")
        db.session.commit()


        # 4. Create Visualizations
        if pg_ds and csv_ds:
            # Bar Chart from CSV
            bar_chart_viz = Visualization.query.filter_by(name='Fruit Value by Category', user_id=editor_user.id).first()
            if not bar_chart_viz:
                bar_chart_viz = Visualization(
                    user_id=editor_user.id,
                    name='Fruit Value by Category',
                    description='Bar chart showing total value for fruits/vegetables from CSV.',
                    chart_type='bar',
                    data_source_id=csv_ds.id,
                    query_config={
                        'query_string': 'SELECT category, SUM(value) as total_value FROM default_csv_table GROUP BY category',
                        'aggregate_by': 'category',
                        'value_field': 'total_value'
                    },
                    chart_config={
                        'title': 'Total Value by Category',
                        'x_axis': {'field': 'category', 'label': 'Category'},
                        'y_axis': {'field': 'total_value', 'label': 'Total Value'},
                        'color_by': 'category'
                    }
                )
                db.session.add(bar_chart_viz)
                print("Created 'Fruit Value by Category' visualization.")

            # Line Chart from CSV
            line_chart_viz = Visualization.query.filter_by(name='Daily Value Trend', user_id=editor_user.id).first()
            if not line_chart_viz:
                line_chart_viz = Visualization(
                    user_id=editor_user.id,
                    name='Daily Value Trend',
                    description='Line chart showing daily value trend from CSV.',
                    chart_type='line',
                    data_source_id=csv_ds.id,
                    query_config={
                        'query_string': 'SELECT date, SUM(value) as daily_value FROM default_csv_table GROUP BY date ORDER BY date',
                        'x_field': 'date',
                        'y_field': 'daily_value'
                    },
                    chart_config={
                        'title': 'Daily Value Trend',
                        'x_axis': {'field': 'date', 'label': 'Date'},
                        'y_axis': {'field': 'daily_value', 'label': 'Daily Value'},
                        'line_color': '#4CAF50'
                    }
                )
                db.session.add(line_chart_viz)
                print("Created 'Daily Value Trend' visualization.")
            db.session.commit()

            # 5. Create Dashboards
            if bar_chart_viz and line_chart_viz:
                sample_dashboard = Dashboard.query.filter_by(name='CSV Data Overview', user_id=editor_user.id).first()
                if not sample_dashboard:
                    sample_dashboard = Dashboard(
                        user_id=editor_user.id,
                        name='CSV Data Overview',
                        description='An overview dashboard for sample CSV data.',
                        layout=[
                            {'i': str(bar_chart_viz.id), 'x': 0, 'y': 0, 'w': 6, 'h': 10},
                            {'i': str(line_chart_viz.id), 'x': 6, 'y': 0, 'w': 6, 'h': 10},
                        ],
                        is_public=True,
                        visualizations=[bar_chart_viz, line_chart_viz]
                    )
                    db.session.add(sample_dashboard)
                    print("Created 'CSV Data Overview' dashboard.")
                db.session.commit()
        else:
            print("Skipping visualization and dashboard creation: Data sources not available.")

        print("Seeding complete.")

if __name__ == '__main__':
    # Use DevelopmentConfig for seeding by default
    app = create_app(config_class=os.environ.get('FLASK_CONFIG', 'DevelopmentConfig'))
    seed_data(app)

```