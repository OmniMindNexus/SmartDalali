from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'users', views.UserManagementViewSet, basename='user-management')
router.register(r'profiles', views.UserProfileViewSet, basename='user-profile')
router.register(r'agent-profiles', views.AgentProfileViewSet, basename='agent-profile')

app_name = 'accounts'

urlpatterns = [
    path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', views.get_user_routes, name='get_user_routes'),
    path('logout/', views.auth_logout, name='auth_logout'),
    path('register/', views.register, name='register'),
    path('me/', views.user_profile, name='me'),
    path('profile/', views.user_profile, name='user_profile'),
    path('profile/update/', views.update_user_profile, name='update_user_profile'),
    path('signup/', views.signup, name='signup'),
    path('gpt', views.generate_ollama3_text),
    path('<str:username>/activate', views.activate),
    path('', include(router.urls)),
]