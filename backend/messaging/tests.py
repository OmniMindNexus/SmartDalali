from django.test import TestCase
from django.contrib.auth.models import User
from messaging.models import Conversation, Message, MessageNotification
from messaging.serializers import CreateMessageSerializer
from rest_framework.test import APIRequestFactory


class MessagingTests(TestCase):
	def setUp(self):
		self.u1 = User.objects.create_user(username='alice', password='pass')
		self.u2 = User.objects.create_user(username='bob', password='pass')
		self.conv = Conversation.objects.create()
		self.conv.participants.add(self.u1, self.u2)

	def test_create_message_creates_notification(self):
		factory = APIRequestFactory()
		request = factory.post('/api/messages/', {'content': 'Hello'})
		request.user = self.u1

		serializer = CreateMessageSerializer(data={'content': 'Hello'}, context={'conversation': self.conv, 'request': request})
		self.assertTrue(serializer.is_valid(), serializer.errors)
		msg = serializer.save()

		# Message created
		self.assertEqual(Message.objects.filter(conversation=self.conv).count(), 1)
		# Notification created for other participant (bob)
		self.assertTrue(MessageNotification.objects.filter(user=self.u2, message=msg).exists())
