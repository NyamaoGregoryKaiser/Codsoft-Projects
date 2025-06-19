import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from marshmallow import Schema, fields
from dotenv import load_dotenv
from flask_httpauth import HTTPBasicAuth

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
db = SQLAlchemy(app)
migrate = Migrate(app, db)
auth = HTTPBasicAuth()

# Database Models
class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Todo {self.description}>'

# Marshmallow Schemas for serialization/deserialization
class TodoSchema(Schema):
    id = fields.Int(dump_only=True)
    description = fields.Str(required=True)
    completed = fields.Bool()


# Authentication (Basic Auth - replace with more robust method for production)
users = {
    "admin": "admin"
}

@auth.verify_password
def verify_password(username, password):
    if username in users and users[username] == password:
        return username
    return None

# API Endpoints
@app.route('/todos', methods=['GET'])
@auth.login_required
def get_todos():
    todos = Todo.query.all()
    result = TodoSchema(many=True).dump(todos)
    return jsonify(result)

@app.route('/todos', methods=['POST'])
@auth.login_required
def create_todo():
    data = request.get_json()
    new_todo = Todo(description=data['description'])
    db.session.add(new_todo)
    db.session.commit()
    result = TodoSchema().dump(new_todo)
    return jsonify(result), 201

# ... (Implement PUT and DELETE endpoints similarly) ...


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)