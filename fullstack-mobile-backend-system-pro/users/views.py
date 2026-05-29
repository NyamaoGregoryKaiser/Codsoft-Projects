import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

from users.models import User
from users.serializers import UserRegistrationSerializer, UserProfileSerializer, UserListSerializer
from core.permissions import IsAdminUserOrReadOnly # Ensure this is imported for admin views

logger = logging.getLogger('app_logger')

class CustomLoginThrottle(AnonRateThrottle):
    scope = 'login'

class CustomRegisterThrottle(AnonRateThrottle):
    scope = 'register'

class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Allows any user to register.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = (AllowAny,)
    throttle_classes = [CustomRegisterThrottle]

    def perform_create(self, serializer):
        user = serializer.save()
        logger.info(f"New user registered: {user.email}")
        return user

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        # Automatically generate JWT tokens upon successful registration
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': serializer.data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED, headers=headers)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for retrieving and updating the authenticated user's profile.
    """
    queryset = User.objects.all() # We filter by request.user in get_object
    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        """
        Returns the user object associated with the current request.
        """
        return self.request.user

    def perform_update(self, serializer):
        super().perform_update(serializer)
        logger.info(f"User profile updated: {self.request.user.email}")

class UserListView(generics.ListAPIView):
    """
    API endpoint for listing all users.
    Only accessible by admin users.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserListSerializer
    permission_classes = (IsAdminUser,) # Only admin can list users

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, or deleting a specific user by ID.
    Only accessible by admin users.
    """
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer # Using profile serializer for admin to manage details
    permission_classes = (IsAdminUser,)

    def perform_destroy(self, instance):
        user_email = instance.email
        super().perform_destroy(instance)
        logger.warning(f"User account deleted: {user_email} by admin {self.request.user.email}")

class LogoutView(APIView):
    """
    API endpoint for user logout (blacklisting refresh tokens).
    Requires authentication.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f"User {request.user.email} logged out (refresh token blacklisted).")
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            logger.error(f"Logout failed for user {request.user.email}: {e}", exc_info=True)
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'detail': 'Invalid token or other error during logout.'})
--- END FILE ---

---