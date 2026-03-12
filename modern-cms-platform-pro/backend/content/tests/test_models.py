from django.test import TestCase
from django.contrib.auth import get_user_model
from content.models import Category, Tag, Post, Page, MediaItem, ContentRevision
import os
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.contenttypes.models import ContentType

User = get_user_model()

class ContentModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='password', first_name='Test', last_name='User', is_staff=True)
        self.category1 = Category.objects.create(name='Tech')
        self.tag1 = Tag.objects.create(name='Python')
        
        # Create a dummy image file for MediaItem
        img_path = os.path.join(settings.BASE_DIR, 'tmp', 'test_image.png')
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        from PIL import Image
        image = Image.new('RGB', (100, 100), color = 'red')
        image.save(img_path)
        with open(img_path, 'rb') as f:
            self.image_file = SimpleUploadedFile(name='test_image.png', content=f.read(), content_type='image/png')
            self.media_item = MediaItem.objects.create(title='Test Image', file=self.image_file, uploaded_by=self.user)
        os.remove(img_path) # Clean up

    def test_category_creation(self):
        category = Category.objects.get(name='Tech')
        self.assertEqual(category.slug, 'tech')

    def test_tag_creation(self):
        tag = Tag.objects.get(name='Python')
        self.assertEqual(tag.slug, 'python')

    def test_media_item_creation(self):
        self.assertIsNotNone(self.media_item.file)
        self.assertEqual(self.media_item.uploaded_by, self.user)

    def test_post_creation(self):
        post = Post.objects.create(
            title='My First Post',
            content='This is the content of my first post.',
            author=self.user,
            status='published',
            featured_image=self.media_item
        )
        post.categories.add(self.category1)
        post.tags.add(self.tag1)
        
        self.assertEqual(post.title, 'My First Post')
        self.assertEqual(post.slug, 'my-first-post')
        self.assertEqual(post.author, self.user)
        self.assertEqual(post.status, 'published')
        self.assertIsNotNone(post.published_at)
        self.assertIn(self.category1, post.categories.all())
        self.assertIn(self.tag1, post.tags.all())
        self.assertEqual(post.featured_image, self.media_item)

    def test_page_creation(self):
        page = Page.objects.create(
            title='About Us',
            content='Information about our company.',
            author=self.user,
            status='draft'
        )
        self.assertEqual(page.title, 'About Us')
        self.assertEqual(page.slug, 'about-us')
        self.assertEqual(page.status, 'draft')
        self.assertIsNone(page.published_at)

    def test_slug_uniqueness(self):
        Post.objects.create(title='Duplicate Title', content='...', author=self.user)
        post2 = Post.objects.create(title='Duplicate Title', content='...', author=self.user)
        self.assertNotEqual(post2.slug, 'duplicate-title')
        self.assertTrue(post2.slug.startswith('duplicate-title-'))

    def test_content_revision_creation(self):
        post = Post.objects.create(title='Original Post', content='Original content', author=self.user)
        
        content_type = ContentType.objects.get_for_model(post)
        revision = ContentRevision.objects.create(
            content_object_id=post.id,
            content_type=content_type,
            revision_number=1,
            snapshot_title=post.title,
            snapshot_content=post.content,
            snapshot_status=post.status,
            revised_by=self.user,
            notes="Initial revision"
        )
        self.assertEqual(revision.content_object, post)
        self.assertEqual(revision.snapshot_title, 'Original Post')
        self.assertEqual(revision.revision_number, 1)

```

```python