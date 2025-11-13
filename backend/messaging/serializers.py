from rest_framework import serializers
from .models import Conversation, Message, MessageNotification
from accounts.models import Profile
from accounts.roles import get_user_role

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'sender_role', 'sender_avatar', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'is_read', 'created_at']
    
    def get_sender_role(self, obj):
        return get_user_role(obj.sender)
    
    def get_sender_avatar(self, obj):
        try:
            profile = obj.sender.profile
            if profile and profile.image:
                return profile.image.url
        except:
            pass
        return None

class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    property_title = serializers.CharField(source='property.title', read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant', 'property', 'property_title',
            'last_message', 'unread_count', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['participants', 'created_at', 'updated_at']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return {
                    'id': other_user.id,
                    'username': other_user.username,
                    'email': other_user.email,
                    'role': get_user_role(other_user),
                    'avatar': other_user.profile.image.url if hasattr(other_user, 'profile') and other_user.profile.image else None
                }
        return None
    
    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return {
                'id': last_msg.id,
                'content': last_msg.content,
                'sender_id': last_msg.sender.id,
                'sender_name': last_msg.sender.username,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(sender__in=obj.participants.exclude(id=request.user.id), is_read=False).count()
        return 0

class CreateMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content']
    
    def create(self, validated_data):
        conversation = self.context['conversation']
        sender = self.context['request'].user
        
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=validated_data['content']
        )
        
        # Create notifications for other participants
        for participant in conversation.participants.exclude(id=sender.id):
            MessageNotification.objects.create(
                user=participant,
                message=message
            )
        
        # Update conversation timestamp
        conversation.save()
        
        return message