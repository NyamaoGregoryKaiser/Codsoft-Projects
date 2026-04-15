```python
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app import create_app
from app.extensions import db
from flask.cli import FlaskGroup
from flask_migrate import Migrate

app = create_app(os.getenv('FLASK_ENV', 'development'))
migrate = Migrate(app, db)
cli = FlaskGroup(app)

@app.cli.command("seed")
def seed_db():
    """Seeds the database with initial data."""
    from seed_data import seed_all
    with app.app_context():
        seed_all()
    print("Database seeded.")

@app.cli.command("test")
def test():
    """Runs the unit tests."""
    import pytest
    rv = pytest.main(['tests'])
    exit(rv)

if __name__ == '__main__':
    cli()
```