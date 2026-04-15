```python
from marshmallow import Schema, fields, validate
from app.schemas import BaseSchema
from app.schemas.user import UserSchema

class CommentSchema(BaseSchema):
    content = fields.Str(required=True, validate=[validate.Length(min=1, max=500)])
    author_id = fields.Int(required=True, load_only=True)
    post_id = fields.Int(required=True, load_only=True)
    author = fields.Nested(UserSchema, dump_only=True, exclude=("email", "created_at", "updated_at", "is_active")) # Embed author info on dump

class CommentUpdateSchema(CommentSchema):
    content = fields.Str(required=False, validate=[validate.Length(min=1, max=500)])
    # post_id and author_id typically not updated for a comment
```