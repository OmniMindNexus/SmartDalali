from rest_framework import serializers
from .models import SupportTicket, TicketReply
from accounts.models import Profile

class TicketReplySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketReply
        fields = ['id', 'user', 'user_name', 'user_role', 'message', 'is_admin_reply', 'created_at']
        read_only_fields = ['user', 'is_admin_reply', 'created_at']
    
    def get_user_role(self, obj):
        if obj.user.is_superuser:
            return 'admin'
        elif obj.user.groups.filter(name='agent').exists():
            return 'agent'
        else:
            return 'user'

class SupportTicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    replies = TicketReplySerializer(many=True, read_only=True)
    reply_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'user', 'user_name', 'user_email',
            'title', 'description', 'category', 'priority', 'status',
            'assigned_to', 'assigned_to_name', 'admin_reply', 'user_reply',
            'created_at', 'updated_at', 'closed_at', 'replies', 'reply_count'
        ]
        read_only_fields = ['user', 'ticket_number', 'created_at', 'updated_at', 'closed_at']
    
    def get_reply_count(self, obj):
        return obj.replies.count()

class CreateSupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['title', 'description', 'category', 'priority']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
