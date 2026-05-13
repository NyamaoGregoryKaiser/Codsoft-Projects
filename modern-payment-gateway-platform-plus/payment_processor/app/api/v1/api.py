from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, users, merchants, customers, payment_methods, transactions, webhooks
)
from app.core.config import settings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(merchants.router, prefix="/merchants", tags=["Merchants"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(payment_methods.router, prefix="/payment-methods", tags=["Payment Methods"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

```

#### `payment_processor/app/api/v1/endpoints/auth.py`
```python