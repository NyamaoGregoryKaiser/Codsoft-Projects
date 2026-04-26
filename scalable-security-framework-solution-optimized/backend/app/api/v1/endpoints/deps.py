```python
# Re-export core dependencies for easier import in API endpoints
from app.core.dependencies import (
    get_db,
    oauth2_scheme,
    get_current_user,
    get_current_admin,
    get_current_active_user,
    require_role
)
```