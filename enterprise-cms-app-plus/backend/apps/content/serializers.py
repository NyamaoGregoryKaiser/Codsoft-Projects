```python
from rest_framework import serializers
from apps.content.models import Category, Tag, Post, Page
from apps.users.serializers import UserSerializer
from apps.media.serializers import MediaItemSerializer # Assuming MediaItemSerializer exists
from django.utils.text import slugify

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model.
    Auto-generates slug if not provided.
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'slug': {'required': False},
        }

    def validate(self, data):
        # Auto-generate slug if not provided
        if not data.get('slug') and data.get('name'):
            data['slug'] = slugify(data['name'])
        return data

class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tag model.
    Auto-generates slug if not provided.
    """
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'slug': {'required': False},
        }

    def validate(self, data):
        # Auto-generate slug if not provided
        if not data.get('slug') and data.get('name'):
            data['slug'] = slugify(data['name'])
        return data

class PostSerializer(serializers.ModelSerializer):
    """
    Serializer for the Post model.
    Includes nested serializers for author, categories, tags, and featured_image.
    """
    author = UserSerializer(read_only=True) # Read-only author details
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=serializers.get_user_model().objects.all(), source='author', write_only=True, required=False
    )
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, source='categories', write_only=True, required=False
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, source='tags', write_only=True, required=False
    )
    featured_image = MediaItemSerializer(read_only=True)
    featured_image_id = serializers.PrimaryKeyRelatedField(
        queryset=serializers.get_user_model().objects.all(), # This should be MediaItem.objects.all()
        source='featured_image', write_only=True, required=False, allow_null=True
    )
    # Corrected queryset for featured_image_id, assuming MediaItem model exists
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'request' in self.context:
            self.fields['featured_image_id'].queryset = self.context['request'].user.media_items.all() # Limit to user's media
        else:
             from apps.media.models import MediaItem
             self.fields['featured_image_id'].queryset = MediaItem.objects.all()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'author', 'author_id', 'content', 'excerpt', 'status',
            'featured_image', 'featured_image_id', 'categories', 'category_ids', 'tags', 'tag_ids',
            'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'author'] # Author is set automatically
        extra_kwargs = {
            'slug': {'required': False},
            'published_at': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        # Auto-generate slug if not provided
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'])
        return data

    def create(self, validated_data):
        # Assign the author automatically from the request user
        if not validated_data.get('author') and self.context['request'].user.is_authenticated:
            validated_data['author'] = self.context['request'].user
        
        category_ids = validated_data.pop('categories', [])
        tag_ids = validated_data.pop('tags', [])
        
        post = super().create(validated_data)
        
        if category_ids:
            post.categories.set(category_ids)
        if tag_ids:
            post.tags.set(tag_ids)
        
        return post

    def update(self, instance, validated_data):
        category_ids = validated_data.pop('categories', None)
        tag_ids = validated_data.pop('tags', None)

        instance = super().update(instance, validated_data)

        if category_ids is not None:
            instance.categories.set(category_ids)
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        
        return instance

class PageSerializer(serializers.ModelSerializer):
    """
    Serializer for the Page model.
    Includes nested serializers for author and parent page.
    """
    author = UserSerializer(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=serializers.get_user_model().objects.all(), source='author', write_only=True, required=False
    )
    parent_page = serializers.SerializerMethodField(read_only=True)
    parent_page_id = serializers.PrimaryKeyRelatedField(
        queryset=Page.objects.all(), source='parent_page', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Page
        fields = [
            'id', 'title', 'slug', 'author', 'author_id', 'content', 'is_published',
            'parent_page', 'parent_page_id', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'author']
        extra_kwargs = {
            'slug': {'required': False},
        }

    def get_parent_page(self, obj):
        if obj.parent_page:
            # Avoid recursion by only returning basic info
            return {'id': obj.parent_page.id, 'title': obj.parent_page.title, 'slug': obj.parent_page.slug}
        return None

    def validate(self, data):
        # Auto-generate slug if not provided
        if not data.get('slug') and data.get('title'):
            data['slug'] = slugify(data['title'])
        
        # Prevent a page from being its own parent
        if self.instance and data.get('parent_page') == self.instance:
            raise serializers.ValidationError({"parent_page": "A page cannot be its own parent."})
        return data

    def create(self, validated_data):
        # Assign the author automatically from the request user
        if not validated_data.get('author') and self.context['request'].user.is_authenticated:
            validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
```