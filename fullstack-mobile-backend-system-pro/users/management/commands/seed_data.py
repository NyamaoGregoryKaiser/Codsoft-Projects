import logging
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from products.models import Category, Product
from orders.models import Order, OrderItem
from django.db import transaction

logger = logging.getLogger('app_logger')
User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial data for development and testing.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding database...'))
        try:
            with transaction.atomic():
                self._seed_users()
                self._seed_categories_products()
                self._seed_orders()
            self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
        except Exception as e:
            logger.error(f"Error during database seeding: {e}", exc_info=True)
            self.stdout.write(self.style.ERROR(f'Database seeding failed: {e}'))

    def _seed_users(self):
        if not User.objects.filter(email='admin@example.com').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword', first_name='Super', last_name='Admin')
            self.stdout.write(self.style.SUCCESS('Created superuser: admin@example.com'))
        if not User.objects.filter(email='user1@example.com').exists():
            User.objects.create_user('user1', 'user1@example.com', 'userpassword1', first_name='John', last_name='Doe', phone_number='1112223333', address='123 Main St')
            self.stdout.write(self.style.SUCCESS('Created regular user: user1@example.com'))
        if not User.objects.filter(email='user2@example.com').exists():
            User.objects.create_user('user2', 'user2@example.com', 'userpassword2', first_name='Jane', last_name='Smith', phone_number='4445556666', address='456 Oak Ave')
            self.stdout.write(self.style.SUCCESS('Created regular user: user2@example.com'))

    def _seed_categories_products(self):
        # Categories
        electronics, _ = Category.objects.get_or_create(name='Electronics', slug='electronics', description='Gadgets and electronic devices.')
        clothing, _ = Category.objects.get_or_create(name='Clothing', slug='clothing', description='Apparel and fashion items.')
        books, _ = Category.objects.get_or_create(name='Books', slug='books', description='Printed and digital books.')
        self.stdout.write(self.style.SUCCESS('Seeded categories.'))

        # Products
        Product.objects.get_or_create(name='Laptop Pro X', description='High-performance laptop for professionals.', category=electronics, price=1200.00, stock=50, is_active=True)
        Product.objects.get_or_create(name='Smartphone Ultra', description='Latest model smartphone with advanced features.', category=electronics, price=800.00, stock=120, is_active=True)
        Product.objects.get_or_create(name='Wireless Headphones', description='Noise-cancelling over-ear headphones.', category=electronics, price=150.00, stock=200, is_active=True)
        Product.objects.get_or_create(name='Denim Jeans', description='Classic fit denim jeans for everyday wear.', category=clothing, price=60.00, stock=300, is_active=True)
        Product.objects.get_or_create(name='Cotton T-Shirt', description='Comfortable 100% cotton t-shirt.', category=clothing, price=20.00, stock=500, is_active=True)
        Product.objects.get_or_create(name='The Great Novel', description='A thrilling mystery novel.', category=books, price=25.00, stock=80, is_active=True)
        Product.objects.get_or_create(name='Programming Python', description='Comprehensive guide to Python programming.', category=books, price=50.00, stock=30, is_active=True)
        Product.objects.get_or_create(name='Discontinued Item', description='This product is no longer available.', category=electronics, price=10.00, stock=0, is_active=False)
        self.stdout.write(self.style.SUCCESS('Seeded products.'))

    def _seed_orders(self):
        user1 = User.objects.get(email='user1@example.com')
        user2 = User.objects.get(email='user2@example.com')
        laptop = Product.objects.get(name='Laptop Pro X')
        headphones = Product.objects.get(name='Wireless Headphones')
        jeans = Product.objects.get(name='Denim Jeans')

        if not Order.objects.filter(user=user1, shipping_address='123 Main St').exists():
            order1 = Order.objects.create(user=user1, shipping_address=user1.address, status='delivered', payment_method='Credit Card')
            OrderItem.objects.create(order=order1, product=laptop, quantity=1, price_at_order=laptop.price)
            OrderItem.objects.create(order=order1, product=headphones, quantity=2, price_at_order=headphones.price)
            order1.calculate_total_amount()
            self.stdout.write(self.style.SUCCESS(f'Created order {order1.id} for {user1.email}'))

        if not Order.objects.filter(user=user2, shipping_address='456 Oak Ave').exists():
            order2 = Order.objects.create(user=user2, shipping_address=user2.address, status='processing', payment_method='PayPal')
            OrderItem.objects.create(order=order2, product=jeans, quantity=1, price_at_order=jeans.price)
            order2.calculate_total_amount()
            self.stdout.write(self.style.SUCCESS(f'Created order {order2.id} for {user2.email}'))
--- END FILE ---

**Query Optimization**:
- `select_related()` and `prefetch_related()` are used in `ViewSet`'s `get_queryset()` to minimize database queries (e.g., in `ProductViewSet`, `OrderViewSet`, `OrderItemViewSet`).
- Database indexes are defined in models (`Meta.indexes`) to speed up common lookups.

### **3. Configuration & Setup**

---