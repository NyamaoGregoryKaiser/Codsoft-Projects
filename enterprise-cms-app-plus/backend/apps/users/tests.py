```python
import json
from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

class UserAuthTests(APITestCase):
    """
    Tests for user registration, login, and profile management.
    """
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.login_url = reverse('token_obtain_pair')
        self.refresh_url = reverse('token_refresh')
        self.profile_url = reverse('user_profile')

        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123',
            'password2': 'testpassword123',
        }
        self.admin_user_data = {
            'username': 'adminuser',
            'email': 'admin@example.com',
            'password': 'adminpassword123',
            'password2': 'adminpassword123',
        }
        self.admin_user = User.objects.create_superuser(
            self.admin_user_data['username'],
            self.admin_user_data['email'],
            self.admin_user_data['password']
        )
        self.user = None # Will be created during registration tests

    def test_user_registration(self):
        """
        Ensure we can register a new user account.
        """
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'User registered successfully.')

    def test_user_registration_password_mismatch(self):
        """
        Ensure registration fails if passwords don't match.
        """
        data = self.user_data.copy()
        data['password2'] = 'wrongpassword'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
        self.assertIn('didn\'t match', response.data['password'][0])

    def test_user_login(self):
        """
        Ensure an existing user can log in and get tokens.
        """
        self.client.post(self.register_url, self.user_data, format='json') # Register first
        login_credentials = {
            'username': self.user_data['username'],
            'password': self.user_data['password'],
        }
        response = self.client.post(self.login_url, login_credentials, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], self.user_data['username'])
        self.user = User.objects.get(username=self.user_data['username']) # Store for later tests
        self.assertTrue(self.user.last_login is not None)

    def test_user_login_invalid_credentials(self):
        """
        Ensure login fails with invalid credentials.
        """
        self.client.post(self.register_url, self.user_data, format='json')
        login_credentials = {
            'username': self.user_data['username'],
            'password': 'wrongpassword',
        }
        response = self.client.post(self.login_url, login_credentials, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
        self.assertEqual(response.data['detail'], 'No active account found with the given credentials')

    def test_user_profile_access(self):
        """
        Ensure an authenticated user can access their profile.
        """
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {'username': self.user_data['username'], 'password': self.user_data['password']}, format='json')
        access_token = login_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.profile_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user_data['username'])

    def test_user_profile_update(self):
        """
        Ensure an authenticated user can update their profile.
        """
        self.client.post(self.register_url, self.user_data, format='json')
        login_response = self.client.post(self.login_url, {'username': self.user_data['username'], 'password': self.user_data['password']}, format='json')
        access_token = login_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        update_data = {'first_name': 'New', 'last_name': 'Name'}
        response = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'New')
        self.user = User.objects.get(username=self.user_data['username'])
        self.assertEqual(self.user.first_name, 'New')

    def test_unauthenticated_profile_access_fails(self):
        """
        Ensure unauthenticated users cannot access profile.
        """
        response = self.client.get(self.profile_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```