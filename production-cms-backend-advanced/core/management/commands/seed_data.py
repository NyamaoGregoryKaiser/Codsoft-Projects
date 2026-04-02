import logging
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils import timezone
from faker import Faker
from core.models import Category, Tag, Media, Content, Comment

User = get_user_model()
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Seeds the database with initial data for development and testing.'

    def add_arguments(self, parser):
        parser.add_argument('--num_users', type=int, default=5,
                            help='The number of fake users to create.')
        parser.add_argument('--num_categories', type=int, default=5,
                            help='The number of fake categories to create.')
        parser.add_argument('--num_tags', type=int, default=10,
                            help='The number of fake tags to create.')
        parser.add_argument('--num_content', type=int, default=20,
                            help='The number of fake content items to create.')
        parser.add_argument('--num_comments_per_content', type=int, default=3,
                            help='The max number of comments per content item.')
        parser.add_argument('--clear_old', action='store_true',
                            help='Clear existing data before seeding.')

    def handle(self, *args, **options):
        fake = Faker()
        num_users = options['num_users']
        num_categories = options['num_categories']
        num_tags = options['num_tags']
        num_content = options['num_content']
        num_comments_per_content = options['num_comments_per_content']
        clear_old = options['clear_old']

        self.stdout.write(self.style.NOTICE("Starting data seeding..."))

        if clear_old:
            self.stdout.write(self.style.WARNING("Clearing existing data..."))
            Comment.objects.all().delete()
            Content.objects.all().delete()
            Media.objects.all().delete()
            Tag.objects.all().delete()
            Category.objects.all().delete()
            User.objects.filter(is_staff=False).delete() # Keep superusers

        # --- Create Users ---
        self.stdout.write("Creating users...")
        users = []
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
            users.append(admin_user)
            self.stdout.write(self.style.SUCCESS('Created superuser: admin/adminpass'))
        else:
            users.append(User.objects.get(username='admin'))


        for _ in range(num_users):
            username = fake.user_name()
            email = fake.email()
            password = 'password123'
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=fake.first_name(),
                    last_name=fake.last_name()
                )
                users.append(user)
        self.stdout.write(self.style.SUCCESS(f'Created {len(users)} users.'))

        # --- Create Categories ---
        self.stdout.write("Creating categories...")
        categories = []
        for _ in range(num_categories):
            name = fake.unique.word().capitalize() + ' Category'
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={'description': fake.sentence()}
            )
            categories.append(category)
        self.stdout.write(self.style.SUCCESS(f'Created {len(categories)} categories.'))

        # --- Create Tags ---
        self.stdout.write("Creating tags...")
        tags = []
        for _ in range(num_tags):
            name = fake.unique.word().capitalize()
            tag, created = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        self.stdout.write(self.style.SUCCESS(f'Created {len(tags)} tags.'))

        # --- Create Media (Placeholder) ---
        self.stdout.write("Creating placeholder media...")
        # In a real app, you'd upload actual files. Here, we just create a record.
        # For simplicity, we won't create actual files on disk for seeding.
        media_files = []
        for _ in range(num_content // 2): # Some content won't have images
            media = Media.objects.create(
                file='uploads/placeholder.jpg', # Point to a dummy file
                alt_text=fake.sentence(nb_words=5),
                caption=fake.sentence(),
                uploaded_by=random.choice(users)
            )
            media_files.append(media)
        self.stdout.write(self.style.SUCCESS(f'Created {len(media_files)} placeholder media items.'))


        # --- Create Content ---
        self.stdout.write("Creating content items...")
        content_items = []
        content_types = ['post', 'page']
        content_statuses = ['draft', 'published', 'archived']

        for i in range(num_content):
            title = fake.sentence(nb_words=6).replace('.', '') + f' {i}'
            author = random.choice(users)
            category = random.choice(categories) if categories else None
            status = random.choice(content_statuses)
            published_at = timezone.now() if status == 'published' else None
            featured_image = random.choice(media_files) if media_files and random.choice([True, False]) else None

            content_item = Content.objects.create(
                title=title,
                slug=slugify(title)[:250] + (f'-{i}' if Content.objects.filter(slug=slugify(title)).exists() else ''), # Ensure unique slug
                short_description=fake.paragraph(nb_sentences=3),
                content=fake.paragraphs(nb_sentences=10, ext_word_list=None, variable_nb_sentences=True),
                content_type=random.choice(content_types),
                author=author,
                category=category,
                featured_image=featured_image,
                status=status,
                published_at=published_at,
                views_count=random.randint(0, 1000) if status == 'published' else 0
            )
            # Add random tags
            random_tags = random.sample(tags, k=random.randint(0, min(len(tags), 3)))
            content_item.tags.set(random_tags)
            content_items.append(content_item)
        self.stdout.write(self.style.SUCCESS(f'Created {len(content_items)} content items.'))

        # --- Create Comments ---
        self.stdout.write("Creating comments...")
        for content_item in content_items:
            for _ in range(random.randint(0, num_comments_per_content)):
                commenter_user = random.choice(users) if random.choice([True, False]) else None
                comment = Comment.objects.create(
                    content_object=content_item,
                    author_name=commenter_user.get_full_name() if commenter_user else fake.name(),
                    author_email=commenter_user.email if commenter_user else fake.email(),
                    commenter=commenter_user,
                    body=fake.paragraph(nb_sentences=2),
                    approved=random.choice([True, False, True]) # More likely to be approved
                )
                # Create a reply to a random comment
                if random.choice([True, False]) and content_item.comments.count() > 1:
                    parent_comment = random.choice(list(content_item.comments.all()))
                    Comment.objects.create(
                        content_object=content_item,
                        author_name=fake.name(),
                        author_email=fake.email(),
                        commenter=random.choice(users),
                        body=fake.paragraph(nb_sentences=1),
                        approved=True,
                        parent_comment=parent_comment
                    )
        self.stdout.write(self.style.SUCCESS(f'Created comments for content items.'))

        self.stdout.write(self.style.SUCCESS('Data seeding complete.'))