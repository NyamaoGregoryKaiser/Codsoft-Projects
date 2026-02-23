```python
import json
from datetime import datetime, date

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle datetime objects."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

def safe_json_dump(data):
    """Safely dumps data to JSON, handling datetimes."""
    return json.dumps(data, cls=JSONEncoder)

```