from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample

from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer
from .models import User

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    @extend_schema(
        summary="Register a new user",
        request=RegisterSerializer,
        responses={201: UserSerializer},
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(
        summary="Obtain JWT access and refresh tokens",
        request=CustomTokenObtainPairSerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'refresh': {'type': 'string'},
                    'access': {'type': 'string'},
                    'user': {'type': 'object', 'properties': UserSerializer().get_fields()}
                }
            }
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class LogoutView(views.APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        summary="Logout user by blacklisting refresh token",
        request={
            'application/json': {
                'type': 'object',
                'properties': {'refresh': {'type': 'string', 'example': 'your_refresh_token_here'}}
            }
        },
        responses={205: {'description': 'Logout successful'}}
    )
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    @extend_schema(
        summary="Retrieve authenticated user profile",
        responses={200: UserSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update authenticated user profile",
        request=UserSerializer,
        responses={200: UserSerializer},
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Partially update authenticated user profile",
        request=UserSerializer,
        responses={200: UserSerializer},
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

```

#### `backend/users/urls.py`

```python