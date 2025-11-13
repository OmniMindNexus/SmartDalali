from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from datetime import timezone
from django.contrib.gis.db import models
from django.core.validators import FileExtensionValidator

PROPERTY_TYPES = (
        ('House', 'House'),
        ('Apartment', 'Apartment'),
        ('Office', 'Office'),
        ('Land', 'Land'),
        ('Villa', 'Villa'),
        ('Shop', 'Shop'),
        ('Warehouse', 'Warehouse')
)

STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('sold', 'Sold'),
        ('rented', 'Rented'),
)


class AgentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agentprofile')
    profile = models.OneToOneField('accounts.Profile', on_delete=models.CASCADE)
    agency_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    verified = models.BooleanField(default=False)
    subscription_active = models.BooleanField(default=False)
    subscription_expires = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.user.username
    
    class Meta:
        app_label = 'properties'


class Property(models.Model):
    #basic property informations
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    
    #Property details
    type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    area = models.FloatField(help_text="In square meters", null=True, blank=False)
    rooms = models.IntegerField(null=False, blank=False)
    bedrooms = models.IntegerField(null=False, blank=False)
    bathrooms = models.IntegerField(null=False, blank=False)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    parking = models.BooleanField(default=False)
    year_built = models.DateTimeField(null=True, blank=True)
    
    #location
    city = models.CharField(max_length=100)
    adress = models.CharField(max_length=300, blank=True)
    location = models.PointField(default='POINT(34.888822 -6.369028)')
    latitude = models.DecimalField(max_digits=20, decimal_places=12, null=True, blank=True)
    longitude = models.DecimalField(max_digits=20, decimal_places=12, null=True, blank=True)
    
    # Publishing & Business Logic
    is_published = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=False)
    featured_until = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    view_count = models.PositiveIntegerField(default=0)
    owner = models.ForeignKey(User, related_name='property_owner', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_lat_lng(self):
        """Extract latitude and longitude from the location field."""
        if self.location:
            lat_lng = self.location.split(',')
            if len(lat_lng) == 2:
                return lat_lng[0], lat_lng[1]
        return '0', '0'  # default values


    def __str__(self):
        return self.title
    
    class Meta:
        app_label = 'properties'
        
class MediaProperty(models.Model):
    property = models.ForeignKey(Property, related_name="MediaProperty", on_delete=models.CASCADE, null=True, blank=True)
    Images = models.ImageField(upload_to='property_images/', null=True, blank=False)
    videos = models.FileField(upload_to='property_videos', null=True, blank=False)
    caption = models.TextField(max_length=100, blank=True, 
                               validators = [FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi', 'webm'])]
                               )

    class Meta:
        app_label = 'properties'
        
class Features(models.Model):
    features = models.CharField(max_length=100)
    property = models.ForeignKey(Property,related_name="Features_Property", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        app_label = 'properties'

class PropertyVisit(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='visits')
    visitor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='property_visits')
    scheduled_time = models.DateTimeField()
    status_choices = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=status_choices, default='pending')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Visit to {self.property.title} by {self.visitor.username} on {self.scheduled_time}"

    class Meta:
        app_label = 'properties'
        ordering = ['scheduled_time']
