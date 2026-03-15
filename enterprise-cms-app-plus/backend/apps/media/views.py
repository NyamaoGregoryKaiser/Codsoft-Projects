```python
import logging
from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from apps.media.models import MediaItem
from apps.media.serializers import MediaItemSerializer
from apps.users.permissions import IsOwnerOrAdmin # Custom permission

logger = logging.getLogger('apps')

class MediaItemViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing, uploading, and managing media items.
    - Owners can manage their own media.
    - Admin users can manage all media.
    - List view for owned media.
    """
    queryset = MediaItem.objects.select_related('owner').all()
    serializer_class = MediaItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser] # Required for file uploads

    def get_queryset(self):
        """
        Ensures users only see their own media, unless they are staff/admin.
        """
        if self.request.user.is_staff or self.request.user.is_superuser:
            return self.queryset # Staff/Superuser sees all media
        return self.queryset.filter(owner=self.request.user) # Regular users see only their own

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user) # Automatically set the owner to the current user
        logger.info(f"Media item uploaded: '{serializer.instance.title}' (ID: {serializer.instance.id}) by {self.request.user}")

    def perform_update(self, serializer):
        serializer.save()
        logger.info(f"Media item updated: '{serializer.instance.title}' (ID: {serializer.instance.id}) by {self.request.user}")

    def perform_destroy(self, instance):
        media_title = instance.title or instance.file.name
        # Delete the actual file from storage
        if instance.file:
            instance.file.delete(save=False) # save=False prevents saving the model, which we're about to delete anyway
        instance.delete()
        logger.info(f"Media item deleted: '{media_title}' (ID: {instance.id}) by {self.request.user}")

```