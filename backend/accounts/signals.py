from django.contrib.auth.models import Group
from django.db.models.signals import post_migrate, m2m_changed
from django.dispatch import receiver
from django.conf import settings
from properties.models import AgentProfile
from .models import Profile

@receiver(m2m_changed, sender=settings.AUTH_USER_MODEL.groups.through)
def create_agent_profile_on_group_add(sender, instance, action, pk_set, **kwargs):
    if action == "post_add":
        agent_group = Group.objects.filter(name="agent").first()
        if not agent_group:
            return
        if agent_group.pk in pk_set:
            # Ensure Profile exists
            profile, _ = Profile.objects.get_or_create(user=instance)
            AgentProfile.objects.get_or_create(user=instance, profile=profile)

@receiver(post_migrate)
def create_default_groups(sender, **kwargs):
    """Create default groups if they don't exist.

    This runs after migrations. We keep it idempotent and simple: always
    ensure the groups exist. Avoid depending on sender name because
    post_migrate may be emitted for many apps.
    """
    Group.objects.get_or_create(name='owner')  # Project owner
    Group.objects.get_or_create(name='agent')  # middleman
    Group.objects.get_or_create(name='buyer')  # Normal user