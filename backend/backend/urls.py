from django.contrib import admin
from django.urls import path, include
from accounts import views as accounts_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    # Versioned API for frontend (v1)
    path('api/v1/auth/', include(('accounts.urls', 'accounts'), namespace='accounts_v1')),
    # Convenience aliases for frontend clients that expect /api/v1/auth/auth/... paths
    path('api/v1/auth/auth/register/', accounts_views.register, name='alias_register'),
    path('api/v1/auth/auth/logout/', accounts_views.auth_logout, name='alias_logout'),
    path('api/v1/auth/auth/me/', accounts_views.user_profile, name='alias_me'),
    path('api/payments/', include('payments.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/support/', include('support.urls')),
    # 'api_auth' app not present in the codebase; accounts provides auth endpoints.
    path('api/properties/', include('properties.urls')),
    path('accounts/', include('allauth.urls'))
]
