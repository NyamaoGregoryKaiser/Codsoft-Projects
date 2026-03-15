```python
from django.db import models
from apps.core.models import TimestampedModel
from django.contrib.auth import get_user_model
import os

User = get_user_model()

def get_media_upload_path(instance, filename):
    """
    Defines the upload path for media items, organizing by user and date.
    e.g., media/user_1/2023/10/my_image.jpg
    """
    return os.path.join(
        'user_%s' % instance.owner.id,
        instance.created_at.strftime('%Y'),
        instance.created_at.strftime('%m'),
        filename
    )

class MediaItem(TimestampedModel):
    """
    Represents a file uploaded to the CMS, such as an image or document.
    """
    title = models.CharField(max_length=255, blank=True, help_text="A descriptive title for the media item.")
    file = models.FileField(upload_to=get_media_upload_path)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='media_items')
    file_type = models.CharField(max_length=50, blank=True, help_text="e.g., 'image/jpeg', 'application/pdf'")
    file_size = models.PositiveIntegerField(default=0, help_text="Size of the file in bytes.")
    description = models.TextField(blank=True)
    alt_text = models.CharField(max_length=255, blank=True, help_text="Alt text for images for accessibility.")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title or os.path.basename(self.file.name)

    def save(self, *args, **kwargs):
        # Set file_type and file_size automatically on save if not already set
        if not self.file_type and self.file:
            from mimetypes import guess_type
            self.file_type = guess_type(self.file.name)[0] or 'application/octet-stream'
        if self.file and not self.file_size:
            try:
                self.file_size = self.file.size
            except FileNotFoundError:
                # Handle cases where file might not exist on disk yet (e.g., initial save)
                pass
        super().save(*args, **kwargs)
```