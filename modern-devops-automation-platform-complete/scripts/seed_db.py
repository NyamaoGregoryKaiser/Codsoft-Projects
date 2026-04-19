import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from app import create_app
from app.models import db, User, Project, Task

# Load environment variables
load_dotenv()

def seed_data():
    app = create_app(os.getenv('FLASK_CONFIG', 'development')) # Use development config
    with app.app_context():
        print("Seeding database...")
        db.create_all() # Ensure tables are created if not already by migrations

        # Clear existing data (optional, for development)
        db.session.query(Task).delete()
        db.session.query(Project).delete()
        db.session.query(User).delete()
        db.session.commit()
        print("Cleared existing data.")

        # Create Users
        admin_user = User(username='admin', email='admin@example.com', password='admin_password', is_admin=True)
        user1 = User(username='johndoe', email='john@example.com', password='password123')
        user2 = User(username='janesmith', email='jane@example.com', password='password123')

        db.session.add_all([admin_user, user1, user2])
        db.session.commit()
        print(f"Created users: {admin_user.username}, {user1.username}, {user2.username}")

        # Create Projects for User1
        project1 = Project(name='Website Redesign', description='Redesign the company website with new UX.', owner=user1)
        project2 = Project(name='API Development', description='Develop new REST API endpoints for mobile app.', owner=user1)
        project3 = Project(name='Marketing Campaign', description='Launch new digital marketing campaign for product X.', owner=user2)
        project4 = Project(name='Internal Tooling', description='Build an internal dashboard for sales team.', owner=admin_user, is_completed=True)


        db.session.add_all([project1, project2, project3, project4])
        db.session.commit()
        print(f"Created projects: {project1.name}, {project2.name}, {project3.name}, {project4.name}")

        # Create Tasks
        task1_1 = Task(title='Design new homepage', description='Create wireframes and mockups for the homepage.',
                       project=project1, assignee=user2, status='in-progress', priority='high', due_date=datetime.utcnow() + timedelta(days=7))
        task1_2 = Task(title='Develop frontend components', description='Implement React components for the new design.',
                       project=project1, assignee=user1, status='todo', priority='high', due_date=datetime.utcnow() + timedelta(days=14))
        task1_3 = Task(title='Integrate payment gateway', description='Setup Stripe for e-commerce functionality.',
                       project=project1, assignee=user1, status='completed', priority='medium')

        task2_1 = Task(title='Define API specs', description='Write OpenAPI documentation for user and project endpoints.',
                       project=project2, assignee=user1, status='completed', priority='high')
        task2_2 = Task(title='Implement user authentication', description='Add JWT authentication to the API.',
                       project=project2, assignee=user1, status='in-progress', priority='critical', due_date=datetime.utcnow() + timedelta(days=3))
        task2_3 = Task(title='Database schema design', description='Design new database tables for feature X.',
                       project=project2, assignee=admin_user, status='todo', priority='medium')

        task3_1 = Task(title='Social media strategy', description='Develop strategy for Facebook and Instagram ads.',
                       project=project3, assignee=user2, status='todo', priority='medium', due_date=datetime.utcnow() + timedelta(days=21))
        task3_2 = Task(title='Email campaign setup', description='Configure Mailchimp for newsletter automation.',
                       project=project3, assignee=user2, status='blocked', priority='low')

        task4_1 = Task(title='Initial dashboard mockups', project=project4, assignee=admin_user, status='completed', priority='medium')
        task4_2 = Task(title='Connect to sales database', project=project4, assignee=admin_user, status='completed', priority='high')


        db.session.add_all([task1_1, task1_2, task1_3, task2_1, task2_2, task2_3, task3_1, task3_2, task4_1, task4_2])
        db.session.commit()
        print("Created tasks.")

        print("Database seeding complete!")

if __name__ == '__main__':
    seed_data()
```