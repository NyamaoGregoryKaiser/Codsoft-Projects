```python
from rest_framework import serializers
from apps.media.models import MediaItem
from apps.users.serializers import UserSerializer

class MediaItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the MediaItem model.
    Handles file uploads and displays relevant metadata.
    """
    owner = UserSerializer(read_only=True) # Display owner's basic info
    file_url = serializers.SerializerMethodField() # For easy access to the file URL

    class Meta:
        model = MediaItem
        fields = [
            'id', 'title', 'file', 'file_url', 'owner', 'file_type',
            'file_size', 'description', 'alt_text', 'created_at', 'updated_at'
        ]
        read_only_fields = ['owner', 'file_type', 'file_size', 'created_at', 'updated_at']
        extra_kwargs = {
            'file': {'write_only': True, 'required': True} # File field is write-only for uploads
        }

    def get_file_url(self, obj):
        """
        Returns the absolute URL for the uploaded file.
        """
        if obj.file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

    def create(self, validated_data):
        # Assign the owner automatically from the request user
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
```