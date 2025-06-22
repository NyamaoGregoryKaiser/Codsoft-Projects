import pytest
import requests
from app import app, db, User

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()


def test_register(client):
    rv = client.post('/register', json={'username': 'testuser', 'password': 'testpassword'})
    assert rv.status_code == 201
    user = User.query.filter_by(username='testuser').first()
    assert user is not None


def test_login(client):
    #Requires a user to be registered first (eg. using test_register)
    rv = client.post('/login', json={'username': 'testuser', 'password': 'testpassword'})
    assert rv.status_code == 200
    token = rv.json['access_token']

    headers = {'Authorization': f'Bearer {token}'}
    protected_rv = client.get('/protected', headers=headers)
    assert protected_rv.status_code == 200
    assert protected_rv.json['username'] == 'testuser'


# Add more tests for other functionalities and error handling.