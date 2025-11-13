from django.contrib import admin
from .models import SupportTicket, TicketReply

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'title', 'user', 'category', 'priority', 'status', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'category', 'created_at']
    search_fields = ['ticket_number', 'title', 'user__username', 'user__email']
    readonly_fields = ['ticket_number', 'created_at', 'updated_at']
    list_editable = ['status', 'assigned_to']
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('ticket_number', 'user', 'title', 'description', 'category', 'priority', 'status')
        }),
        ('Assignment', {
            'fields': ('assigned_to',)
        }),
        ('Replies', {
            'fields': ('admin_reply', 'user_reply')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'closed_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'user', 'is_admin_reply', 'created_at']
    list_filter = ['is_admin_reply', 'created_at']
    search_fields = ['ticket__ticket_number', 'user__username', 'message']
    readonly_fields = ['created_at']
