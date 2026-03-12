from rest_framework import serializers
from .models import Category, Tag, MediaItem, Post, Page, ContentRevision
from users.serializers import UserSerializer # For nested user representation

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('slug', 'created_at', 'updated_at')

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'
        read_only_fields = ('slug', 'created_at', 'updated_at')

class MediaItemSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaItem
        fields = '__all__'
        read_only_fields = ('uploaded_by', 'uploaded_at')

    def get_file_url(self, obj):
        if obj.file:
            return self.context['request'].build_absolute_uri(obj.file.url)
        return None

class ContentRevisionSerializer(serializers.ModelSerializer):
    revised_by = UserSerializer(read_only=True)

    class Meta:
        model = ContentRevision
        fields = '__all__'
        read_only_fields = ('content_object_id', 'content_type', 'revision_date', 'revised_by')

class ContentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='categories', many=True, write_only=True, required=False
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), source='tags', many=True, write_only=True, required=False
    )
    featured_image = MediaItemSerializer(read_only=True)
    featured_image_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaItem.objects.all(), source='featured_image', write_only=True, required=False, allow_null=True
    )
    
    # Optional: Display content revisions
    revisions = serializers.SerializerMethodField()

    class Meta:
        fields = '__all__'
        read_only_fields = ('slug', 'author', 'published_at', 'created_at', 'updated_at', 'revisions')
        # Add 'content_type' and 'content_object_id' for ContentRevision in the actual Content model classes
    
    def get_revisions(self, obj):
        # Assuming ContentRevision is directly linked, or via GenericForeignKey
        # For GenericForeignKey, we need contenttypes
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(obj)
        revisions = ContentRevision.objects.filter(
            content_type=content_type,
            content_object_id=obj.id
        ).order_by('-revision_date')
        return ContentRevisionSerializer(revisions, many=True, context=self.context).data

    def create(self, validated_data):
        category_ids = validated_data.pop('categories', [])
        tag_ids = validated_data.pop('tags', [])
        featured_image_instance = validated_data.pop('featured_image', None)
        
        validated_data['author'] = self.context['request'].user
        instance = super().create(validated_data)

        if category_ids:
            instance.categories.set(category_ids)
        if tag_ids:
            instance.tags.set(tag_ids)
        if featured_image_instance:
            instance.featured_image = featured_image_instance
            instance.save()
        
        # Optionally create initial revision
        # self._create_revision(instance, self.context['request'].user, "Initial draft")
        return instance

    def update(self, instance, validated_data):
        category_ids = validated_data.pop('categories', instance.categories.all())
        tag_ids = validated_data.pop('tags', instance.tags.all())
        featured_image_instance = validated_data.pop('featured_image', instance.featured_image)
        
        # Optionally create a revision BEFORE updating
        # self._create_revision(instance, self.context['request'].user, "Content updated")

        instance = super().update(instance, validated_data)

        instance.categories.set(category_ids)
        instance.tags.set(tag_ids)
        instance.featured_image = featured_image_instance
        instance.save() # Save relations and featured_image

        return instance

    def _create_revision(self, content_instance, user, notes):
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(content_instance)
        
        # Get latest revision number or start from 1
        last_revision = ContentRevision.objects.filter(
            content_type=content_type,
            content_object_id=content_instance.id
        ).order_by('-revision_number').first()
        
        new_revision_number = 1
        if last_revision:
            new_revision_number = last_revision.revision_number + 1

        ContentRevision.objects.create(
            content_type=content_type,
            content_object_id=content_instance.id,
            revision_number=new_revision_number,
            snapshot_title=content_instance.title,
            snapshot_content=content_instance.content,
            snapshot_status=content_instance.status,
            revised_by=user,
            notes=notes
        )


class PostSerializer(ContentSerializer):
    class Meta(ContentSerializer.Meta):
        model = Post

class PageSerializer(ContentSerializer):
    class Meta(ContentSerializer.Meta):
        model = Page

```

#### `backend/content/views.py`

```python