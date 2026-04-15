```python
from faker import Faker
import random
from datetime import datetime, timedelta

from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.post import Post
from app.models.comment import Comment

# Initialize Faker
fake = Faker()

def generate_users(num_users=10):
    """Generates a list of fake users."""
    users = []
    # Create an admin user explicitly
    admin_user = User(
        username="admin",
        email="admin@example.com",
        role=UserRole.ADMIN,
        is_active=True
    )
    admin_user.set_password("admin_password")
    users.append(admin_user)

    # Create an editor user explicitly
    editor_user = User(
        username="editor",
        email="editor@example.com",
        role=UserRole.EDITOR,
        is_active=True
    )
    editor_user.set_password("editor_password")
    users.append(editor_user)

    # Create a regular user explicitly
    regular_user = User(
        username="user",
        email="user@example.com",
        role=UserRole.USER,
        is_active=True
    )
    regular_user.set_password("user_password")
    users.append(regular_user)


    for _ in range(num_users - len(users)): # Adjust for pre-created users
        username = fake.user_name()
        email = fake.email()
        password = "password123" # All fake users have a simple password
        role = random.choice([UserRole.USER, UserRole.USER, UserRole.EDITOR]) # More regular users
        is_active = fake.boolean(chance_of_getting_true=90)

        user = User(
            username=username,
            email=email,
            role=role,
            is_active=is_active
        )
        user.set_password(password)
        users.append(user)
    return users

def generate_posts(users, num_posts=50):
    """Generates a list of fake posts."""
    posts = []
    for _ in range(num_posts):
        title = fake.sentence(nb_words=6)[:-1] + " Blog Post"
        content = fake.paragraphs(nb=random.randint(3, 10))
        content = "\n\n".join(content)
        author = random.choice(users)
        created_at = fake.date_time_between(start_date="-2y", end_date="now")
        updated_at = created_at + timedelta(days=random.randint(0, 30)) if random.random() > 0.5 else created_at

        post = Post(
            title=title,
            content=content,
            author_id=author.id,
            created_at=created_at,
            updated_at=updated_at
        )
        posts.append(post)
    return posts

def generate_comments(users, posts, num_comments=150):
    """Generates a list of fake comments."""
    comments = []
    for _ in range(num_comments):
        content = fake.sentence(nb_words=random.randint(5, 20))
        author = random.choice(users)
        post = random.choice(posts)
        created_at = fake.date_time_between(start_date=post.created_at, end_date="now")

        comment = Comment(
            content=content,
            author_id=author.id,
            post_id=post.id,
            created_at=created_at
        )
        comments.append(comment)
    return comments

def seed_all():
    """Seeds the database with generated data."""
    print("Seeding database...")

    # Clear existing data (optional, useful for clean re-seeding)
    db.session.query(Comment).delete()
    db.session.query(Post).delete()
    db.session.query(User).delete()
    db.session.commit()

    # Generate and add users
    users = generate_users(num_users=15)
    db.session.add_all(users)
    db.session.commit()
    print(f"Added {len(users)} users.")

    # Generate and add posts
    # Need to query users again to get their IDs after commit
    all_users = User.query.all()
    posts = generate_posts(all_users, num_posts=50)
    db.session.add_all(posts)
    db.session.commit()
    print(f"Added {len(posts)} posts.")

    # Generate and add comments
    all_posts = Post.query.all()
    comments = generate_comments(all_users, all_posts, num_comments=150)
    db.session.add_all(comments)
    db.session.commit()
    print(f"Added {len(comments)} comments.")

    print("Database seeding complete!")

if __name__ == '__main__':
    # This block allows running `python seed_data.py` directly
    # Ensure FLASK_APP is set in your environment or by create_app
    app = create_app('development')
    with app.app_context():
        seed_all()
```