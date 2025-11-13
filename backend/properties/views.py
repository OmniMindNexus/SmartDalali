from rest_framework import generics, permissions
from .models import PropertyVisit, Property
from .serializers import PropertyVisitSerializer, SerializerProperty
from rest_framework.permissions import IsAuthenticated


class PropertyListCreateView(generics.ListCreateAPIView):
    queryset = Property.objects.all().order_by('-created_at')
    serializer_class = SerializerProperty
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # set owner to request user if authenticated
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        if user:
            serializer.save(owner=user)
        else:
            # prefer explicit denial rather than anonymous creation in future; currently save owner=None
            serializer.save()


class PropertyRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Property.objects.all()
    serializer_class = SerializerProperty
    permission_classes = [permissions.AllowAny]


class PropertyVisitListCreateView(generics.ListCreateAPIView):
    queryset = PropertyVisit.objects.all()
    serializer_class = PropertyVisitSerializer
    permission_classes = [IsAuthenticated]


class PropertyVisitRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PropertyVisit.objects.all()
    serializer_class = PropertyVisitSerializer
    permission_classes = [IsAuthenticated]

