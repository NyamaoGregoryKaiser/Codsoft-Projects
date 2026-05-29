from django.urls import path, include
from rest_framework.routers import DefaultRouter
from products import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'', views.ProductViewSet, basename='product') # Root for products

urlpatterns = [
    path('', include(router.urls)),
]
--- END FILE ---

---