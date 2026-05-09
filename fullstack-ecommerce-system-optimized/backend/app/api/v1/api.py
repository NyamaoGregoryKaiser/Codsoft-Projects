```python
from fastapi import APIRouter

from app.api.v1.endpoints import (
    users, auth, products, categories, carts, orders, reviews
)

api_router = APIRouter()
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(carts.router, prefix="/carts", tags=["Carts"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])

```