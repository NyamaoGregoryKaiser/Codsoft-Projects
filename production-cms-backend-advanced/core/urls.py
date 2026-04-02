from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from core.views import (
    UserViewSet, RegisterView, CustomTokenObtainPairView,
    CategoryViewSet, TagViewSet, MediaViewSet, ContentViewSet,
    CommentViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'register', RegisterView, basename='register')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'media', MediaViewSet, basename='media')
router.register(r'content', ContentViewSet, basename='content')

# Special routing for comments nested under content
# Note: DRF SimpleRouter doesn't easily support nested routes out of the box.
# We'll handle this manually for a cleaner URL structure.
# E.g., /api/v1/content/{content_slug}/comments/
# The ContentViewSet handles content itself, and Comments will have a specific URL.

urlpatterns = [
    path('', include(router.urls)),

    # Authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Nested comments specific URL: Content comments
    path('content/<slug:content_slug>/comments/', CommentViewSet.as_view({'get': 'list', 'post': 'create'}), name='content-comments-list'),
    path('content/<slug:content_slug>/comments/<int:pk>/', CommentViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
        'post': 'approve', # Custom action for approving comments
        'post': 'disapprove', # Custom action for disapproving comments
    }), name='content-comments-detail'),
]
```

### `config/urls.py` (Root URL config)
```python