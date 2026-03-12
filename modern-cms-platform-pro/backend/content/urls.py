from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, TagViewSet, MediaItemViewSet, PostViewSet, PageViewSet, ContentRevisionViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'tags', TagViewSet)
router.register(r'media', MediaItemViewSet)
router.register(r'posts', PostViewSet)
router.register(r'pages', PageViewSet)
router.register(r'revisions', ContentRevisionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

#### `backend/config/exceptions.py`

```python