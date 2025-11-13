from rest_framework import viewsets, permissions
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows notifications to be viewed or edited.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the notifications
        for the currently authenticated user.
        """
        return self.request.user.notification_set.all()