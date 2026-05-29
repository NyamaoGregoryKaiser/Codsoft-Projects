from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from products.models import Category, Product
from io import BytesIO
from PIL import Image

User = get_user_model()

class ProductTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
        self.regular_user = User.objects.create_user('user', 'user@example.com', 'userpassword')

        self.category1 = Category.objects.create(name='Electronics', slug='electronics', description='Electronic gadgets')
        self.category2 = Category.objects.create(name='Books', slug='books', description='Printed media')

        self.product1 = Product.objects.create(
            name='Laptop', description='Powerful laptop', category=self.category1, price=1200.00, stock=10, is_active=True
        )
        self.product2 = Product.objects.create(
            name='Smartphone', description='Latest model phone', category=self.category1, price=800.00, stock=5, is_active=True
        )
        self.product3 = Product.objects.create(
            name='Old Book', description='Rare collector\'s item', category=self.category2, price=50.00, stock=0, is_active=False
        )

    def _generate_test_image(self):
        file = BytesIO()
        image = Image.new('RGB', size=(100, 100), color=(155, 0, 0))
        image.save(file, 'jpeg')
        file.name = 'test.jpg'
        file.seek(0)
        return file

    # Category Tests
    def test_list_categories(self):
        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_create_category_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('category-list')
        data = {'name': 'New Category', 'slug': 'new-category', 'description': 'A brand new category'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 3)

    def test_create_category_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('category-list')
        data = {'name': 'Forbidden Category', 'slug': 'forbidden-category'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_category_by_slug(self):
        url = reverse('category-detail', kwargs={'slug': self.category1.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.category1.name)

    # Product Tests
    def test_list_active_products_regular_user(self):
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('product-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only active and in-stock products for regular users
        self.assertEqual(len(response.data['results']), 2)
        self.assertIn(self.product1.name, [p['name'] for p in response.data['results']])
        self.assertIn(self.product2.name, [p['name'] for p in response.data['results']])
        self.assertNotIn(self.product3.name, [p['name'] for p in response.data['results']])

    def test_list_all_products_admin_user(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('product-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin can see all products, even inactive/out of stock
        self.assertEqual(len(response.data['results']), 3)
        self.assertIn(self.product3.name, [p['name'] for p in response.data['results']])

    def test_create_product_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('product-list')
        data = {
            'name': 'New Tablet',
            'description': 'A sleek new tablet.',
            'category': self.category1.id,
            'price': 400.00,
            'stock': 20,
            'is_active': True,
            'image': self._generate_test_image()
        }
        response = self.client.post(url, data, format='multipart') # Use multipart for file upload
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 4)
        self.assertIsNotNone(Product.objects.get(name='New Tablet').image)

    def test_create_product_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('product-list')
        data = {
            'name': 'Forbidden Product',
            'description': 'Should not be created.',
            'category': self.category1.id,
            'price': 100.00,
            'stock': 10,
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_product_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('product-detail', args=[self.product1.id])
        data = {'price': 1250.00, 'stock': 8}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.price, 1250.00)
        self.assertEqual(self.product1.stock, 8)

    def test_delete_product_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('product-detail', args=[self.product1.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 2)

    def test_add_stock_action_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('product-add-stock', args=[self.product1.id])
        initial_stock = self.product1.stock
        response = self.client.post(url, {'quantity': 5}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock + 5)

    def test_add_stock_action_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('product-add-stock', args=[self.product1.id])
        response = self.client.post(url, {'quantity': 5}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_low_stock_action_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('product-low-stock')
        # Product2 has stock=5, which is < default threshold of 10
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.product2.name)

        # Test with custom threshold
        response = self.client.get(url + '?threshold=15', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) # Laptop (10) and Smartphone (5)
        self.assertIn(self.product1.name, [p['name'] for p in response.data])
        self.assertIn(self.product2.name, [p['name'] for p in response.data])

    def test_low_stock_action_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('product-low-stock')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
--- END FILE ---

---