from django.test import TestCase
from django.contrib.auth.models import User
from accounts.models import Profile
from properties.models import AgentProfile, Property, Features
from properties.serializers import SerializerProperty
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory
from django.utils.datastructures import MultiValueDict
from types import SimpleNamespace


class PropertySerializerTest(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='test_agent', password='pass')
		# ensure profile
		try:
			_ = self.user.profile
		except Exception:
			Profile.objects.create(user=self.user)
		AgentProfile.objects.get_or_create(user=self.user, profile=self.user.profile)

	def test_property_serialization_includes_features_and_agent(self):
		prop = Property.objects.create(
			owner=self.user,
			title='Unit Test Property',
			description='A test property',
			price=123.45,
			type='House',
			area=75.0,
			rooms=2,
			bedrooms=1,
			bathrooms=1,
			city='TestCity'
		)
		Features.objects.create(property=prop, features='Garden')

		serializer = SerializerProperty(prop, context={'request': None})
		data = serializer.data

		# Basic assertions
		self.assertEqual(data['title'], 'Unit Test Property')
		self.assertIn('Features_Property', data)
		self.assertTrue(any(f.get('features') == 'Garden' for f in data['Features_Property']))
		self.assertIn('agent', data)
		self.assertEqual(data['agent']['username'], 'test_agent')

	def test_property_update_replaces_features_and_updates_fields(self):
		prop = Property.objects.create(
			owner=self.user,
			title='To Update',
			description='Before update',
			price=50.00,
			type='House',
			area=60.0,
			rooms=1,
			bedrooms=1,
			bathrooms=1,
			city='OldCity'
		)
		Features.objects.create(property=prop, features='Garden')

		update_data = {
			'title': 'Updated Title',
			'city': 'NewCity',
			'Features_Property': [
				{'features': 'Pool'},
				{'features': 'Garage'},
			]
		}

		serializer = SerializerProperty(prop, data=update_data, partial=True, context={'request': None})
		self.assertTrue(serializer.is_valid(), serializer.errors)
		updated = serializer.save()

		# Refresh from DB
		prop.refresh_from_db()
		self.assertEqual(prop.title, 'Updated Title')
		self.assertEqual(prop.city, 'NewCity')
		feats = list(prop.Features_Property.values_list('features', flat=True))
		self.assertCountEqual(feats, ['Pool', 'Garage'])

	def test_media_upload_creates_mediaproperty(self):
		factory = APIRequestFactory()
		# create uploaded file
		image = SimpleUploadedFile('test.jpg', b'filecontent', content_type='image/jpeg')

		data = {
			'title': 'Upload Test',
			'description': 'Has media',
			'price': 10.0,
			'type': 'House',
			'area': 50.0,
			'rooms': 1,
			'bedrooms': 1,
			'bathrooms': 1,
			'city': 'ImgCity'
		}

		# include the uploaded file in the POST data so APIRequestFactory places it in request.FILES
		# Build a multipart request and attach the file to request.FILES manually
		# create a simple dummy request object with FILES and POST dicts
		dummy_request = SimpleNamespace()
		dummy_request.user = self.user
		dummy_request.FILES = MultiValueDict({'MediaProperty': [image]})
		dummy_request.POST = MultiValueDict()

		serializer = SerializerProperty(data=data, context={'request': dummy_request})
		self.assertTrue(serializer.is_valid(), serializer.errors)
		prop = serializer.save(owner=self.user)

		self.assertTrue(prop.MediaProperty.exists())
		media = prop.MediaProperty.first()
		# ensure file name saved (backend storage may vary)
		self.assertIn('test.jpg', getattr(media.Images, 'name', ''))
