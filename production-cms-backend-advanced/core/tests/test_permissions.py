import pytest
from rest_framework.test import APIRequestFactory
from rest_framework import status
from django.contrib.auth import get_user_model

from core.permissions import (
    IsAdminOrReadOnly, IsAuthorOrAdminOrReadOnly, IsOwnerOrAdmin,
    IsCommentAuthorOrAdminOrReadOnly
)
from core.models import Content, Media, Comment, Category

User = get_user_model()
factory = APIRequestFactory()

@pytest.fixture
def create_user():
    return User.objects.create_user(username='testuser', email='test@example.com', password='password123')

@pytest.fixture
def create_admin_user():
    return User.objects.create_superuser(username='adminuser', email='admin@example.com', password='adminpassword')

@pytest.fixture
def create_category():
    return Category.objects.create(name='Test Category')

@pytest.fixture
def create_content(create_user, create_category):
    return Content.objects.create(
        title='Test Content',
        content='Body',
        content_type='post',
        author=create_user,
        category=create_category,
        status='published'
    )

@pytest.fixture
def create_media(create_user):
    return Media.objects.create(file='test.jpg', uploaded_by=create_user)

@pytest.fixture
def create_comment(create_content, create_user):
    return Comment.objects.create(content_object=create_content, body='Test comment', commenter=create_user)

@pytest.mark.django_db
class TestIsAdminOrReadOnlyPermission:
    def test_safe_methods_allowed_to_all(self, create_user):
        permission = IsAdminOrReadOnly()
        request = factory.get('/')
        request.user = create_user
        assert permission.has_permission(request, None)

        request.user.is_authenticated = False
        assert permission.has_permission(request, None)

    def test_write_methods_denied_to_non_admin(self, create_user):
        permission = IsAdminOrReadOnly()
        request = factory.post('/', {})
        request.user = create_user
        assert not permission.has_permission(request, None)

    def test_write_methods_allowed_to_admin(self, create_admin_user):
        permission = IsAdminOrReadOnly()
        request = factory.post('/', {})
        request.user = create_admin_user
        assert permission.has_permission(request, None)

@pytest.mark.django_db
class TestIsAuthorOrAdminOrReadOnlyPermission:
    def test_safe_methods_allowed_to_all(self, create_content, create_user):
        permission = IsAuthorOrAdminOrReadOnly()
        request = factory.get('/')
        request.user = create_user
        assert permission.has_object_permission(request, None, create_content)

        request.user.is_authenticated = False
        assert permission.has_object_permission(request, None, create_content)

    def test_write_methods_denied_to_non_author_non_admin(self, create_content):
        permission = IsAuthorOrAdminOrReadOnly()
        request = factory.put('/', {})
        request.user = User.objects.create_user(username='otheruser', email='other@example.com', password='password')
        assert not permission.has_object_permission(request, None, create_content)

    def test_write_methods_allowed_to_author(self, create_content, create_user):
        permission = IsAuthorOrAdminOrReadOnly()
        request = factory.put('/', {})
        request.user = create_user
        assert permission.has_object_permission(request, None, create_content)

    def test_write_methods_allowed_to_admin(self, create_content, create_admin_user):
        permission = IsAuthorOrAdminOrReadOnly()
        request = factory.put('/', {})
        request.user = create_admin_user
        assert permission.has_object_permission(request, None, create_content)

@pytest.mark.django_db
class TestIsOwnerOrAdminPermission:
    def test_owner_can_edit_media(self, create_media, create_user):
        permission = IsOwnerOrAdmin()
        request = factory.put('/', {})
        request.user = create_user
        assert permission.has_object_permission(request, None, create_media)

    def test_admin_can_edit_media(self, create_media, create_admin_user):
        permission = IsOwnerOrAdmin()
        request = factory.put('/', {})
        request.user = create_admin_user
        assert permission.has_object_permission(request, None, create_media)

    def test_non_owner_non_admin_cannot_edit_media(self, create_media):
        permission = IsOwnerOrAdmin()
        request = factory.put('/', {})
        request.user = User.objects.create_user(username='intruder', email='intruder@example.com', password='pass')
        assert not permission.has_object_permission(request, None, create_media)

@pytest.mark.django_db
class TestIsCommentAuthorOrAdminOrReadOnlyPermission:
    def test_anyone_can_create_comment(self):
        permission = IsCommentAuthorOrAdminOrReadOnly()
        request = factory.post('/', {})
        request.user = User.objects.create_user(username='anon', email='anon@example.com', password='pass') # Even authenticated non-admin
        assert permission.has_permission(request, type('View', (object,), {'action': 'create'}))

        request.user.is_authenticated = False # Anonymous user
        assert permission.has_permission(request, type('View', (object,), {'action': 'create'}))

    def test_safe_methods_allowed_for_approved_comments(self, create_comment, create_user):
        permission = IsCommentAuthorOrAdminOrReadOnly()
        request = factory.get('/')
        request.user = create_user # Authenticated
        assert permission.has_object_permission(request, None, create_comment)

        # Unapproved comment not visible
        unapproved_comment = Comment.objects.create(content_object=create_comment.content_object, body='unapproved', approved=False)
        assert not permission.has_object_permission(request, None, unapproved_comment)

        request.user.is_authenticated = False # Anonymous
        assert permission.has_object_permission(request, None, create_comment)

    def test_write_methods_denied_to_non_author_non_admin(self, create_comment):
        permission = IsCommentAuthorOrAdminOrReadOnly()
        request = factory.put('/', {})
        request.user = User.objects.create_user(username='other', email='other@example.com', password='pass')
        assert not permission.has_object_permission(request, None, create_comment)

    def test_write_methods_allowed_to_comment_author(self, create_comment, create_user):
        permission = IsCommentAuthorOrAdminOrReadOnly()
        request = factory.put('/', {})
        request.user = create_user
        assert permission.has_object_permission(request, None, create_comment)

    def test_write_methods_allowed_to_admin(self, create_comment, create_admin_user):
        permission = IsCommentAuthorOrAdminOrReadOnly()
        request = factory.put('/', {})
        request.user = create_admin_user
        assert permission.has_object_permission(request, None, create_comment)