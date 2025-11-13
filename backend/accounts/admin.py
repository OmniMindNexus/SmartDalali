from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Profile, AgentProfileProxy
from properties.models import AgentProfile as PropertiesAgentProfile

class AgentProfileInline(admin.StackedInline):
    # continue to inline the real AgentProfile on the User edit page
    model = PropertiesAgentProfile
    can_delete = False
    verbose_name_plural = 'Agent Profiles'
    fk_name = 'user'

class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number', 'name', 'address']
    search_fields = ['user__username', 'phone_number', 'name']

class UserAdmin(BaseUserAdmin):
    inlines = [AgentProfileInline]
    list_display = ('username', 'email', 'is_staff', 'is_superuser', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'email')

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)

# Register the AgentProfile proxy under accounts so admin shows a single logical place
if AgentProfileProxy is not None:
    try:
        admin.site.register(AgentProfileProxy, admin.ModelAdmin)
        # Unregister the original registration in properties.admin if present to avoid duplicate top-level listings
        try:
            admin.site.unregister(PropertiesAgentProfile)
        except Exception:
            # If properties already registered it may not be loaded yet; properties.admin still may register later.
            pass
    except Exception:
        # If registering the proxy fails for any reason, skip silently — keep the existing registrations.
        pass