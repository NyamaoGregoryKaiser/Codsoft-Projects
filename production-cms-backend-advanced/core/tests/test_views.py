import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from core.models import Category, Tag, Content, Media, Comment
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_user():
    return User.objects.create_user(username='testuser', email='test@example.com', password='password123')

@pytest.fixture
def create_admin_user():
    return User.objects.create_superuser(username='adminuser', email='admin@example.com', password='adminpassword')

@pytest.fixture
def auth_client(create_user):
    client = APIClient()
    response = client.post(reverse('token_obtain_pair'), {'username': 'testuser', 'password': 'password123'})
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])
    return client

@pytest.fixture
def auth_admin_client(create_admin_user):
    client = APIClient()
    response = client.post(reverse('token_obtain_pair'), {'username': 'adminuser', 'password': 'adminpassword'})
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])
    return client

@pytest.fixture
def create_category():
    return Category.objects.create(name='Test Category', description='A test category.')

@pytest.fixture
def create_tag():
    return Tag.objects.create(name='Test Tag')

@pytest.fixture
def create_media(create_user):
    return Media.objects.create(file='uploads/test.jpg', alt_text='Test Alt', uploaded_by=create_user)

@pytest.fixture
def create_content(create_user, create_category, create_media):
    return Content.objects.create(
        title='Sample Post',
        slug='sample-post',
        content='This is a sample content.',
        content_type='post',
        author=create_user,
        category=create_category,
        featured_image=create_media,
        status='published',
        published_at=timezone.now()
    )

@pytest.fixture
def create_draft_content(create_user, create_category):
    return Content.objects.create(
        title='Draft Post',
        slug='draft-post',
        content='This is a draft content.',
        content_type='post',
        author=create_user,
        category=create_category,
        status='draft',
        published_at=None
    )

@pytest.fixture
def create_comment(create_content, create_user):
    return Comment.objects.create(
        content_object=create_content,
        body='A nice comment.',
        commenter=create_user,
        approved=True
    )

@pytest.mark.django_db
def test_user_registration(api_client):
    url = reverse('register-list')
    data = {
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'strongpassword',
        'password2': 'strongpassword',
        'first_name': 'New',
        'last_name': 'User'
    }
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.filter(username='newuser').exists()

@pytest.mark.django_db
def test_admin_can_list_users(auth_admin_client, create_user):
    url = reverse('user-list')
    response = auth_admin_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) >= 2 # adminuser + testuser

@pytest.mark.django_db
def test_user_can_get_own_profile(auth_client, create_user):
    url = reverse('user-detail', args=[create_user.pk])
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['username'] == create_user.username

@pytest.mark.django_db
def test_user_cannot_get_other_profile(auth_client, create_user):
    other_user = User.objects.create_user(username='otheruser', email='other@example.com', password='password123')
    url = reverse('user-detail', args=[other_user.pk])
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_me_endpoint(auth_client, create_user):
    url = reverse('user-me')
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['username'] == create_user.username

@pytest.mark.django_db
def test_category_list_public(api_client, create_category):
    url = reverse('category-list')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 1
    assert response.data['results'][0]['name'] == create_category.name

@pytest.mark.django_db
def test_category_create_admin_only(auth_admin_client):
    url = reverse('category-list')
    data = {'name': 'New Category', 'description': 'desc'}
    response = auth_admin_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert Category.objects.count() == 2 # 1 fixture + 1 created

@pytest.mark.django_db
def test_category_create_non_admin_forbidden(auth_client):
    url = reverse('category-list')
    data = {'name': 'New Category', 'description': 'desc'}
    response = auth_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_tag_crud_admin_only(auth_admin_client, api_client):
    url = reverse('tag-list')
    data = {'name': 'Admin Tag'}
    response = auth_admin_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert Tag.objects.count() == 2 # fixture + created

    # Public user cannot create
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # Public user can list
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 2

@pytest.mark.django_db
def test_media_upload_authenticated_user(auth_client, create_user):
    url = reverse('media-list')
    with open('media/test_image.jpg', 'rb') as f: # Ensure a dummy file exists for testing
        data = {
            'file': f,
            'alt_text': 'Uploaded Image'
        }
        response = auth_client.post(url, data, format='multipart')
    assert response.status_code == status.HTTP_201_CREATED
    assert Media.objects.count() == 2 # fixture + created
    assert Media.objects.last().uploaded_by == create_user

@pytest.mark.django_db
def test_media_delete_owner_only(auth_client, auth_admin_client, create_media, create_user):
    url = reverse('media-detail', args=[create_media.pk])
    # Owner can delete
    response = auth_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Media.objects.count() == 0

    # Recreate media for admin test
    new_media = Media.objects.create(file='uploads/another.jpg', uploaded_by=create_user)
    url = reverse('media-detail', args=[new_media.pk])
    # Admin can delete
    response = auth_admin_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Media.objects.count() == 0

    # Attempt to delete by non-owner, non-admin
    another_user = User.objects.create_user(username='another', email='another@example.com', password='pass')
    another_client = APIClient()
    response = another_client.post(reverse('token_obtain_pair'), {'username': 'another', 'password': 'pass'})
    another_client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])

    media_by_admin = Media.objects.create(file='uploads/admin_file.jpg', uploaded_by=auth_admin_client.user)
    url_admin_media = reverse('media-detail', args=[media_by_admin.pk])
    response = another_client.delete(url_admin_media)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_content_list_public_only_published(api_client, create_content, create_draft_content):
    url = reverse('content-list')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 1 # Only published content
    assert response.data['results'][0]['slug'] == create_content.slug

@pytest.mark.django_db
def test_content_list_authenticated_user_sees_own_drafts(auth_client, create_content, create_draft_content):
    url = reverse('content-list')
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 2 # Published + own draft
    slugs = [item['slug'] for item in response.data['results']]
    assert create_content.slug in slugs
    assert create_draft_content.slug in slugs

@pytest.mark.django_db
def test_content_detail_public_published(api_client, create_content):
    url = reverse('content-detail', args=[create_content.slug])
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['title'] == create_content.title
    assert response.data['views_count'] == 1 # Views count incremented

@pytest.mark.django_db
def test_content_detail_public_draft_forbidden(api_client, create_draft_content):
    url = reverse('content-detail', args=[create_draft_content.slug])
    response = api_client.get(url)
    assert response.status_code == status.HTTP_404_NOT_FOUND # Drafts are not public

@pytest.mark.django_db
def test_content_create_authenticated_user(auth_client, create_category, create_tag, create_media, create_user):
    url = reverse('content-list')
    data = {
        'title': 'New Post by Auth User',
        'content': 'Content goes here.',
        'content_type': 'post',
        'category_id': create_category.id,
        'tag_ids': [create_tag.id],
        'featured_image_id': create_media.id,
        'status': 'draft'
    }
    response = auth_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert Content.objects.count() == 3 # 2 fixtures + 1 created
    new_content = Content.objects.get(slug='new-post-by-auth-user')
    assert new_content.author == create_user
    assert create_tag in new_content.tags.all()

@pytest.mark.django_db
def test_content_update_author_only(auth_client, auth_admin_client, create_content):
    url = reverse('content-detail', args=[create_content.slug])
    data = {'title': 'Updated Title by Author', 'status': 'published'}
    response = auth_client.patch(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    create_content.refresh_from_db()
    assert create_content.title == 'Updated Title by Author'

    # Non-author cannot update
    other_user = User.objects.create_user(username='other_author', email='other@example.com', password='pass')
    other_client = APIClient()
    response = other_client.post(reverse('token_obtain_pair'), {'username': 'other_author', 'password': 'pass'})
    other_client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])
    response = other_client.patch(url, {'title': 'Unauthorized Update'}, format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN

    # Admin can update
    response = auth_admin_client.patch(url, {'title': 'Updated by Admin'}, format='json')
    assert response.status_code == status.HTTP_200_OK
    create_content.refresh_from_db()
    assert create_content.title == 'Updated by Admin'

@pytest.mark.django_db
def test_content_delete_admin_only(auth_client, auth_admin_client, create_content):
    url = reverse('content-detail', args=[create_content.slug])
    # Author cannot delete (only admin in this setup)
    response = auth_client.delete(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert Content.objects.count() == 1

    # Admin can delete
    response = auth_admin_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Content.objects.count() == 0

@pytest.mark.django_db
def test_comment_create_public(api_client, create_content):
    url = reverse('content-comments-list', args=[create_content.slug])
    data = {
        'author_name': 'Anon',
        'author_email': 'anon@example.com',
        'body': 'Anonymous comment'
    }
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert Comment.objects.count() == 2 # fixture + created
    assert not Comment.objects.last().approved # Anonymous comment needs approval

@pytest.mark.django_db
def test_comment_create_authenticated_auto_approved(auth_client, create_content):
    url = reverse('content-comments-list', args=[create_content.slug])
    data = {
        'body': 'Auth comment'
    }
    response = auth_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert Comment.objects.count() == 2
    assert Comment.objects.last().approved # Authenticated comment is auto-approved

@pytest.mark.django_db
def test_comment_list_public_only_approved(api_client, create_content):
    Comment.objects.create(content_object=create_content, body='Unapproved comment', approved=False)
    url = reverse('content-comments-list', args=[create_content.slug])
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['results']) == 1 # Only approved comments
    assert response.data['results'][0]['body'] == 'A nice comment.'

@pytest.mark.django_db
def test_comment_approve_admin_only(auth_admin_client, create_content):
    unapproved_comment = Comment.objects.create(content_object=create_content, body='Needs approval', approved=False)
    url = reverse('content-comments-detail', args=[create_content.slug, unapproved_comment.pk])
    response = auth_admin_client.post(url + 'approve/', format='json') # Call custom action
    assert response.status_code == status.HTTP_200_OK
    unapproved_comment.refresh_from_db()
    assert unapproved_comment.approved is True

    # Test non-admin cannot approve
    other_user = User.objects.create_user(username='commenter', email='commenter@example.com', password='pass')
    other_client = APIClient()
    response = other_client.post(reverse('token_obtain_pair'), {'username': 'commenter', 'password': 'pass'})
    other_client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])
    response = other_client.post(url + 'approve/', format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_comment_delete_author_or_admin_only(auth_client, auth_admin_client, create_content, create_comment, create_user):
    url = reverse('content-comments-detail', args=[create_content.slug, create_comment.pk])

    # Author can delete
    response = auth_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Comment.objects.count() == 0

    # Recreate comment for admin test
    new_comment_for_admin = Comment.objects.create(content_object=create_content, body='Admin test comment', commenter=create_user, approved=True)
    url = reverse('content-comments-detail', args=[create_content.slug, new_comment_for_admin.pk])
    # Admin can delete
    response = auth_admin_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Comment.objects.count() == 0

    # Non-author, non-admin cannot delete
    another_user = User.objects.create_user(username='another_commenter', email='another@example.com', password='pass')
    another_client = APIClient()
    response = another_client.post(reverse('token_obtain_pair'), {'username': 'another_commenter', 'password': 'pass'})
    another_client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])

    comment_by_admin = Comment.objects.create(content_object=create_content, body='By admin', commenter=auth_admin_client.user, approved=True)
    url_admin_comment = reverse('content-comments-detail', args=[create_content.slug, comment_by_admin.pk])
    response = another_client.delete(url_admin_comment)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_rate_limiting_login_throttle(api_client, create_user):
    url = reverse('token_obtain_pair')
    data = {'username': 'testuser', 'password': 'wrongpassword'}

    # Exceed throttle limit (5 requests per minute for 'login' scope)
    for _ in range(5):
        response = api_client.post(url, data, format='json')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_429_TOO_MANY_REQUESTS]

    # The 6th request should be throttled
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert 'detail' in response.data and 'throttle' in response.data['detail'].lower()

@pytest.mark.django_db
def test_content_revisions_admin_access(auth_admin_client, create_content, create_user):
    # Ensure signal is connected for testing
    from core.signals import create_content_revision
    from django.db.models.signals import pre_save
    pre_save.connect(create_content_revision, sender=Content)

    # First update to create a revision
    create_content.content = "Initial revision content."
    create_content.author = create_user # Assign author for revision tracking
    create_content.save()
    
    # Second update to create another revision
    create_content.content = "Second revision content."
    create_content.author = create_user
    create_content.save()

    url = reverse('content-revisions', args=[create_content.slug])
    response = auth_admin_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 2 # Two revisions created

    # Non-admin cannot access revisions
    auth_client = APIClient()
    response = auth_client.post(reverse('token_obtain_pair'), {'username': create_user.username, 'password': 'password123'})
    auth_client.credentials(HTTP_AUTHORIZATION='Bearer ' + response.data['access'])
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

    pre_save.disconnect(create_content_revision, sender=Content)