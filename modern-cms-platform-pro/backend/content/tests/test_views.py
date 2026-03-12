from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from content.models import Post, Category, MediaItem, Page, Tag
from django.core.files.uploadedfile import SimpleUploadedFile
import os
from django.conf import settings

User = get_user_model()

class ContentViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(email='admin@example.com', password='adminpassword')
        self.staff_user = User.objects.create_user(email='staff@example.com', password='staffpassword', is_staff=True)
        self.regular_user = User.objects.create_user(email='user@example.com', password='userpassword')

        self.category = Category.objects.create(name='Test Category')
        self.tag = Tag.objects.create(name='Test Tag')

        # Create a dummy image file for MediaItem
        img_path = os.path.join(settings.BASE_DIR, 'tmp', 'view_test_image.png')
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        from PIL import Image
        image = Image.new('RGB', (100, 100), color = 'blue')
        image.save(img_path)
        with open(img_path, 'rb') as f:
            self.image_file = SimpleUploadedFile(name='view_test_image.png', content=f.read(), content_type='image/png')
            self.media_item = MediaItem.objects.create(title='Test Image', file=self.image_file, uploaded_by=self.admin_user)
        os.remove(img_path) # Clean up

        self.post_published = Post.objects.create(title='Published Post', content='...', author=self.staff_user, status='published', featured_image=self.media_item)
        self.post_draft = Post.objects.create(title='Draft Post', content='...', author=self.staff_user, status='draft', featured_image=self.media_item)
        self.page_published = Page.objects.create(title='Published Page', content='...', author=self.admin_user, status='published')

        self.post_published.categories.add(self.category)
        self.post_published.tags.add(self.tag)

        self.post_list_url = reverse('post-list')
        self.post_detail_url = reverse('post-detail', kwargs={'slug': self.post_published.slug})
        self.post_draft_detail_url = reverse('post-detail', kwargs={'slug': self.post_draft.slug})
        self.category_list_url = reverse('category-list')
        self.tag_list_url = reverse('tag-list')
        self.media_list_url = reverse('mediaitem-list')
        self.page_list_url = reverse('page-list')

    def test_list_published_posts_public(self):
        # Unauthenticated user should only see published posts
        response = self.client.get(self.post_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Published Post')

    def test_list_all_posts_staff(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.post_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) # Both published and draft

    def test_retrieve_published_post_public(self):
        response = self.client.get(self.post_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Published Post')

    def test_retrieve_draft_post_public_fail(self):
        response = self.client.get(self.post_draft_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_draft_post_staff(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.post_draft_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Draft Post')

    def test_create_post_authenticated_user_fail(self):
        self.client.force_authenticate(user=self.regular_user)
        data = {'title': 'New Post', 'content': '...', 'author': self.regular_user.id, 'status': 'draft'}
        response = self.client.post(self.post_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # Only staff can create

    def test_create_post_staff_success(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            'title': 'New Staff Post',
            'content': 'This is new content.',
            'status': 'draft',
            'category_ids': [self.category.id],
            'tag_ids': [self.tag.id],
            'featured_image_id': self.media_item.id
        }
        response = self.client.post(self.post_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 3)
        self.assertEqual(Post.objects.get(title='New Staff Post').author, self.staff_user)

    def test_update_post_by_author(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {'title': 'Updated Published Post', 'content': 'updated content', 'status': 'published'}
        response = self.client.put(self.post_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post_published.refresh_from_db()
        self.assertEqual(self.post_published.title, 'Updated Published Post')

    def test_update_post_by_non_author_fail(self):
        self.client.force_authenticate(user=self.regular_user)
        data = {'title': 'Attempt to update', 'content': 'updated content'}
        response = self.client.put(self.post_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_post_staff_success(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.delete(self.post_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.post_published.refresh_from_db()
        self.assertEqual(self.post_published.status, 'archived') # Soft delete

    def test_publish_post_by_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        publish_url = reverse('post-publish', kwargs={'slug': self.post_draft.slug})
        response = self.client.post(publish_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.post_draft.refresh_from_db()
        self.assertEqual(self.post_draft.status, 'published')

    def test_category_crud_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        new_category_data = {'name': 'New Category', 'description': 'Some description'}
        response = self.client.post(self.category_list_url, new_category_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 2)

        category_detail_url = reverse('category-detail', kwargs={'slug': 'test-category'})
        response = self.client.delete(category_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Category.objects.count(), 1)
```

#### Frontend Tests (`frontend/src/tests/`)

```javascript