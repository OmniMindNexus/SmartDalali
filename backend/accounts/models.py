from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from utils.generate_code import generate_code

class Profile(models.Model):
    user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
    name = models.CharField(max_length=50, blank=True, null=True)
    about = models.CharField(max_length=1000, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)
    image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    code = models.CharField(max_length=8, default=generate_code)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


# Proxy model to present AgentProfile under the `accounts` app in Django admin
try:
    from properties.models import AgentProfile as _AgentProfile

    class AgentProfileProxy(_AgentProfile):
        class Meta:
            proxy = True
            app_label = 'accounts'
            verbose_name = 'Agent Profile'
            verbose_name_plural = 'Agent Profiles'

except Exception:
    # properties app or AgentProfile may not be importable at import time in some test contexts
    AgentProfileProxy = None

# Create or update Profile when User is created or saved
@receiver(post_save, sender=User)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    # If the User is updated, ensure the Profile is also saved
    instance.profile.save()

# post_save.connect(create_or_update_profile, sender=User)