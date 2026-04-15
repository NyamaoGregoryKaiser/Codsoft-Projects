```python
from marshmallow import Schema, fields, validate
from app.schemas import BaseSchema
from app.schemas.user import UserSchema

class PostSchema(BaseSchema):
    title = fields.Str(required=True, validate=[validate.Length(min=5, max=255)])
    content = fields.Str(required=True, validate=[validate.Length(min=10)])
    author_id = fields.Int(required=True, load_only=True) # Author ID is sent in payload for creation, but linked to current user or explicitly for admin
    author = fields.Nested(UserSchema, dump_only=True, exclude=("email", "created_at", "updated_at", "is_active")) # Embed author info on dump
    comments = fields.List(fields.Nested("CommentSchema"), dump_only=True) # Forward reference to CommentSchema

class PostUpdateSchema(PostSchema):
    # Make fields optional for partial updates
    title = fields.Str(required=False, validate=[validate.Length(min=5, max=255)])
    content = fields.Str(required=False, validate=[validate.Length(min=10)])
    author_id = fields.Int(required=False, load_only=True) # Author ID can be updated by admin
```