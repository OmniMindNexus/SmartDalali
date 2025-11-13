from django.test import TestCase
from django.contrib.auth.models import User
from properties.models import Property, AgentProfile
from .models import Payment
from django.urls import reverse

class PaymentStatusTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='test', password='pass')
        self.listing_owner = User.objects.create_user(username='owner', password='pass')
        self.listing = Property.objects.create(owner=self.listing_owner, title='L', description='d', type='House', price=100, city='c', area=100, rooms=3, bathrooms=2, garages=1)
        self.payment = Payment.objects.create(user=self.user, property=self.listing, method='mpesa', amount=100)

    def test_payment_status_requires_auth(self):
        url = reverse('payment_status', args=[self.payment.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 302)  # redirects to login

    def test_payment_status_authenticated(self):
        self.client.login(username='test', password='pass')
        url = reverse('payment_status', args=[self.payment.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('status', resp.json())