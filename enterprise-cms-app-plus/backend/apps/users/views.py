```python
import logging
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.users.serializers import UserSerializer, UserRegisterSerializer, CustomTokenObtainPairSerializer

User = get_user_model()
logger = logging.getLogger('apps')

class RegisterUserView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Allows unauthenticated users to create a new account.
    """
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        logger.info(f"User registered: {user.username}")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        # Return a more concise response for registration success
        return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED, headers=headers)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for viewing and updating the authenticated user's profile.
    Requires authentication.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Returns the User object associated with the current authenticated request.
        """
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance, otherwise
            # the updated instance will not be reflected in a subsequent
            # 'get_object' call.
            instance._prefetched_objects_cache = {}

        logger.info(f"User profile updated: {instance.username}")
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Extends the default TokenObtainPairView to use our custom serializer
    that includes additional user information in the token response.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        logger.info(f"User logged in: {request.data.get('username')}")
        return response
```