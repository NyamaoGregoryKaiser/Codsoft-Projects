from rest_framework import serializers
from users.models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone_number', 'password', 'password2')
        extra_kwargs = {
            'username': {'required': False}, # Optional, can derive from email
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        # If username is not provided, use email as username
        username = validated_data.get('username')
        if not username:
            validated_data['username'] = validated_data['email']
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'address', 'is_staff', 'date_joined', 'last_login')
        read_only_fields = ('id', 'username', 'email', 'is_staff', 'date_joined', 'last_login')

    def update(self, instance, validated_data):
        # Allow updating phone_number and address
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.address = validated_data.get('address', instance.address)
        instance.save()
        return instance

class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff')
--- END FILE ---

---