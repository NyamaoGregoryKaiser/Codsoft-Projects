import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import Category, Tag, Content, Media, Comment, ContentRevision

User = get_user_model()

@pytest.fixture
def create_user():
    return User.objects.create_user(username='testuser', email='test@example.com', password='password123')

@pytest.fixture
def create_admin_user():
    return User.objects.create_superuser(username='adminuser', email='admin@example.com', password='adminpassword')

@pytest.fixture
def create_category():
    return Category.objects.create(name='Test Category', description='A description for testing.')

@pytest.fixture
def create_tag():
    return Tag.objects.create(name='Test Tag')

@pytest.fixture
def create_media(create_user):
    return Media.objects.create(
        file='uploads/test_image.jpg',
        alt_text='A test image',
        uploaded_by=create_user
    )

@pytest.fixture
def create_content(create_user, create_category, create_media):
    return Content.objects.create(
        title='Test Content Title',
        short_description='This is a short description.',
        content='This is the **main content** of the test item.',
        content_type='post',
        author=create_user,
        category=create_category,
        featured_image=create_media,
        status='draft',
        published_at=None
    )

@pytest.mark.django_db
def test_category_creation(create_category):
    category = create_category
    assert category.name == 'Test Category'
    assert category.slug == 'test-category'
    assert category.created_at is not None
    assert category.updated_at is not None

@pytest.mark.django_db
def test_tag_creation(create_tag):
    tag = create_tag
    assert tag.name == 'Test Tag'
    assert tag.slug == 'test-tag'

@pytest.mark.django_db
def test_media_creation(create_media, create_user):
    media = create_media
    assert media.file == 'uploads/test_image.jpg'
    assert media.alt_text == 'A test image'
    assert media.uploaded_by == create_user

@pytest.mark.django_db
def test_content_creation(create_content, create_user, create_category, create_media):
    content = create_content
    assert content.title == 'Test Content Title'
    assert content.slug == 'test-content-title'
    assert content.content_type == 'post'
    assert content.author == create_user
    assert content.category == create_category
    assert content.featured_image == create_media
    assert content.status == 'draft'
    assert content.published_at is None
    assert content.views_count == 0

@pytest.mark.django_db
def test_content_status_published_at_logic(create_user, create_category, create_media):
    content = Content.objects.create(
        title='Published Content',
        content='Content body',
        content_type='post',
        author=create_user,
        category=create_category,
        featured_image=create_media,
        status='draft'
    )
    assert content.published_at is None

    # Change to published
    content.status = 'published'
    content.save()
    assert content.published_at is not None
    initial_published_at = content.published_at

    # Update again while published, published_at should not change
    content.content = 'Updated content body'
    content.save()
    assert content.published_at == initial_published_at

    # Change to archived, published_at should be reset
    content.status = 'archived'
    content.save()
    assert content.published_at is None

@pytest.mark.django_db
def test_content_tags_relationship(create_content, create_tag):
    tag2 = Tag.objects.create(name='Another Tag')
    create_content.tags.add(create_tag, tag2)
    assert create_content.tags.count() == 2
    assert create_tag in create_content.tags.all()
    assert tag2 in create_content.tags.all()

@pytest.mark.django_db
def test_content_increment_views(create_content):
    initial_views = create_content.views_count
    create_content.increment_views()
    create_content.refresh_from_db()
    assert create_content.views_count == initial_views + 1

@pytest.mark.django_db
def test_comment_creation(create_content, create_user):
    comment = Comment.objects.create(
        content_object=create_content,
        author_name='Commenter Name',
        author_email='commenter@example.com',
        commenter=create_user,
        body='This is a test comment.',
        approved=False
    )
    assert comment.content_object == create_content
    assert comment.commenter == create_user
    assert not comment.approved

@pytest.mark.django_db
def test_comment_reply(create_content, create_user):
    parent = Comment.objects.create(
        content_object=create_content,
        body='Parent comment',
        commenter=create_user,
        approved=True
    )
    reply_user = User.objects.create_user(username='replyuser', email='reply@example.com', password='password123')
    reply = Comment.objects.create(
        content_object=create_content,
        body='A reply to the parent.',
        commenter=reply_user,
        parent_comment=parent,
        approved=True
    )
    assert reply.parent_comment == parent
    assert parent.replies.count() == 1
    assert reply in parent.replies.all()

@pytest.mark.django_db
def test_content_revision_creation(create_content, create_admin_user):
    # Ensure signal is connected for testing
    from core.signals import create_content_revision
    from django.db.models.signals import pre_save
    pre_save.connect(create_content_revision, sender=Content)

    initial_content = create_content.content
    initial_title = create_content.title
    initial_author = create_content.author

    # Update content
    create_content.content = 'Updated content for revision.'
    create_content.title = 'Updated Title'
    create_content.author = create_admin_user # Assign admin as the updater for revision
    create_content.save()

    revision = ContentRevision.objects.get(content_item=create_content)
    assert revision.previous_content == initial_content
    assert revision.previous_title == initial_title
    assert revision.revision_author == create_admin_user # The author assigned during save
    assert revision.revision_message == "Content updated via API/Admin"

    # Disconnect the signal to avoid interference with other tests if needed
    pre_save.disconnect(create_content_revision, sender=Content)