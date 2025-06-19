```python
import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.getenv('SECRET_KEY') # Important for security, generate a strong key

db = SQLAlchemy(app)

# Database Models (simplified)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)


# API Endpoints (simplified)
@app.route('/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products])

# ... (Add other CRUD endpoints for Products and User authentication) ...


if __name__ == '__main__':
    db.create_all()  # Create tables if they don't exist
    app.run(debug=True, host='0.0.0.0') #host 0.0.0.0 for docker
```