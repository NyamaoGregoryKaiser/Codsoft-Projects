```python
import logging
from django.db.models import Q
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.core.cache import cache

from apps.content.models import Category, Tag, Post, Page
from apps.content.serializers import CategorySerializer, TagSerializer, PostSerializer, PageSerializer
from apps.users.permissions import IsAuthorOrReadOnly, IsAdminOrReadOnly # Custom permissions

logger = logging.getLogger('apps')

class CategoryViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing categories.
    Allows creation/update/deletion for authenticated staff, read-only for others.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAdminOrReadOnly]
    lookup_field = 'slug' # Use slug for lookup instead of ID
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def perform_create(self, serializer):
        serializer.save()
        logger.info(f"Category created: {serializer.instance.name} by {self.request.user}")
        cache.delete_pattern('category_list_*') # Invalidate relevant cache

    def perform_update(self, serializer):
        serializer.save()
        logger.info(f"Category updated: {serializer.instance.name} by {self.request.user}")
        cache.delete_pattern('category_detail_*') # Invalidate relevant cache
        cache.delete_pattern('category_list_*')

    def perform_destroy(self, instance):
        category_name = instance.name
        instance.delete()
        logger.info(f"Category deleted: {category_name} by {self.request.user}")
        cache.delete_pattern('category_detail_*')
        cache.delete_pattern('category_list_*')

    # Example of caching specific list views
    def list(self, request, *args, **kwargs):
        cache_key = f"category_list_{request.query_params.urlencode()}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Serving categories from cache: {cache_key}")
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60 * 5) # Cache for 5 minutes
        logger.debug(f"Caching categories list: {cache_key}")
        return response

    # Example of caching specific retrieve views
    def retrieve(self, request, *args, **kwargs):
        cache_key = f"category_detail_{kwargs['slug']}"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Serving category detail from cache: {cache_key}")
            return Response(cached_data)

        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60 * 10) # Cache for 10 minutes
        logger.debug(f"Caching category detail: {cache_key}")
        return response


class TagViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing tags.
    Allows creation/update/deletion for authenticated staff, read-only for others.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAdminOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    def perform_create(self, serializer):
        serializer.save()
        logger.info(f"Tag created: {serializer.instance.name} by {self.request.user}")
        cache.delete_pattern('tag_list_*')

    def perform_update(self, serializer):
        serializer.save()
        logger.info(f"Tag updated: {serializer.instance.name} by {self.request.user}")
        cache.delete_pattern('tag_detail_*')
        cache.delete_pattern('tag_list_*')

    def perform_destroy(self, instance):
        tag_name = instance.name
        instance.delete()
        logger.info(f"Tag deleted: {tag_name} by {self.request.user}")
        cache.delete_pattern('tag_detail_*')
        cache.delete_pattern('tag_list_*')


class PostViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing posts.
    - Public posts: Anyone can view published posts.
    - Drafts/Archived: Only author or admin can view/edit/delete.
    - Permissions: IsAuthenticatedOrReadOnly, IsAuthorOrAdminReadOnly
    """
    queryset = Post.objects.select_related('author', 'featured_image').prefetch_related('categories', 'tags').all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'categories__slug', 'tags__slug', 'author__username']
    search_fields = ['title', 'content', 'excerpt', 'author__username', 'categories__name', 'tags__name']
    ordering_fields = ['published_at', 'title', 'author__username', 'created_at']

    def get_queryset(self):
        """
        Filter posts based on status and user permissions.
        - Unauthenticated users can only see 'published' posts.
        - Authenticated users can see 'published' posts.
        - Authenticated users (who are authors) can see their own 'draft' and 'archived' posts.
        - Staff/Admin users can see all posts.
        """
        queryset = self.queryset

        if self.request.user.is_authenticated:
            if self.request.user.is_staff or self.request.user.is_superuser:
                return queryset # Staff/Superuser sees all
            else:
                # Authenticated non-staff users see published posts OR their own drafts/archived posts
                return queryset.filter(
                    Q(status='published') | Q(author=self.request.user)
                ).distinct()
        else:
            # Unauthenticated users only see published posts
            return queryset.filter(status='published')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user) # Assign the author automatically
        logger.info(f"Post created: '{serializer.instance.title}' by {self.request.user}")
        cache.delete_pattern('post_list_*') # Invalidate cache

    def perform_update(self, serializer):
        serializer.save()
        logger.info(f"Post updated: '{serializer.instance.title}' by {self.request.user}")
        cache.delete_pattern('post_detail_*')
        cache.delete_pattern('post_list_*')

    def perform_destroy(self, instance):
        post_title = instance.title
        instance.delete()
        logger.info(f"Post deleted: '{post_title}' by {self.request.user}")
        cache.delete_pattern('post_detail_*')
        cache.delete_pattern('post_list_*')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def publish(self, request, slug=None):
        """
        Action to publish a post. Only for admin users.
        """
        post = self.get_object()
        if post.status != 'published':
            post.status = 'published'
            post.published_at = timezone.now()
            post.save()
            logger.info(f"Post '{post.title}' published by {self.request.user}")
            cache.delete_pattern('post_detail_*')
            cache.delete_pattern('post_list_*') # Important to clear for public visibility
            return Response({'status': 'post published'}, status=status.HTTP_200_OK)
        return Response({'status': 'post already published'}, status=status.HTTP_200_OK)

    # Example of caching specific list views
    def list(self, request, *args, **kwargs):
        # Cache key depends on user auth status, query params, and permissions
        user_id = request.user.id if request.user.is_authenticated else 'anon'
        cache_key = f"post_list_{user_id}_{request.query_params.urlencode()}"
        
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Serving posts from cache: {cache_key}")
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60 * 2) # Cache for 2 minutes
        logger.debug(f"Caching posts list: {cache_key}")
        return response

    # Example of caching specific retrieve views
    def retrieve(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else 'anon'
        cache_key = f"post_detail_{kwargs['slug']}_{user_id}"

        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug(f"Serving post detail from cache: {cache_key}")
            return Response(cached_data)

        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60 * 5) # Cache for 5 minutes
        logger.debug(f"Caching post detail: {cache_key}")
        return response


class PageViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing pages.
    - Public pages: Anyone can view published pages.
    - Drafts: Only author or admin can view/edit/delete.
    - Permissions: IsAuthenticatedOrReadOnly, IsAuthorOrAdminReadOnly
    """
    queryset = Page.objects.select_related('author', 'parent_page').all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published', 'author__username', 'parent_page__slug']
    search_fields = ['title', 'content', 'author__username']
    ordering_fields = ['order', 'title', 'created_at']

    def get_queryset(self):
        """
        Filter pages based on publishing status and user permissions.
        """
        queryset = self.queryset

        if self.request.user.is_authenticated:
            if self.request.user.is_staff or self.request.user.is_superuser:
                return queryset # Staff/Superuser sees all
            else:
                # Authenticated non-staff users see published pages OR their own unpublished pages
                return queryset.filter(
                    Q(is_published=True) | Q(author=self.request.user)
                ).distinct()
        else:
            # Unauthenticated users only see published pages
            return queryset.filter(is_published=True)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
        logger.info(f"Page created: '{serializer.instance.title}' by {self.request.user}")
        cache.delete_pattern('page_list_*')

    def perform_update(self, serializer):
        serializer.save()
        logger.info(f"Page updated: '{serializer.instance.title}' by {self.request.user}")
        cache.delete_pattern('page_detail_*')
        cache.delete_pattern('page_list_*')

    def perform_destroy(self, instance):
        page_title = instance.title
        instance.delete()
        logger.info(f"Page deleted: '{page_title}' by {self.request.user}")
        cache.delete_pattern('page_detail_*')
        cache.delete_pattern('page_list_*')
```