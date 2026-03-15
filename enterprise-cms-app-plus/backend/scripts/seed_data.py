```python
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cms_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.content.models import Category, Tag, Post, Page
from django.utils import timezone
import logging

logger = logging.getLogger('apps')

User = get_user_model()

def run():
    print("Starting data seeding...")

    # 1. Create Superuser (if not exists)
    try:
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
            print(f"Created superuser: {admin_user.username}")
        else:
            admin_user = User.objects.get(username='admin')
            print(f"Superuser 'admin' already exists.")
    except Exception as e:
        logger.error(f"Error creating/getting superuser: {e}", exc_info=True)
        return

    # 2. Create Editor User (if not exists)
    try:
        if not User.objects.filter(username='editor').exists():
            editor_user = User.objects.create_user('editor', 'editor@example.com', 'editorpassword')
            print(f"Created editor user: {editor_user.username}")
        else:
            editor_user = User.objects.get(username='editor')
            print(f"Editor user 'editor' already exists.")
    except Exception as e:
        logger.error(f"Error creating/getting editor user: {e}", exc_info=True)
        return

    # 3. Create Categories
    categories_data = [
        {'name': 'Technology', 'slug': 'technology', 'description': 'Articles about tech and gadgets.'},
        {'name': 'Programming', 'slug': 'programming', 'description': 'Tutorials and guides on coding.'},
        {'name': 'Web Development', 'slug': 'web-development', 'description': 'Frontend and backend web topics.'},
        {'name': 'Marketing', 'slug': 'marketing', 'description': 'Digital marketing strategies.'},
    ]
    for data in categories_data:
        category, created = Category.objects.get_or_create(slug=data['slug'], defaults=data)
        if created:
            print(f"Created category: {category.name}")
        else:
            print(f"Category '{category.name}' already exists.")

    tech_cat = Category.objects.get(slug='technology')
    prog_cat = Category.objects.get(slug='programming')
    web_dev_cat = Category.objects.get(slug='web-development')

    # 4. Create Tags
    tags_data = [
        {'name': 'Python', 'slug': 'python'},
        {'name': 'Django', 'slug': 'django'},
        {'name': 'React', 'slug': 'react'},
        {'name': 'JavaScript', 'slug': 'javascript'},
        {'name': 'Databases', 'slug': 'databases'},
        {'name': 'Cloud', 'slug': 'cloud'},
    ]
    for data in tags_data:
        tag, created = Tag.objects.get_or_create(slug=data['slug'], defaults=data)
        if created:
            print(f"Created tag: {tag.name}")
        else:
            print(f"Tag '{tag.name}' already exists.")

    python_tag = Tag.objects.get(slug='python')
    django_tag = Tag.objects.get(slug='django')
    react_tag = Tag.objects.get(slug='react')
    javascript_tag = Tag.objects.get(slug='javascript')

    # 5. Create Posts
    posts_data = [
        {
            'title': 'Getting Started with Django REST Framework',
            'slug': 'getting-started-drf',
            'author': admin_user,
            'content': 'This is a detailed post about building APIs with Django REST Framework...',
            'excerpt': 'Learn the basics of DRF for your Python backend.',
            'status': 'published',
            'published_at': timezone.now() - timezone.timedelta(days=10),
            'categories': [tech_cat, prog_cat, web_dev_cat],
            'tags': [python_tag, django_tag],
        },
        {
            'title': 'Building a Component Library with React',
            'slug': 'react-component-library',
            'author': editor_user,
            'content': 'A guide to creating reusable UI components in React...',
            'excerpt': 'Enhance your frontend development with a solid component strategy.',
            'status': 'published',
            'published_at': timezone.now() - timezone.timedelta(days=5),
            'categories': [web_dev_cat],
            'tags': [react_tag, javascript_tag],
        },
        {
            'title': 'Understanding PostgreSQL for Web Applications',
            'slug': 'understanding-postgresql',
            'author': admin_user,
            'content': 'Deep dive into PostgreSQL features and best practices for web apps...',
            'excerpt': 'Optimize your database for performance and scalability.',
            'status': 'draft', # Example draft post
            'categories': [tech_cat],
            'tags': [Tag.objects.get(slug='databases')],
        },
        {
            'title': 'The Future of AI in Content Creation',
            'slug': 'ai-content-creation',
            'author': editor_user,
            'content': 'How AI is changing the landscape of content generation...',
            'excerpt': 'Exploring new tools and workflows.',
            'status': 'published',
            'published_at': timezone.now() - timezone.timedelta(days=2),
            'categories': [tech_cat, Category.objects.get(slug='marketing')],
            'tags': [],
        },
    ]

    for data in posts_data:
        categories = data.pop('categories')
        tags = data.pop('tags')
        post, created = Post.objects.get_or_create(slug=data['slug'], defaults=data)
        if created:
            post.categories.set(categories)
            post.tags.set(tags)
            print(f"Created post: {post.title}")
        else:
            print(f"Post '{post.title}' already exists.")

    # 6. Create Pages
    pages_data = [
        {
            'title': 'About Us',
            'slug': 'about-us',
            'author': admin_user,
            'content': 'Learn more about our mission and team.',
            'is_published': True,
            'order': 10,
        },
        {
            'title': 'Contact Us',
            'slug': 'contact-us',
            'author': admin_user,
            'content': 'Get in touch with us through various channels.',
            'is_published': True,
            'order': 20,
        },
        {
            'title': 'Privacy Policy',
            'slug': 'privacy-policy',
            'author': editor_user,
            'content': 'Our policy on user data and privacy.',
            'is_published': True,
            'order': 30,
        },
        {
            'title': 'Terms of Service (Draft)',
            'slug': 'terms-of-service-draft',
            'author': admin_user,
            'content': 'Draft version of our terms of service.',
            'is_published': False,
            'order': 40,
        },
    ]

    about_us_page = None
    for data in pages_data:
        page, created = Page.objects.get_or_create(slug=data['slug'], defaults=data)
        if created:
            print(f"Created page: {page.title}")
        else:
            print(f"Page '{page.title}' already exists.")
        if page.slug == 'about-us':
            about_us_page = page

    # Example of a sub-page
    if about_us_page:
        sub_page_data = {
            'title': 'Our Team',
            'slug': 'our-team',
            'author': admin_user,
            'content': 'Meet the amazing people behind our project.',
            'is_published': True,
            'parent_page': about_us_page,
            'order': 1,
        }
        sub_page, created = Page.objects.get_or_create(slug=sub_page_data['slug'], defaults=sub_page_data)
        if created:
            print(f"Created sub-page: {sub_page.title}")
        else:
            print(f"Sub-page '{sub_page.title}' already exists.")


    print("\nData seeding complete.")

if __name__ == '__main__':
    run()
```