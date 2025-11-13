from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.db.models import Q
from .models import SupportTicket, TicketReply
from .serializers import SupportTicketSerializer, CreateSupportTicketSerializer, TicketReplySerializer

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            # Admin can see all tickets
            return SupportTicket.objects.all()
        else:
            # Users can only see their own tickets
            return SupportTicket.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateSupportTicketSerializer
        return SupportTicketSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message', '')
        
        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user can reply to this ticket
        if not (ticket.user == request.user or request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        reply = TicketReply.objects.create(
            ticket=ticket,
            user=request.user,
            message=message,
            is_admin_reply=request.user.is_superuser or request.user.is_staff
        )
        
        # Update ticket status and user_reply field
        if request.user == ticket.user:
            ticket.user_reply = message
            ticket.status = 'open'  # Reopen if user replies
        else:
            ticket.admin_reply = message
            ticket.assigned_to = request.user
            if ticket.status == 'open':
                ticket.status = 'in_progress'
        
        ticket.save()
        
        return Response(TicketReplySerializer(reply).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if assigned_to_id:
            from django.contrib.auth.models import User
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
                ticket.assigned_to = assigned_user
                ticket.status = 'in_progress'
                ticket.save()
                return Response({'message': 'Ticket assigned successfully'})
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'assigned_to is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        ticket = self.get_object()
        ticket.status = 'closed'
        ticket.closed_at = timezone.now()
        ticket.save()
        
        return Response({'message': 'Ticket closed successfully'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.db.models import Count
        from django.utils import timezone
        
        stats = {
            'total_tickets': SupportTicket.objects.count(),
            'open_tickets': SupportTicket.objects.filter(status='open').count(),
            'in_progress_tickets': SupportTicket.objects.filter(status='in_progress').count(),
            'resolved_tickets': SupportTicket.objects.filter(status='resolved').count(),
            'closed_tickets': SupportTicket.objects.filter(status='closed').count(),
            'tickets_by_priority': dict(SupportTicket.objects.values('priority').annotate(count=Count('id')).values_list('priority', 'count')),
            'tickets_by_category': dict(SupportTicket.objects.values('category').annotate(count=Count('id')).values_list('category', 'count')),
        }
        
        return Response(stats)
