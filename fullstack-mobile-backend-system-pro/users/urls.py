from django.urls import path
from users import views
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    # Note: Login is handled by TokenObtainPairView in config/urls.py, but could be customized here.
    # path('login/', TokenObtainPairView.as_view(throttle_classes=[views.CustomLoginThrottle]), name='user-login'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('logout/', views.LogoutView.as_view(), name='user-logout'),

    # Admin only views for user management
    path('', views.UserListView.as_view(), name='user-list'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]
--- END FILE ---

---