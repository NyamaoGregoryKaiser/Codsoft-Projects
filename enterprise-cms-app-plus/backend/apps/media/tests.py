```python
from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.media.models import MediaItem
from django.core.files.uploadedfile import SimpleUploadedFile
import io

User = get_user_model()

class MediaAPITests(APITestCase):
    """
    Tests for MediaItem API endpoints.
    Focuses on file uploads and owner permissions.
    """
    def setUp(self):
        self.admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
        self.regular_user = User.objects.create_user('user', 'user@example.com', 'userpassword')
        self.other_user = User.objects.create_user('other', 'other@example.com', 'otherpassword')

        # Get tokens
        admin_login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'admin', 'password': 'adminpassword'}, format='json')
        self.admin_token = admin_login_response.data['access']

        user_login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'user', 'password': 'userpassword'}, format='json')
        self.user_token = user_login_response.data['access']

        other_login_response = self.client.post(reverse('token_obtain_pair'), {'username': 'other', 'password': 'otherpassword'}, format='json')
        self.other_token = other_login_response.data['access']

        # Create a media item for the regular user
        image_content = b"fake image content" # Simulate a small image file
        self.test_image_file = SimpleUploadedFile(name='test_image.jpg', content=image_content, content_type='image/jpeg')
        self.user_media_item = MediaItem.objects.create(
            title='User Image', file=self.test_image_file, owner=self.regular_user
        )

        # Create a media item for the admin user
        admin_image_content = b"admin image content"
        self.admin_media_item = MediaItem.objects.create(
            title='Admin Image', file=SimpleUploadedFile(name='admin_image.png', content=admin_image_content, content_type='image/png'), owner=self.admin_user
        )

        self.media_list_url = reverse('mediaitem-list')
        self.user_media_detail_url = reverse('mediaitem-detail', args=[self.user_media_item.id])
        self.admin_media_detail_url = reverse('mediaitem-detail', args=[self.admin_media_item.id])

    def test_upload_media_authenticated_user(self):
        """Ensure an authenticated user can upload a media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        upload_file = SimpleUploadedFile(name='new_upload.pdf', content=b'pdf content', content_type='application/pdf')
        data = {'title': 'New PDF Doc', 'file': upload_file}
        response = self.client.post(self.media_list_url, data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MediaItem.objects.filter(title='New PDF Doc', owner=self.regular_user).exists())
        self.assertEqual(response.data['owner']['username'], self.regular_user.username)
        self.assertEqual(response.data['file_type'], 'application/pdf')

    def test_upload_media_unauthenticated_fails(self):
        """Ensure unauthenticated users cannot upload media."""
        upload_file = SimpleUploadedFile(name='unauth.txt', content=b'text content', content_type='text/plain')
        data = {'title': 'Unauthorized file', 'file': upload_file}
        response = self.client.post(self.media_list_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(MediaItem.objects.filter(title='Unauthorized file').exists())

    def test_list_media_regular_user_only_sees_own(self):
        """A regular user should only see their own uploaded media."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        response = self.client.get(self.media_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.user_media_item.id)

    def test_list_media_admin_user_sees_all(self):
        """An admin user should see all uploaded media items."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.get(self.media_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2) # Both user_media_item and admin_media_item
        ids = {item['id'] for item in response.data['results']}
        self.assertIn(self.user_media_item.id, ids)
        self.assertIn(self.admin_media_item.id, ids)

    def test_retrieve_media_item_owner_succeeds(self):
        """Owner can retrieve their media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        response = self.client.get(self.user_media_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.user_media_item.id)

    def test_retrieve_media_item_admin_succeeds(self):
        """Admin can retrieve any media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.get(self.user_media_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.user_media_item.id)

    def test_retrieve_media_item_other_user_fails(self):
        """Other authenticated users cannot retrieve another's media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.other_token}')
        response = self.client.get(self.user_media_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # DRF returns 404 if not in queryset

    def test_update_media_item_owner_succeeds(self):
        """Owner can update their media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        data = {'title': 'Updated User Image', 'alt_text': 'A new alt text'}
        response = self.client.patch(self.user_media_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user_media_item.refresh_from_db()
        self.assertEqual(self.user_media_item.title, 'Updated User Image')
        self.assertEqual(self.user_media_item.alt_text, 'A new alt text')

    def test_update_media_item_other_user_fails(self):
        """Other authenticated users cannot update another's media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.other_token}')
        data = {'title': 'Attempted update'}
        response = self.client.patch(self.user_media_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_media_item_owner_succeeds(self):
        """Owner can delete their media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        response = self.client.delete(self.user_media_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MediaItem.objects.filter(id=self.user_media_item.id).exists())

    def test_delete_media_item_admin_succeeds(self):
        """Admin can delete any media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.delete(self.user_media_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MediaItem.objects.filter(id=self.user_media_item.id).exists())

    def test_delete_media_item_other_user_fails(self):
        """Other authenticated users cannot delete another's media item."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.other_token}')
        response = self.client.delete(self.user_media_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(MediaItem.objects.filter(id=self.user_media_item.id).exists())
```