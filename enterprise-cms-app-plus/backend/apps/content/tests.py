```python
from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.content.models import Category, Tag, Post, Page
from apps.media.models import MediaItem
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
import io

User = get_user_model()

class ContentAPITests(APITestCase):
    """
    Tests for Category, Tag, Post, and Page API endpoints.
    Focuses on CRUD operations and permissions.
    """
    def setUp(self):
        self.admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
        self.editor_user = User.objects.create_user('editor', 'editor@example.com', 'editorpassword')
        self.regular_user = User.objects.create_user('user', 'user@example.com', 'userpassword')

        # Admin client for setting up objects
        admin_login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'admin', 'password': 'adminpassword'}, format='json')
        self.admin_token = admin_login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # Create initial categories
        self.category1 = Category.objects.create(name='Technology', slug='technology', description='Tech news')
        self.category2 = Category.objects.create(name='Programming', slug='programming', description='Coding guides')
        
        # Create initial tags
        self.tag1 = Tag.objects.create(name='Python', slug='python')
        self.tag2 = Tag.objects.create(name='Django', slug='django')

        # Create a media item for the admin user
        self.image_file = SimpleUploadedFile(name='test_image.jpg', content=b'file_content', content_type='image/jpeg')
        self.media_item = MediaItem.objects.create(title='Test Image', file=self.image_file, owner=self.admin_user)

        # Create initial posts
        self.post1 = Post.objects.create(
            title='Admin Post 1', slug='admin-post-1', author=self.admin_user,
            content='Content for admin post 1', status='published', featured_image=self.media_item,
            published_at=timezone.now()
        )
        self.post1.categories.set([self.category1])
        self.post1.tags.set([self.tag1])

        self.post2 = Post.objects.create(
            title='Editor Post 1', slug='editor-post-1', author=self.editor_user,
            content='Content for editor post 1', status='draft' # Draft post
        )
        self.post2.categories.set([self.category2])
        self.post2.tags.set([self.tag2])

        # Create initial pages
        self.page1 = Page.objects.create(
            title='About Us', slug='about-us', author=self.admin_user,
            content='Our company history', is_published=True
        )
        self.page2 = Page.objects.create(
            title='Contact Us (Draft)', slug='contact-us-draft', author=self.editor_user,
            content='How to reach us', is_published=False
        )

        # Clear credentials for subsequent tests to start fresh
        self.client.credentials()


    # --- Category Tests ---
    def test_list_categories_unauthenticated(self):
        """Anyone can list categories."""
        response = self.client.get(reverse('category-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) # Assuming pagination

    def test_create_category_admin(self):
        """Only admin can create categories."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        data = {'name': 'New Category', 'slug': 'new-category', 'description': 'Description'}
        response = self.client.post(reverse('category-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Category.objects.filter(slug='new-category').exists())

    def test_create_category_regular_user_fails(self):
        """Regular user cannot create categories."""
        login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'user', 'password': 'userpassword'}, format='json')
        user_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_token}')
        data = {'name': 'Unauthorized Cat', 'slug': 'unauthorized-cat'}
        response = self.client.post(reverse('category-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --- Tag Tests ---
    def test_list_tags_unauthenticated(self):
        """Anyone can list tags."""
        response = self.client.get(reverse('tag-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_update_tag_admin(self):
        """Admin can update tags."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        data = {'name': 'Python Updated'}
        response = self.client.patch(reverse('tag-detail', args=[self.tag1.slug]), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tag1.refresh_from_db()
        self.assertEqual(self.tag1.name, 'Python Updated')

    # --- Post Tests ---
    def test_list_posts_unauthenticated(self):
        """Unauthenticated users only see published posts."""
        response = self.client.get(reverse('post-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1) # Only post1 is published
        self.assertEqual(response.data['results'][0]['slug'], 'admin-post-1')

    def test_list_posts_authenticated_user(self):
        """Authenticated non-staff user sees published posts and their own drafts."""
        login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'editor', 'password': 'editorpassword'}, format='json')
        editor_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {editor_token}')
        response = self.client.get(reverse('post-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2) # post1 (published) + post2 (editor's draft)
        slugs = [p['slug'] for p in response.data['results']]
        self.assertIn('admin-post-1', slugs)
        self.assertIn('editor-post-1', slugs)

    def test_create_post_authenticated_user(self):
        """Authenticated users can create posts."""
        login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'user', 'password': 'userpassword'}, format='json')
        user_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_token}')
        data = {
            'title': 'User New Post',
            'content': 'Content of user post',
            'status': 'draft',
            'category_ids': [self.category1.id],
            'tag_ids': [self.tag1.id, self.tag2.id],
        }
        response = self.client.post(reverse('post-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Post.objects.filter(slug='user-new-post').exists())
        post = Post.objects.get(slug='user-new-post')
        self.assertEqual(post.author, self.regular_user)
        self.assertEqual(post.categories.count(), 1)
        self.assertEqual(post.tags.count(), 2)

    def test_update_post_author_succeeds(self):
        """Author can update their own post."""
        login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'editor', 'password': 'editorpassword'}, format='json')
        editor_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {editor_token}')
        data = {'title': 'Editor Post 1 Updated', 'status': 'published'}
        response = self.client.patch(reverse('post-detail', args=[self.post2.slug]), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post2.refresh_from_db()
        self.assertEqual(self.post2.title, 'Editor Post 1 Updated')
        self.assertEqual(self.post2.status, 'published')

    def test_update_post_other_user_fails(self):
        """Regular user cannot update another user's post."""
        login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'user', 'password': 'userpassword'}, format='json')
        user_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_token}')
        data = {'title': 'Attempted Update'}
        response = self.client.patch(reverse('post-detail', args=[self.post1.slug]), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_publish_post_admin_succeeds(self):
        """Admin can publish any post."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        self.post2.status = 'draft' # Ensure it's a draft
        self.post2.save()
        response = self.client.post(reverse('post-publish', args=[self.post2.slug]), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post2.refresh_from_db()
        self.assertEqual(self.post2.status, 'published')
        self.assertTrue(self.post2.published_at is not None)

    def test_publish_post_non_admin_fails(self):
        """Non-admin user cannot publish a post."""
        login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'editor', 'password': 'editorpassword'}, format='json')
        editor_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {editor_token}')
        response = self.client.post(reverse('post-publish', args=[self.post2.slug]), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --- Page Tests ---
    def test_list_pages_unauthenticated(self):
        """Unauthenticated users only see published pages."""
        response = self.client.get(reverse('page-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1) # Only page1 is published
        self.assertEqual(response.data['results'][0]['slug'], 'about-us')

    def test_retrieve_page_draft_authenticated_author(self):
        """Authenticated author can retrieve their own draft page."""
        login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'editor', 'password': 'editorpassword'}, format='json')
        editor_token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {editor_token}')
        response = self.client.get(reverse('page-detail', args=[self.page2.slug]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'contact-us-draft')

    def test_retrieve_page_draft_unauthenticated_fails(self):
        """Unauthenticated user cannot retrieve a draft page."""
        response = self.client.get(reverse('page-detail', args=[self.page2.slug]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # DRF returns 404 for objects not in queryset
```