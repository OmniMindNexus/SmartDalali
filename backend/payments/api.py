from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Payment
from django.db.models import Q
from rest_framework.decorators import action
from .serializers import PaymentSerializer, SubscriptionPaymentSerializer
import json
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
from datetime import datetime
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied

User = get_user_model()

class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        """Filter payments based on user role."""
        user = self.request.user
        if user.is_superuser:
            return Payment.objects.all().order_by('-created_at')
        elif user.groups.filter(name='agent').exists():
            # Agents see payments related to their properties
            return Payment.objects.filter(
                Q(user=user) |  # Their own payments
                Q(property__owner=user)  # Payments for properties they own
            ).order_by('-created_at')
        else:
            # Regular users see only their own payments
            return Payment.objects.filter(user=user).order_by('-created_at')

    def list(self, request):
        """Return paginated list of payments with related data."""
        payments = self.get_queryset()
        data = [{
            'id': payment.id,
            'user': {
                'id': payment.user.id,
                'username': payment.user.username,
                'email': payment.user.email,
            },
            'property': {
                'id': payment.property.id,
                'title': payment.property.title,
            } if payment.property else None,
            'method': payment.method,
            'amount': str(payment.amount),
            'status': payment.status,
            'transaction_id': payment.transaction_id,
            'created_at': payment.created_at.isoformat(),
        } for payment in payments]
        return Response(data)

    @action(detail=False, methods=['get'])
    def subscription(self, request):
        """Get subscription plans and pricing."""
        # TODO: Move to settings/config when ready for production
        plans = {
            'monthly': {
                'id': 'monthly',
                'name': 'Monthly Plan',
                'price': 50000,
                'description': 'Perfect for getting started',
                'features': [
                    'Unlimited property listings',
                    'Priority customer support',
                    'Advanced analytics',
                    'Featured listing priority'
                ],
                'duration': 30  # days
            },
            'annual': {
                'id': 'annual',
                'name': 'Annual Plan',
                'price': 500000,
                'description': 'Best value for serious agents',
                'features': [
                    'Everything in Monthly plan',
                    '2 months free',
                    'Featured listings priority',
                    'Dedicated account manager'
                ],
                'duration': 365  # days
            }
        }
        return Response(plans)

    @action(detail=False, methods=['get'])
    def admin_list(self, request):
        """Get all payments for admin panel with extended details."""
        if not request.user.is_superuser:
            raise PermissionDenied("Only administrators can access this endpoint")
        
        payments = Payment.objects.all().order_by('-created_at')
        data = [{
            'id': payment.id,
            'transactionId': payment.transaction_id,
            'amount': float(payment.amount),
            'status': payment.status,
            'type': payment.method,
            'user': f"{payment.user.first_name} {payment.user.last_name}" if payment.user.first_name else payment.user.username,
            'date': payment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'property': payment.property.title if payment.property else None,
        } for payment in payments]
        return Response(data)

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retry a failed payment."""
        if not request.user.is_superuser:
            raise PermissionDenied("Only administrators can retry payments")

        payment = self.get_object()
        if payment.status != 'failed':
            return Response(
                {"error": "Only failed payments can be retried"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Implement retry logic based on payment method
        if payment.method == 'mpesa':
            # TODO: Implement M-Pesa retry logic
            pass
        elif payment.method == 'stripe':
            # TODO: Implement Stripe retry logic
            pass

        # For now, just mark as pending to simulate retry
        payment.status = 'pending'
        payment.save()
        
        return Response({"status": "Payment retry initiated"})

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Generate and download a payment receipt."""
        if not request.user.is_superuser:
            raise PermissionDenied("Only administrators can download receipts")

        payment = self.get_object()
        if payment.status != 'completed':
            return Response(
                {"error": "Receipts are only available for completed payments"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate receipt HTML
        context = {
            'payment': payment,
            'date': payment.created_at.strftime('%Y-%m-%d'),
            'receipt_no': f"RCP-{payment.id}",
            'company_name': 'SmartDalali',
            'company_email': 'support@smartdalali.com',
        }
        
        html_string = render_to_string('payments/receipt_template.html', context)
        
        # Convert to PDF
        pdf_file = HTML(string=html_string).write_pdf()
        
        # Prepare response
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt-{payment.id}.pdf"'
        
        return response