from django.urls import path, include
from rest_framework.routers import DefaultRouter
from orders import views

router = DefaultRouter()
router.register(r'items', views.OrderItemViewSet, basename='orderitem')
router.register(r'', views.OrderViewSet, basename='order') # Root for orders

urlpatterns = [
    path('', include(router.urls)),
]
--- END FILE ---

### **2. Database Layer**
- **Schema Definitions**: Handled by Django Models (`users/models.py`, `products/models.py`, `orders/models.py`).
- **Migrations**: Automatically managed by Django.
  - `python manage.py makemigrations`
  - `python manage.py migrate`
- **Seed Data**: A custom management command (`seed_data.py`) or fixtures can be used. For simplicity, we'll demonstrate using fixtures and manual creation of an admin user in setup.

---