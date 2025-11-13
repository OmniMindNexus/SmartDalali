from django.db import models
from django.conf import settings
from properties.models import Property

class Payment(models.Model):
	PAYMENT_METHODS = (
		('mpesa', 'M-Pesa'),
		('stripe', 'Stripe'),
	)

	PAYMENT_STATUS = (('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'))

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	# The DB currently has a `listing_id` column (legacy). Map the model field to that
	# column so the admin and ORM don't fail while we create a proper migration to
	# reconcile listings vs property relation.
	property = models.ForeignKey(
		Property,
		on_delete=models.CASCADE,
		# Use default db column name (property_id). The DB column was renamed to
		# `property_id` manually, so don't override `db_column` here.
		null=True,
		blank=True,
	)
	method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	transaction_id = models.CharField(max_length=128, blank=True)
	status = models.CharField(max_length=32, choices=PAYMENT_STATUS)
	raw_payload = models.JSONField(blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.method} {self.amount} {self.status}"