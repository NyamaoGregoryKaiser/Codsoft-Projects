from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import Category, Tag, Media, Content, Comment, ContentRevision
from drf_spectacular.utils import extend_schema_field
from rest_framework.serializers import CurrentUserDefault

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model, showing essential profile information.
    """
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['username', 'email', 'is_staff', 'is_active', 'date_joined']

    @extend_schema_field(str)
    def get_full_name(self, obj):
        return obj.get_full_name()

class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model.
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'created_at', 'updated_at']

class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tag model.
    """
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'created_at', 'updated_at']

class MediaSerializer(serializers.ModelSerializer):
    """
    Serializer for the Media model.
    """
    uploaded_by = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ['id', 'file', 'file_url', 'alt_text', 'caption', 'uploaded_by', 'created_at', 'updated_at']
        read_only_fields = ['uploaded_by', 'created_at', 'updated_at']

    @extend_schema_field(str)
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Comment model.
    Includes nested replies.
    """
    commenter = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content_object', 'author_name', 'author_email', 'commenter', 'body', 'approved', 'parent_comment', 'created_at', 'updated_at', 'replies']
        read_only_fields = ['commenter', 'created_at', 'updated_at', 'approved']
        extra_kwargs = {
            'content_object': {'write_only': True}, # Content object is passed in URL
            'parent_comment': {'required': False, 'allow_null': True}
        }

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_replies(self, obj):
        # Recursively serialize replies, preventing infinite recursion by limiting depth or using a dedicated child serializer
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

    def create(self, validated_data):
        if self.context['request'].user.is_authenticated:
            validated_data['commenter'] = self.context['request'].user
            # If user is authenticated, default approved to true, or based on site settings
            validated_data['approved'] = True # Auto-approve for logged-in users
        else:
            # For anonymous users, comments might require manual approval
            validated_data['approved'] = False
        return super().create(validated_data)

class ContentRevisionSerializer(serializers.ModelSerializer):
    """
    Serializer for ContentRevision history.
    """
    revision_author = UserSerializer(read_only=True)

    class Meta:
        model = ContentRevision
        fields = ['id', 'content_item', 'previous_title', 'previous_content', 'revision_author', 'revision_message', 'created_at']
        read_only_fields = '__all__'


class ContentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Content model.
    Includes nested serializers for related objects.
    """
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all()),
        write_only=True, required=False
    )
    featured_image = MediaSerializer(read_only=True)
    featured_image_id = serializers.PrimaryKeyRelatedField(
        queryset=Media.objects.all(), source='featured_image', write_only=True, required=False, allow_null=True
    )
    comments_count = serializers.SerializerMethodField()
    first_level_comments = serializers.SerializerMethodField() # Only top-level comments for list/detail view

    class Meta:
        model = Content
        fields = [
            'id', 'title', 'slug', 'short_description', 'content', 'content_type',
            'author', 'category', 'category_id', 'tags', 'tag_ids',
            'featured_image', 'featured_image_id', 'status', 'published_at',
            'views_count', 'created_at', 'updated_at',
            'comments_count', 'first_level_comments'
        ]
        read_only_fields = ['author', 'slug', 'published_at', 'views_count', 'created_at', 'updated_at', 'comments_count', 'first_level_comments']
        lookup_field = 'slug'
        extra_kwargs = {'url': {'lookup_field': 'slug'}}

    @extend_schema_field(int)
    def get_comments_count(self, obj):
        return obj.comments.filter(approved=True).count()

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_first_level_comments(self, obj):
        # Only fetch and serialize top-level approved comments
        top_level_comments = obj.comments.filter(parent_comment__isnull=True, approved=True)
        return CommentSerializer(top_level_comments, many=True, context=self.context).data

    def create(self, validated_data):
        # Set author to the current authenticated user
        validated_data['author'] = self.context['request'].user

        tag_ids = validated_data.pop('tag_ids', [])
        content = super().create(validated_data)
        content.tags.set(tag_ids)
        return content

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        content = super().update(instance, validated_data)
        if tag_ids is not None:
            content.tags.set(tag_ids)
        return content

```

### `core/permissions.py`
```python