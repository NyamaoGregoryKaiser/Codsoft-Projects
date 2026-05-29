from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class UserAuthTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'strongpassword123',
            'password2': 'strongpassword123',
            'phone_number': '1234567890'
        }
        self.admin_user_data = {
            'username': 'adminuser',
            'email': 'admin@example.com',
            'password': 'adminpassword123',
            'password2': 'adminpassword123',
        }
        self.admin_user = User.objects.create_superuser(**self.admin_user_data)
        self.user = User.objects.create_user(**self.user_data)

    def test_user_registration(self):
        url = reverse('user-register')
        new_user_data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpassword123',
            'password2': 'newpassword123',
            'phone_number': '9876543210'
        }
        response = self.client.post(url, new_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.data)
        self.assertEqual(User.objects.count(), 3) # Initial admin + test_user + new_user

    def test_user_registration_password_mismatch(self):
        url = reverse('user-register')
        new_user_data = {
            'username': 'newuser2',
            'email': 'new2@example.com',
            'password': 'password1',
            'password2': 'password2',
        }
        response = self.client.post(url, new_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_user_registration_duplicate_email(self):
        url = reverse('user-register')
        duplicate_email_data = {
            'username': 'anotheruser',
            'email': 'test@example.com',
            'password': 'password123',
            'password2': 'password123',
        }
        response = self.client.post(url, duplicate_email_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login(self):
        url = reverse('token_obtain_pair') # JWT login endpoint
        response = self.client.post(url, {'email': 'test@example.com', 'password': 'strongpassword123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('access' in response.data)
        self.assertTrue('refresh' in response.data)

    def test_user_login_invalid_credentials(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'email': 'test@example.com', 'password': 'wrongpassword'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)

    def test_user_profile_retrieve(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('user-profile')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

    def test_user_profile_update(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('user-profile')
        updated_data = {'first_name': 'Updated', 'phone_number': '0987654321'}
        response = self.client.patch(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.phone_number, '0987654321')

    def test_user_profile_update_unauthenticated(self):
        url = reverse('user-profile')
        updated_data = {'first_name': 'Unauthorized'}
        response = self.client.patch(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_user_list(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('user-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) # Admin user and test user

    def test_regular_user_cannot_list_users(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('user-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_user_delete(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('user-detail', args=[self.user.id])
        response = self.client.delete(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(User.objects.count(), 1) # Only admin user remains
--- END FILE ---

---