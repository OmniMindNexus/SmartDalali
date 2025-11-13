from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
	list_display = ('id', 'user', 'property', 'method', 'amount', 'status', 'created_at')
	search_fields = ('user__username', 'property__title', 'transaction_id')
	list_filter = ('method', 'status', 'created_at')

	actions = ['mark_reviewed', 'flag_payment']

	def mark_reviewed(self, request, queryset):
		queryset.update(status='reviewed')
		self.message_user(request, "Selected payments marked as reviewed.")
	mark_reviewed.short_description = "Mark selected payments as reviewed"

	def flag_payment(self, request, queryset):
		queryset.update(status='flagged')
		self.message_user(request, "Selected payments flagged.")
	flag_payment.short_description = "Flag selected payments"