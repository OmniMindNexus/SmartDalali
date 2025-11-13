from django.test import TestCase
from django.contrib.auth.models import User
from support.models import SupportTicket, TicketReply


class SupportTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='reporter', password='pass')

    def test_ticket_creation_generates_ticket_number(self):
        ticket = SupportTicket.objects.create(
            user=self.user,
            title='Help',
            description='Need help',
            category='other'
        )
        self.assertTrue(ticket.ticket_number.startswith('SD-'))
        self.assertEqual(ticket.user, self.user)

    def test_ticket_reply_created(self):
        ticket = SupportTicket.objects.create(
            user=self.user,
            title='Help',
            description='Need help',
            category='other'
        )
        reply = TicketReply.objects.create(ticket=ticket, user=self.user, message='I have an update')
        self.assertIn(reply, list(ticket.replies.all()))
