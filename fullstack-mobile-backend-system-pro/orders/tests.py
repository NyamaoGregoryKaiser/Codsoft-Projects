from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from products.models import Product, Category
from orders.models import Order, OrderItem
import json

User = get_user_model()

class OrderTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
        self.regular_user1 = User.objects.create_user(
            'user1', 'user1@example.com', 'userpassword1', address='123 User1 St.'
        )
        self.regular_user2 = User.objects.create_user(
            'user2', 'user2@example.com', 'userpassword2', address='456 User2 Ave.'
        )

        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product1 = Product.objects.create(
            name='Laptop', description='Powerful laptop', category=self.category, price=1200.00, stock=10, is_active=True
        )
        self.product2 = Product.objects.create(
            name='Smartphone', description='Latest model phone', category=self.category, price=800.00, stock=5, is_active=True
        )
        self.product3_out_of_stock = Product.objects.create(
            name='Headphones', description='Wireless headphones', category=self.category, price=150.00, stock=0, is_active=True
        )

        # Create an existing order for testing retrieval/update
        self.existing_order = Order.objects.create(
            user=self.regular_user1, shipping_address='Existing Address', status='pending', total_amount=1200.00
        )
        OrderItem.objects.create(
            order=self.existing_order, product=self.product1, quantity=1, price_at_order=self.product1.price
        )
        self.existing_order.calculate_total_amount() # Ensures total_amount is correct

        self.order_url = reverse('order-list')

    def _get_auth_token(self, user):
        response = self.client.post(reverse('token_obtain_pair'), {'email': user.email, 'password': user.password}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data['access']

    # Order Creation Tests
    def test_create_order_successfully(self):
        self.client.force_authenticate(user=self.regular_user2)
        initial_stock_p1 = self.product1.stock
        initial_stock_p2 = self.product2.stock

        data = {
            'shipping_address': self.regular_user2.address,
            'payment_method': 'Credit Card',
            'items': [
                {'product': self.product1.id, 'quantity': 2},
                {'product': self.product2.id, 'quantity': 1},
            ]
        }
        response = self.client.post(self.order_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.filter(user=self.regular_user2).count(), 1)

        new_order = Order.objects.get(id=response.data['order_id'])
        self.assertEqual(new_order.user, self.regular_user2)
        self.assertEqual(new_order.items.count(), 2)
        self.assertEqual(new_order.total_amount, (self.product1.price * 2) + (self.product2.price * 1))

        self.product1.refresh_from_db()
        self.product2.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock_p1 - 2)
        self.assertEqual(self.product2.stock, initial_stock_p2 - 1)

    def test_create_order_not_enough_stock(self):
        self.client.force_authenticate(user=self.regular_user1)
        data = {
            'shipping_address': self.regular_user1.address,
            'payment_method': 'Credit Card',
            'items': [
                {'product': self.product2.id, 'quantity': 10}, # Product2 has only 5 stock
            ]
        }
        response = self.client.post(self.order_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('quantity', response.data['items'][0])
        self.assertIn('available in stock', response.data['items'][0]['quantity'][0])
        self.assertEqual(Order.objects.filter(user=self.regular_user1).count(), 1) # No new order created

    def test_create_order_out_of_stock_product(self):
        self.client.force_authenticate(user=self.regular_user1)
        data = {
            'shipping_address': self.regular_user1.address,
            'payment_method': 'Credit Card',
            'items': [
                {'product': self.product3_out_of_stock.id, 'quantity': 1},
            ]
        }
        response = self.client.post(self.order_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('quantity', response.data['items'][0])
        self.assertIn('available in stock', response.data['items'][0]['quantity'][0])

    def test_create_order_without_shipping_address(self):
        self.client.force_authenticate(user=self.regular_user1)
        # User1 has a default address, so it should use it.
        data = {
            'payment_method': 'Credit Card',
            'items': [
                {'product': self.product1.id, 'quantity': 1},
            ]
        }
        response = self.client.post(self.order_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_order = Order.objects.get(id=response.data['order_id'])
        self.assertEqual(new_order.shipping_address, self.regular_user1.address)

        # Test for a user without a default address and no provided address
        user_no_address = User.objects.create_user('noaddress', 'noaddress@example.com', 'password')
        self.client.force_authenticate(user=user_no_address)
        data_no_address = {
            'payment_method': 'Credit Card',
            'items': [
                {'product': self.product1.id, 'quantity': 1},
            ]
        }
        response_no_address = self.client.post(self.order_url, data_no_address, format='json')
        self.assertEqual(response_no_address.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('shipping_address', response_no_address.data)

    # Order Retrieval Tests
    def test_list_orders_regular_user_sees_own_orders_only(self):
        self.client.force_authenticate(user=self.regular_user1)
        response = self.client.get(self.order_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1) # Only existing_order
        self.assertEqual(response.data['results'][0]['order_id'], self.existing_order.id)

    def test_list_orders_admin_user_sees_all_orders(self):
        self.client.force_authenticate(user=self.admin_user)
        # Create another order for user2 to ensure admin sees more
        Order.objects.create(
            user=self.regular_user2, shipping_address=self.regular_user2.address, status='shipped', total_amount=100.00
        )
        response = self.client.get(self.order_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) # existing_order + the new one
        self.assertIn(self.existing_order.id, [o['order_id'] for o in response.data['results']])

    def test_retrieve_order_detail_regular_user_owner(self):
        self.client.force_authenticate(user=self.regular_user1)
        url = reverse('order-detail', args=[self.existing_order.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order_id'], self.existing_order.id)
        self.assertEqual(len(response.data['items']), 1)

    def test_retrieve_order_detail_regular_user_not_owner_forbidden(self):
        self.client.force_authenticate(user=self.regular_user2)
        url = reverse('order-detail', args=[self.existing_order.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Not Found, because queryset filters by owner

    # Order Update/Delete Tests
    def test_update_order_status_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('order-update-status', args=[self.existing_order.id])
        data = {'status': 'shipped'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.existing_order.refresh_from_db()
        self.assertEqual(self.existing_order.status, 'shipped')

    def test_update_order_status_regular_user_forbidden(self):
        self.client.force_authenticate(user=self.regular_user1)
        url = reverse('order-update-status', args=[self.existing_order.id])
        data = {'status': 'shipped'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cancel_order_returns_stock(self):
        self.client.force_authenticate(user=self.admin_user)
        initial_stock = self.product1.stock
        order_to_cancel = Order.objects.create(
            user=self.regular_user2, shipping_address=self.regular_user2.address, status='processing'
        )
        OrderItem.objects.create(order=order_to_cancel, product=self.product1, quantity=3, price_at_order=self.product1.price)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock - 3) # Stock reduced after creation

        url = reverse('order-update-status', args=[order_to_cancel.id])
        response = self.client.patch(url, {'status': 'cancelled'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order_to_cancel.refresh_from_db()
        self.assertEqual(order_to_cancel.status, 'cancelled')

        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock) # Stock returned

    def test_delete_pending_order_admin_returns_stock(self):
        self.client.force_authenticate(user=self.admin_user)
        initial_stock = self.product1.stock
        order_to_delete = Order.objects.create(
            user=self.regular_user2, shipping_address=self.regular_user2.address, status='pending'
        )
        OrderItem.objects.create(order=order_to_delete, product=self.product1, quantity=2, price_at_order=self.product1.price)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock - 2)

        url = reverse('order-detail', args=[order_to_delete.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Order.objects.filter(id=order_to_delete.id).count(), 0)

        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock, initial_stock) # Stock returned
--- END FILE ---

---