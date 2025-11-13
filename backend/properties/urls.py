from django.urls import path
from .views import (
    PropertyVisitListCreateView, PropertyVisitRetrieveUpdateDestroyView,
    PropertyListCreateView, PropertyRetrieveUpdateDestroyView
)

urlpatterns = [
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    path('<int:pk>/', PropertyRetrieveUpdateDestroyView.as_view(), name='property-retrieve-update-destroy'),

    path('visits/', PropertyVisitListCreateView.as_view(), name='propertyvisit-list-create'),
    path('visits/<int:pk>/', PropertyVisitRetrieveUpdateDestroyView.as_view(), name='propertyvisit-retrieve-update-destroy'),
]