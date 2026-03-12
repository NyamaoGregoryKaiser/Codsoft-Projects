from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from content.models import Post, Page, Category, Tag, MediaItem
import random
from faker import Faker
import os
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings

User = get_user_model()
fake = Faker()

class Command(BaseCommand):
    help = 'Seeds the database with initial data for development.'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding.')
        parser.add_argument('--posts', type=int, default=10, help='Number of posts to create.')
        parser.add_argument('--pages', type=int, default=5, help='Number of pages to create.')
        parser.add_argument('--categories', type=int, default=5, help='Number of categories to create.')
        parser.add_argument('--tags', type=int, default=10, help='Number of tags to create.')
        parser.add_argument('--media', type=int, default=5, help='Number of media items to create.')

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting database seeding...'))

        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            Post.objects.all().delete()
            Page.objects.all().delete()
            Category.objects.all().delete()
            Tag.objects.all().delete()
            MediaItem.objects.all().delete()
            # Note: Do not delete users casually in production-like environments

        # Create a default admin user if not exists
        admin_email = 'admin@example.com'
        if not User.objects.filter(email=admin_email).exists():
            admin_user = User.objects.create_superuser(
                email=admin_email,
                password='adminpassword',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_email}'))
        else:
            admin_user = User.objects.get(email=admin_email)
            self.stdout.write(self.style.SUCCESS(f'Admin user already exists: {admin_email}'))

        # Create some regular users (authors/editors)
        users = [admin_user]
        for i in range(3):
            email = f'user{i+1}@example.com'
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_user(
                    email=email,
                    password='userpassword',
                    first_name=fake.first_name(),
                    last_name=fake.last_name()
                )
                users.append(user)
                self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))
            else:
                users.append(User.objects.get(email=email))
                self.stdout.write(self.style.SUCCESS(f'User already exists: {email}'))

        # Create Categories
        categories = []
        for _ in range(options['categories']):
            name = fake.unique.word().capitalize()
            category, created = Category.objects.get_or_create(name=name, defaults={'description': fake.sentence()})
            categories.append(category)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {name}'))

        # Create Tags
        tags = []
        for _ in range(options['tags']):
            name = fake.unique.word().lower()
            tag, created = Tag.objects.get_or_create(name=name)
            tags.append(tag)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created tag: {name}'))

        # Create Media Items (placeholder images)
        media_items = []
        for i in range(options['media']):
            try:
                # Create a dummy image file
                img_path = os.path.join(settings.BASE_DIR, 'tmp', f'dummy_image_{i}.png')
                os.makedirs(os.path.dirname(img_path), exist_ok=True)
                
                from PIL import Image
                image = Image.new('RGB', (600, 400), color = (random.randint(0,255), random.randint(0,255), random.randint(0,255)))
                image.save(img_path)

                with open(img_path, 'rb') as f:
                    media_file = SimpleUploadedFile(name=f'dummy_image_{i}.png', content=f.read(), content_type='image/png')
                    media_item = MediaItem.objects.create(
                        title=f'Dummy Image {i+1}',
                        file=media_file,
                        alt_text=fake.sentence(),
                        uploaded_by=random.choice(users)
                    )
                    media_items.append(media_item)
                    self.stdout.write(self.style.SUCCESS(f'Created media item: {media_item.title}'))
                os.remove(img_path) # Clean up dummy file
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Could not create media item: {e}'))

        # Create Posts
        for _ in range(options['posts']):
            author = random.choice(users)
            title = fake.sentence(nb_words=6).replace('.', '')
            post_content = fake.paragraphs(nb=5, ext_word_list=None)
            post_content_html = "<p>" + "</p><p>".join(post_content) + "</p>"
            status = random.choice(['draft', 'published'])
            
            post = Post.objects.create(
                title=title,
                content=post_content_html,
                status=status,
                author=author,
                featured_image=random.choice(media_items) if media_items else None
            )
            # Add random categories and tags
            num_categories = random.randint(0, min(len(categories), 3))
            post.categories.set(random.sample(categories, num_categories))
            num_tags = random.randint(0, min(len(tags), 5))
            post.tags.set(random.sample(tags, num_tags))
            
            if status == 'published':
                post.published_at = fake.date_time_between(start_date="-1y", end_date="now", tzinfo=None)
                post.save(update_fields=['published_at'])

            self.stdout.write(self.style.SUCCESS(f'Created post: {post.title}'))

        # Create Pages
        for _ in range(options['pages']):
            author = random.choice(users)
            title = fake.unique.sentence(nb_words=4).replace('.', '')
            page_content = fake.paragraphs(nb=3, ext_word_list=None)
            page_content_html = "<p>" + "</p><p>".join(page_content) + "</p>"
            status = random.choice(['draft', 'published'])

            page = Page.objects.create(
                title=title,
                content=page_content_html,
                status=status,
                author=author,
                featured_image=random.choice(media_items) if media_items else None
            )
            # Pages might not have categories/tags usually, but our model supports it
            num_categories = random.randint(0, min(len(categories), 1))
            page.categories.set(random.sample(categories, num_categories))
            
            if status == 'published':
                page.published_at = fake.date_time_between(start_date="-1y", end_date="now", tzinfo=None)
                page.save(update_fields=['published_at'])
            
            self.stdout.write(self.style.SUCCESS(f'Created page: {page.title}'))

        self.stdout.write(self.style.SUCCESS('Database seeding complete!'))

```
To run the seed script: `python manage.py seed --posts 20 --pages 10`

#### Query Optimization

Mentioned in `backend/content/views.py` with `select_related` and `prefetch_related` for efficient fetching of related data in DRF ViewSets.

---

### 4. Configuration & Setup

#### `docker-compose.yml`

```yaml