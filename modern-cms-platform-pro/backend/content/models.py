from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from users.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class MediaItem(models.Model):
    title = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to='media/')
    alt_text = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.title or self.file.name

class Content(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='authored_%(class)s')
    categories = models.ManyToManyField(Category, blank=True, related_name='%(class)s')
    tags = models.ManyToManyField(Tag, blank=True, related_name='%(class)s')
    featured_image = models.ForeignKey(MediaItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='%(class)s_featured')
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-published_at', '-created_at']
        unique_together = (('slug',),) # Ensure slugs are unique across content types

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            # Ensure unique slug by appending a number if necessary
            original_slug = self.slug
            queryset = type(self).objects.all()
            if self.pk:
                queryset = queryset.exclude(pk=self.pk)
            counter = 1
            while queryset.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1

        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        elif self.status != 'published' and self.published_at:
            # If content is unpublished, clear published_at or keep the last published date?
            # For simplicity, we'll clear it for now if it moves away from published
            # self.published_at = None
            pass # Or keep the last published date if it's considered 'last published'

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Post(Content):
    """
    A blog post.
    """
    pass

class Page(Content):
    """
    A static page, like "About Us" or "Contact".
    """
    pass

class ContentRevision(models.Model):
    content_object_id = models.PositiveIntegerField()
    content_type = models.ForeignKey('contenttypes.ContentType', on_delete=models.CASCADE)
    # Using GenericForeignKey
    content_object = models.GenericForeignKey('content_type', 'content_object_id')

    revision_number = models.PositiveIntegerField(default=1)
    # Store a snapshot of the content at the time of revision
    snapshot_title = models.CharField(max_length=255)
    snapshot_content = models.TextField()
    snapshot_status = models.CharField(max_length=20, choices=Content.STATUS_CHOICES, default='draft')
    revision_date = models.DateTimeField(auto_now_add=True)
    revised_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-revision_date']
        verbose_name = 'Content Revision'
        verbose_name_plural = 'Content Revisions'

    def __str__(self):
        return f"Revision {self.revision_number} for {self.content_object} ({self.revision_date.strftime('%Y-%m-%d %H:%M')})"
```

#### `backend/content/permissions.py`

```python