```python
from marshmallow import Schema, fields, validate

# Shared fields or base schemas can go here
class BaseSchema(Schema):
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    id = fields.Int(dump_only=True)
```