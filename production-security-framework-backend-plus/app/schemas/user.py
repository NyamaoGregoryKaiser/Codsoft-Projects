```python
from marshmallow import Schema, fields, validate, post_load
from app.schemas import BaseSchema
from app.models.user import User, UserRole

class UserRegistrationSchema(BaseSchema):
    username = fields.Str(required=True, validate=[validate.Length(min=3, max=80)])
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=[validate.Length(min=8)])
    role = fields.Enum(UserRole, by_value=True, dump_only=True) # Role is assigned by backend, not user

    @post_load
    def make_user(self, data, **kwargs):
        # Create a User object (without password hashing here, done in service)
        return User(username=data['username'], email=data['email'])

class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)

class UserSchema(BaseSchema):
    username = fields.Str(required=True, validate=[validate.Length(min=3, max=80)])
    email = fields.Email(required=True)
    role = fields.Enum(UserRole, by_value=True, required=False)
    is_active = fields.Bool(required=False)

    class Meta:
        model = User
        load_instance = True # For loading into existing instance on partial update
        # fields = ("id", "username", "email", "role", "is_active", "created_at", "updated_at")

class UserUpdateSchema(UserSchema):
    # Make fields optional for partial updates
    username = fields.Str(required=False, validate=[validate.Length(min=3, max=80)])
    email = fields.Email(required=False)
    password = fields.Str(required=False, load_only=True, validate=[validate.Length(min=8)])
    role = fields.Enum(UserRole, by_value=True, required=False)
    is_active = fields.Bool(required=False)

    # Remove ID from updateable fields to prevent changing ID
    id = fields.Int(dump_only=True)
```