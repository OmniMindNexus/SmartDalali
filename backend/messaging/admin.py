from django.contrib import admin
from .models import Conversation, Message, MessageNotification

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_participants', 'property', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['participants__username', 'property__title']
    filter_horizontal = ['participants']
    
    def get_participants(self, obj):
        return ', '.join([p.username for p in obj.participants.all()])
    get_participants.short_description = 'Participants'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'content_preview', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['sender__username', 'content', 'conversation__participants__username']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

@admin.register(MessageNotification)
class MessageNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'message__content']
    readonly_fields = ['created_at']