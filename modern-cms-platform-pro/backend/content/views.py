from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.db.models import Prefetch
from django.utils.text import slugify
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from .models import Category, Tag, MediaItem, Post, Page, ContentRevision
from .serializers import (
    CategorySerializer, TagSerializer, MediaItemSerializer,
    PostSerializer, PageSerializer, ContentRevisionSerializer
)
from .permissions import IsAdminOrAuthorOrReadOnly, IsAdminOrReadOnly, IsAdminUser

# Cache timeout in seconds
CACHE_TTL = 60 * 5 # 5 minutes

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug' # Allow retrieving categories by slug

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    @method_decorator(cache_page(CACHE_TTL))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page(CACHE_TTL))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    @method_decorator(cache_page(CACHE_TTL))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page(CACHE_TTL))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class MediaItemViewSet(viewsets.ModelViewSet):
    queryset = MediaItem.objects.all()
    serializer_class = MediaItemSerializer
    permission_classes = [IsAdminOrReadOnly] # Only admins can upload/delete, any user can view

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'alt_text', 'file']
    ordering_fields = ['uploaded_at', 'title']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @method_decorator(cache_page(CACHE_TTL))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page(CACHE_TTL))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.select_related('author', 'featured_image').prefetch_related('categories', 'tags').all()
    serializer_class = PostSerializer
    permission_classes = [IsAdminOrAuthorOrReadOnly]
    lookup_field = 'slug'

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'author__first_name', 'author__last_name', 'categories__name', 'tags__name']
    ordering_fields = ['title', 'published_at', 'created_at', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        # For public views, only show published content
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(status='published')
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        # Create a revision before updating
        instance = self.get_object()
        self.create_revision(instance, self.request.user, "Content updated")
        serializer.save()

    def perform_destroy(self, instance):
        # Implement soft delete or archiving instead of hard delete in production
        instance.status = 'archived'
        instance.save()
        # super().perform_destroy(instance) # For hard delete
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser], url_path='publish')
    def publish(self, request, slug=None):
        post = self.get_object()
        if post.status != 'published':
            self.create_revision(post, request.user, "Content published")
            post.status = 'published'
            post.save()
            return Response({'status': 'post published'}, status=status.HTTP_200_OK)
        return Response({'status': 'post already published'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser], url_path='draft')
    def draft(self, request, slug=None):
        post = self.get_object()
        if post.status != 'draft':
            self.create_revision(post, request.user, "Content moved to draft")
            post.status = 'draft'
            post.save()
            return Response({'status': 'post moved to draft'}, status=status.HTTP_200_OK)
        return Response({'status': 'post already in draft'}, status=status.HTTP_200_OK)

    def create_revision(self, content_instance, user, notes):
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(content_instance)
        
        last_revision = ContentRevision.objects.filter(
            content_type=content_type,
            content_object_id=content_instance.id
        ).order_by('-revision_number').first()
        
        new_revision_number = 1
        if last_revision:
            new_revision_number = last_revision.revision_number + 1

        ContentRevision.objects.create(
            content_type=content_type,
            content_object_id=content_instance.id,
            revision_number=new_revision_number,
            snapshot_title=content_instance.title,
            snapshot_content=content_instance.content,
            snapshot_status=content_instance.status,
            revised_by=user,
            notes=notes
        )

    # Apply caching to list and retrieve views
    @method_decorator(cache_page(CACHE_TTL))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page(CACHE_TTL))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.select_related('author', 'featured_image').prefetch_related('categories', 'tags').all()
    serializer_class = PageSerializer
    permission_classes = [IsAdminOrAuthorOrReadOnly]
    lookup_field = 'slug'

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'author__first_name', 'author__last_name', 'categories__name', 'tags__name']
    ordering_fields = ['title', 'published_at', 'created_at', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(status='published')
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        # Re-using the revision logic from PostViewSet (can be refactored)
        PostViewSet.create_revision(self, instance, self.request.user, "Page updated")
        serializer.save()

    def perform_destroy(self, instance):
        instance.status = 'archived'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser], url_path='publish')
    def publish(self, request, slug=None):
        page = self.get_object()
        if page.status != 'published':
            PostViewSet.create_revision(self, page, request.user, "Page published")
            page.status = 'published'
            page.save()
            return Response({'status': 'page published'}, status=status.HTTP_200_OK)
        return Response({'status': 'page already published'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser], url_path='draft')
    def draft(self, request, slug=None):
        page = self.get_object()
        if page.status != 'draft':
            PostViewSet.create_revision(self, page, request.user, "Page moved to draft")
            page.status = 'draft'
            page.save()
            return Response({'status': 'page moved to draft'}, status=status.HTTP_200_OK)
        return Response({'status': 'page already in draft'}, status=status.HTTP_200_OK)

    # Apply caching to list and retrieve views
    @method_decorator(cache_page(CACHE_TTL))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @method_decorator(cache_page(CACHE_TTL))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class ContentRevisionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ContentRevision.objects.select_related('revised_by').all()
    serializer_class = ContentRevisionSerializer
    permission_classes = [IsAdminUser] # Only admins can view revisions

    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['revision_date', 'revision_number']

    @extend_schema(summary="List all content revisions (Admin only)")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @extend_schema(summary="Retrieve a specific content revision (Admin only)")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def restore(self, request, pk=None):
        revision = self.get_object()
        content_object = revision.content_object
        
        if not content_object:
            return Response({"detail": "Content object associated with this revision not found."}, status=status.HTTP_404_NOT_FOUND)

        # Restore content from snapshot
        content_object.title = revision.snapshot_title
        content_object.content = revision.snapshot_content
        content_object.status = revision.snapshot_status # Restore status too
        # Don't change author, created_at, etc.
        content_object.save()
        
        # Create a new revision noting the restoration
        PostViewSet.create_revision(self, content_object, request.user, f"Restored from revision {revision.revision_number}")

        serializer_class = PostSerializer if isinstance(content_object, Post) else PageSerializer
        serializer = serializer_class(content_object, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

```

#### `backend/content/urls.py`

```python