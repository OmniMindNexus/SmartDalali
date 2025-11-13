from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import stk_push, mpesa_callback, payment_status
from .api import PaymentViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('mpesa/stk/<int:property_id>/', stk_push, name='stk_push'),
    path('mpesa/callback/', mpesa_callback, name='mpesa_callback'),
    path('status/<int:payment_id>/', payment_status, name='payment_status'),
    path('', include(router.urls)),
]