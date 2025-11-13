from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from django.conf import settings
from properties.models import Property, AgentProfile
from .models import Payment
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stk_push(request, property_id):
	property = get_object_or_404(Property, id=property_id)
	phone = request.data.get('phone')
	amount = request.data.get('amount')
	callback_url = request.build_absolute_uri('/api/payments/mpesa/callback/')

	# Import Mpesa client lazily to avoid import-time errors when django_daraja is not installed
	try:
		from django_daraja.mpesa.core import MpesaClient
	except Exception as e:
		return Response({'error': 'Mpesa client not available', 'details': str(e)}, status=501)

	try:
		mpesa_client = MpesaClient(settings.DAR_AFFILIATE_CONSUMER_KEY, settings.DAR_AFFILIATE_CONSUMER_SECRET)
		response = mpesa_client.stk_push(
			amount=amount,
			phone_number=phone,
			account_reference=f"Property-{property.id}",
			transaction_desc=f"Pay for property {property.id}",
			callback_url=callback_url,
			business_shortcode=settings.DAR_SHORTCODE,
			passkey=settings.DAR_PASSKEY
		)
	except Exception as e:
		return Response({'error': 'Failed to send STK push', 'details': str(e)}, status=502)

	Payment.objects.create(
		user=request.user,
		property=property,
		method='mpesa',
		amount=amount,
		status='pending',
		raw_payload=response
	)
	return Response(response)

@csrf_exempt
def mpesa_callback(request):
	payload = json.loads(request.body.decode('utf-8'))
	# TODO: verify payload structure per Daraja docs
	# Find payment and update status
	transaction_id = payload.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')
	result_code = payload.get('Body', {}).get('stkCallback', {}).get('ResultCode')
	payment = Payment.objects.filter(transaction_id=transaction_id).first()
	if payment:
		payment.status = 'success' if result_code == 0 else 'failed'
		payment.raw_payload = payload
		payment.save()
		# If successful, activate agent subscription
		if result_code == 0 and payment.property:
			agent_profile = AgentProfile.objects.filter(user=payment.property.owner).first()
			if agent_profile:
				agent_profile.subscription_active = True
				# Set expiry to 1 month from now (or extend if already active)
				from django.utils import timezone
				import datetime
				now = timezone.now()
				if agent_profile.subscription_expires and agent_profile.subscription_expires > now:
					agent_profile.subscription_expires += datetime.timedelta(days=30)
				else:
					agent_profile.subscription_expires = now + datetime.timedelta(days=30)
				agent_profile.save()
	return JsonResponse({'status': 'received'})

# Create your views here.


from rest_framework.decorators import api_view
from django.contrib.auth.decorators import login_required


@api_view(['GET'])
@login_required
def payment_status(request, payment_id):
	"""Return payment status so frontend can poll for completion."""
	payment = get_object_or_404(Payment, id=payment_id)
	data = {
		'id': payment.id,
		'status': payment.status,
		'transaction_id': payment.transaction_id,
		'amount': str(payment.amount),
		'method': payment.method,
		'property_id': payment.property.id if payment.property else None,
		'raw_payload': payment.raw_payload,
	}
	return Response(data)