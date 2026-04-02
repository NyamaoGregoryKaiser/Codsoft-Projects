import logging
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from ckeditor.fields import RichTextField

User = get_user_model()
logger = logging.getLogger(__name__)

class BaseModel(models.Model):
    """Abstract base model with common fields."""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creation Date")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Last Update Date")

    class Meta:
        abstract = True
        ordering = ['-created_at']

class Category(BaseModel):
    """
    Represents a category for content (e.g., Blog, News, Tutorial).
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Category Name")
    slug = models.SlugField(max_length=100, unique=True, blank=True, verbose_name="Slug")
    description = models.TextField(blank=True, verbose_name="Description")

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Tag(BaseModel):
    """
    Represents a tag for content (e.g., Python, Django, Web Development).
    """
    name = models.CharField(max_length=50, unique=True, verbose_name="Tag Name")
    slug = models.SlugField(max_length=50, unique=True, blank=True, verbose_name="Slug")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Media(BaseModel):
    """
    Represents a media file (image, document) uploaded to the CMS.
    """
    file = models.FileField(
        upload_to='uploads/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'webp'])],
        verbose_name="File"
    )
    alt_text = models.CharField(max_length=255, blank=True, verbose_name="Alternative Text")
    caption = models.CharField(max_length=255, blank=True, verbose_name="Caption")
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_media',
        verbose_name="Uploaded By"
    )

    class Meta:
        verbose_name_plural = "Media Files"
        ordering = ['-uploaded_at'] # Inherits created_at from BaseModel, assuming uploaded_at is similar

    def __str__(self):
        return self.alt_text if self.alt_text else self.file.name

CONTENT_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('published', 'Published'),
    ('archived', 'Archived'),
]

CONTENT_TYPE_CHOICES = [
    ('page', 'Page'),
    ('post', 'Post'),
]

class Content(BaseModel):
    """
    Represents a piece of content (e.g., a blog post, a static page).
    """
    title = models.CharField(max_length=255, verbose_name="Title")
    slug = models.SlugField(max_length=255, unique=True, blank=True, verbose_name="Slug")
    short_description = models.TextField(blank=True, verbose_name="Short Description")
    content = RichTextField(verbose_name="Content Body") # Using RichTextField from CKEditor
    content_type = models.CharField(
        max_length=10,
        choices=CONTENT_TYPE_CHOICES,
        default='post',
        verbose_name="Content Type"
    )
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='authored_content',
        verbose_name="Author"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='content',
        verbose_name="Category"
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='content',
        verbose_name="Tags"
    )
    featured_image = models.ForeignKey(
        Media,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='featured_content',
        verbose_name="Featured Image"
    )
    status = models.CharField(
        max_length=10,
        choices=CONTENT_STATUS_CHOICES,
        default='draft',
        verbose_name="Status"
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Published Date"
    )
    views_count = models.PositiveIntegerField(default=0, verbose_name="Views Count")

    class Meta:
        verbose_name_plural = "Content"
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['content_type']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        # Ensure published_at is set when content is published for the first time
        if self.status == 'published' and self.published_at is None:
            self.published_at = timezone.now()
        # If content goes from published to draft/archived, clear published_at
        elif self.status != 'published' and self.published_at is not None:
             self.published_at = None
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return f"/api/v1/content/{self.slug}/"

    def increment_views(self):
        self.views_count += 1
        self.save(update_fields=['views_count'])
        logger.info(f"Incremented views for content: {self.title} to {self.views_count}")

class Comment(BaseModel):
    """
    Represents a comment on a piece of content.
    """
    content_object = models.ForeignKey(
        Content,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name="Content"
    )
    author_name = models.CharField(max_length=100, blank=True, verbose_name="Author Name")
    author_email = models.EmailField(blank=True, verbose_name="Author Email")
    commenter = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='comments',
        verbose_name="Commenter User"
    )
    body = models.TextField(verbose_name="Comment Body")
    approved = models.BooleanField(default=False, verbose_name="Approved")
    parent_comment = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name="Parent Comment"
    )

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author_name if self.author_name else self.commenter} on {self.content_object.title}"

    def save(self, *args, **kwargs):
        if self.commenter and not self.author_name:
            self.author_name = self.commenter.get_full_name() or self.commenter.username
        if self.commenter and not self.author_email:
            self.author_email = self.commenter.email
        super().save(*args, **kwargs)

class ContentRevision(BaseModel):
    """
    Stores historical revisions of content.
    """
    content_item = models.ForeignKey(Content, on_delete=models.CASCADE, related_name='revisions')
    previous_content = RichTextField(verbose_name="Previous Content Body")
    previous_title = models.CharField(max_length=255, verbose_name="Previous Title")
    revision_author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='content_revisions',
        verbose_name="Revision Author"
    )
    revision_message = models.TextField(blank=True, verbose_name="Revision Message")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Revision for '{self.previous_title}' by {self.revision_author} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"