from datetime import datetime, timedelta
from backend.app.extensions import db, bcrypt
from flask import current_app
import jwt

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True, nullable=False)
    email = db.Column(db.String(120), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)

    # Relationships
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), default=2) # Default to 'User' role
    role = db.relationship('Role', backref=db.backref('users', lazy='dynamic'))

    posts = db.relationship('Post', backref='author', lazy='dynamic')

    def __init__(self, username, email, password, role_name='User'):
        self.username = username
        self.email = email
        self.set_password(password)
        self.role = db.session.scalar(db.select(Role).filter_by(name=role_name))
        if self.role is None:
            raise ValueError(f"Role '{role_name}' does not exist.")

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def generate_reset_token(self, expires_in=3600):
        # Using PyJWT directly for password reset tokens, as Flask-JWT-Extended
        # is for access/refresh tokens and has different semantics.
        # This token is specifically for password reset and is signed with SECRET_KEY
        reset_jwt = jwt.encode(
            {
                'user_id': self.id,
                'exp': datetime.utcnow() + timedelta(seconds=expires_in)
            },
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        return reset_jwt

    @staticmethod
    def verify_reset_token(token):
        try:
            data = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            user_id = data.get('user_id')
        except jwt.ExpiredSignatureError:
            return None # Token has expired
        except jwt.InvalidTokenError:
            return None # Invalid token
        return db.session.scalar(db.select(User).filter_by(id=user_id))


    def has_role(self, role_name):
        return self.role.name == role_name

    def __repr__(self):
        return f'<User {self.username}>'

# Pydantic-like schema for serialization (using Marshmallow instead)
from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=64))
    email = fields.Email(required=True, validate=validate.Length(min=5, max=120))
    role = fields.Nested('RoleSchema', only=('name',), dump_only=True) # Nested for read-only
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    active = fields.Bool(dump_only=True)

class UserRegisterSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=64))
    email = fields.Email(required=True, validate=validate.Length(min=5, max=120))
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=6))

class UserUpdateSchema(Schema):
    username = fields.Str(validate=validate.Length(min=3, max=64))
    email = fields.Email(validate=validate.Length(min=5, max=120))
    old_password = fields.Str(load_only=True)
    new_password = fields.Str(load_only=True, validate=validate.Length(min=6))
```