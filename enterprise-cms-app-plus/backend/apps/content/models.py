```python
from django.db import models
from apps.core.models import TimestampedModel
from django.contrib.auth import get_user_model

User = get_user_model()

class Category(TimestampedModel):
    """
    Represents a category for organizing content (e.g., 'News', 'Tutorials').
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True, help_text="A unique identifier for the URL, auto-generated from the name.")
    description = models.TextField(blank=True, help_text="Brief description of the category.")

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

class Tag(TimestampedModel):
    """
    Represents a tag for fine-grained content classification (e.g., 'Python', 'Django', 'React').
    """
    name = models.CharField(max_length=50, unique=True, db_index=True)
    slug = models.SlugField(max_length=50, unique=True, db_index=True, help_text="A unique identifier for the URL, auto-generated from the name.")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Post(TimestampedModel):
    """
    Represents a blog post or article content.
    """
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )

    title = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True, help_text="A unique identifier for the URL, auto-generated from the title.")
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='posts')
    content = models.TextField()
    excerpt = models.TextField(blank=True, help_text="A short summary of the post, typically for listings.")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', db_index=True)
    featured_image = models.ForeignKey('media.MediaItem', on_delete=models.SET_NULL, null=True, blank=True, related_name='post_featured_image')
    categories = models.ManyToManyField(Category, blank=True, related_name='posts')
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')
    published_at = models.DateTimeField(null=True, blank=True, help_text="Date and time when the post was officially published.")

    class Meta:
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title

class Page(TimestampedModel):
    """
    Represents a static page (e.g., 'About Us', 'Contact', 'Privacy Policy').
    """
    title = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True, help_text="A unique identifier for the URL, auto-generated from the title.")
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='pages')
    content = models.TextField()
    is_published = models.BooleanField(default=False, db_index=True)
    parent_page = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    order = models.IntegerField(default=0, help_text="Order in which pages should appear in navigation.")

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return self.title
```