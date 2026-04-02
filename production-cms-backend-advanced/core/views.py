import logging
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import viewsets, mixins, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from core.models import Category, Tag, Media, Content, Comment, ContentRevision
from core.serializers import (
    UserSerializer, RegisterUserSerializer, CategorySerializer, TagSerializer,
    MediaSerializer, ContentSerializer, CommentSerializer, ContentRevisionSerializer
)
from core.permissions import (
    IsAdminOrReadOnly, IsAuthorOrAdminOrReadOnly, IsOwnerOrAdmin,
    IsCommentAuthorOrAdminOrReadOnly
)
from django.core.cache import cache
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample

User = get_user_model()
logger = logging.getLogger(__name__)

class LoginThrottle(AnonRateThrottle):
    rate = '5/minute'
    scope = 'login' # Define in REST_FRAMEWORK settings

class UserViewSet(mixins.RetrieveModelMixin,
                  mixins.ListModelMixin,
                  mixins.UpdateModelMixin, # Allow users to update their own profile
                  viewsets.GenericViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    Admins can list and retrieve all users. Authenticated users can retrieve and update their own profile.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser] # Default to admin for list/retrieve all

    def get_permissions(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            # Allow any authenticated user to retrieve/update their own profile
            # And allow admin to retrieve/update any profile
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        # Non-admins can only see their own profile
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            return self.queryset.filter(id=self.request.user.id)
        return self.queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Ensure non-admin users can only retrieve their own profile
        if request.user.is_authenticated and not request.user.is_staff and instance != request.user:
            return Response({'detail': 'You do not have permission to view this user.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        # Ensure non-admin users can only update their own profile
        if request.user.is_authenticated and not request.user.is_staff and instance != request.user:
            return Response({'detail': 'You do not have permission to update this user.'}, status=status.HTTP_403_FORBIDDEN)

        # Allow non-admin users to update only specific fields for their own profile
        if not request.user.is_staff:
            allowed_fields = ['first_name', 'last_name', 'email']
            for field in request.data.keys():
                if field not in allowed_fields:
                    return Response({'detail': f'You are not allowed to update the field: {field}.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @extend_schema(
        summary="Get current user profile",
        description="Retrieves the profile of the currently authenticated user.",
        responses={200: UserSerializer}
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class RegisterView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    API endpoint for user registration.
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterUserSerializer
    throttle_classes = [AnonRateThrottle] # Prevent mass registrations

    @extend_schema(summary="Register a new user")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info(f"New user registered: {user.username}")
        return Response({
            "message": "User registered successfully.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT Token Obtain Pair view with throttling.
    """
    throttle_classes = [LoginThrottle]

    @extend_schema(
        summary="Obtain JWT Access and Refresh Tokens",
        description="Provides access and refresh tokens upon successful login.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'username': {'type': 'string'},
                    'password': {'type': 'string', 'format': 'password'},
                },
                'required': ['username', 'password'],
            }
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows categories to be viewed, created, updated or deleted.
    Admins have full CRUD. Others have read-only access.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

class TagViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows tags to be viewed, created, updated or deleted.
    Admins have full CRUD. Others have read-only access.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

class MediaViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows media files to be viewed, uploaded, updated or deleted.
    Authenticated users can upload and manage their own media. Admins can manage all.
    """
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin] # Require auth to upload, owner/admin to modify
    filterset_fields = ['uploaded_by']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def get_queryset(self):
        # Users can only see their own media, unless they are admin
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            return self.queryset.filter(uploaded_by=self.request.user)
        return self.queryset

class ContentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows content (posts/pages) to be viewed, created, updated or deleted.
    Public users can read published content.
    Authenticated users can create content, and modify their own content.
    Admins have full CRUD on all content.
    """
    queryset = Content.objects.prefetch_related('tags').select_related('author', 'category', 'featured_image').all()
    serializer_class = ContentSerializer
    permission_classes = [IsAdminOrReadOnly, IsAuthorOrAdminOrReadOnly] # Composed permissions
    lookup_field = 'slug'
    filterset_fields = ['author', 'category', 'status', 'content_type']
    search_fields = ['title', 'short_description', 'content'] # For /?search=query
    ordering_fields = ['published_at', 'views_count', 'title']

    def get_queryset(self):
        # Public users can only see published content
        if not self.request.user.is_authenticated:
            return self.queryset.filter(status='published', published_at__lte=timezone.now())
        # Authenticated users can see their own drafts/archived content
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            return self.queryset.filter(Q(status='published', published_at__lte=timezone.now()) | Q(author=self.request.user))
        # Admins see all
        return self.queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count if it's a public/published view
        if not request.user.is_authenticated or (request.user.is_authenticated and instance.status == 'published'):
            instance.increment_views()
            cache_key = f'content_detail_{instance.slug}'
            cache.delete(cache_key) # Invalidate cache for this item
            logger.info(f"Cache invalidated for {cache_key} after view count increment.")

        # Try to fetch from cache
        cache_key = f'content_detail_{instance.slug}_{request.user.is_authenticated}_{request.user.is_staff}'
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"Serving content {instance.slug} from cache.")
            return Response(cached_data)

        serializer = self.get_serializer(instance)
        response_data = serializer.data
        cache.set(cache_key, response_data, timeout=60 * 15) # Cache for 15 minutes
        logger.info(f"Content {instance.slug} cached.")
        return Response(response_data)

    @extend_schema(
        summary="List Content Revisions",
        description="Retrieves the revision history for a specific content item.",
        responses={200: ContentRevisionSerializer(many=True)}
    )
    @action(detail=True, methods=['get'], permission_classes=[IsAdminUser])
    def revisions(self, request, slug=None):
        content = self.get_object()
        revisions = content.revisions.all()
        serializer = ContentRevisionSerializer(revisions, many=True)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows comments to be viewed, created, updated or deleted.
    Public users can create comments (pending approval).
    Authenticated users can view approved comments.
    Comment authors or admins can update/delete their own comments (if approved or if they're admin).
    Admins can approve/disapprove comments and manage all comments.
    """
    queryset = Comment.objects.select_related('commenter', 'parent_comment', 'content_object').filter(parent_comment__isnull=True).all() # Only top-level for listing
    serializer_class = CommentSerializer
    permission_classes = [IsCommentAuthorOrAdminOrReadOnly]
    filterset_fields = ['content_object', 'approved', 'commenter']
    ordering_fields = ['created_at']

    def get_queryset(self):
        # If user is admin, show all comments including unapproved.
        if self.request.user.is_staff:
            return Comment.objects.select_related('commenter', 'parent_comment').all()
        # For non-admin, only show approved comments.
        return super().get_queryset().filter(approved=True)

    def create(self, request, *args, **kwargs):
        # We need the content_object_id to associate the comment
        content_slug = kwargs.get('content_slug')
        if not content_slug:
            return Response({'detail': 'Content slug is required to create a comment.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            content_obj = Content.objects.get(slug=content_slug)
        except Content.DoesNotExist:
            return Response({'detail': 'Content not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(content_object=content_obj)
        logger.info(f"Comment created on content {content_obj.title} by {request.user.username if request.user.is_authenticated else 'anonymous'}.")

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None, content_slug=None):
        comment = self.get_object()
        if not comment.approved:
            comment.approved = True
            comment.save(update_fields=['approved'])
            logger.info(f"Comment ID {comment.pk} approved by {request.user.username}.")
        return Response({'status': 'comment approved'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def disapprove(self, request, pk=None, content_slug=None):
        comment = self.get_object()
        if comment.approved:
            comment.approved = False
            comment.save(update_fields=['approved'])
            logger.info(f"Comment ID {comment.pk} disapproved by {request.user.username}.")
        return Response({'status': 'comment disapproved'})