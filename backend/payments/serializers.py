from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'user', 'property', 'method', 'amount', 'status', 'transaction_id', 'created_at']
        read_only_fields = ['id', 'created_at']

class SubscriptionPaymentSerializer(serializers.Serializer):
    """For handling subscription payment requests."""
    plan = serializers.ChoiceField(choices=['monthly', 'annual'])
    phone = serializers.CharField(max_length=20)  # For M-Pesa number