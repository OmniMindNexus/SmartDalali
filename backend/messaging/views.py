from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Conversation, Message, MessageNotification
from .serializers import ConversationSerializer, MessageSerializer, CreateMessageSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user, is_active=True)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        
        # Mark messages as read for the current user
        conversation.messages.filter(
            sender__in=conversation.participants.exclude(id=request.user.id),
            is_read=False
        ).update(is_read=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = CreateMessageSerializer(
            data=request.data,
            context={'conversation': conversation, 'request': request}
        )
        
        if serializer.is_valid():
            message = serializer.save()
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Start a new conversation with another user"""
        user_id = request.data.get('user_id')
        property_id = request.data.get('property_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists and is not the current user
        from django.contrib.auth.models import User
        try:
            other_user = User.objects.get(id=user_id)
            if other_user == request.user:
                return Response({'error': 'Cannot start conversation with yourself'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).first()
        
        if existing_conversation:
            return Response(ConversationSerializer(existing_conversation, context={'request': request}).data)
        
        # Create new conversation
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)
        
        # Add property if specified
        if property_id:
            from properties.models import Property
            try:
                property_obj = Property.objects.get(id=property_id)
                conversation.property = property_obj
                conversation.save()
            except Property.DoesNotExist:
                pass
        
        return Response(ConversationSerializer(conversation, context={'request': request}).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get total unread message count for the user"""
        user = request.user
        unread_count = MessageNotification.objects.filter(user=user, is_read=False).count()
        return Response({'unread_count': unread_count})

class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(conversation__participants=user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        
        # Check if user is a participant in the conversation
        if request.user not in message.conversation.participants.all():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        message.mark_as_read()
        
        # Mark notification as read
        MessageNotification.objects.filter(
            user=request.user,
            message=message
        ).update(is_read=True)