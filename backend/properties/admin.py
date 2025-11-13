'''from django.contrib import admin
from .models import AgentProfile, Property, MediaProperty, Features, PropertyVisit


@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'agency_name', 'phone', 'verified', 'subscription_active', 'subscription_expires')
    search_fields = ('user__username', 'agency_name', 'phone')


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'price', 'type', 'status', 'is_published', 'created_at')
    search_fields = ('title', 'description', 'owner__username', 'city')
    list_filter = ('type', 'status', 'is_published')


@admin.register(MediaProperty)
class MediaPropertyAdmin(admin.ModelAdmin):
    list_display = ('id', 'caption')


@admin.register(Features)
class FeaturesAdmin(admin.ModelAdmin):
    list_display = ('features', 'property')
    search_fields = ('features',)


@admin.register(PropertyVisit)
class PropertyVisitAdmin(admin.ModelAdmin):
    list_display = ('property', 'visitor', 'scheduled_time', 'status')
    list_filter = ('status',)
    search_fields = ('property__title', 'visitor__username')
'''
from django.contrib import admin
from .models import AgentProfile, Property, MediaProperty

@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'agency_name', 'phone', 'verified', 'subscription_active', 'subscription_expires')
    search_fields = ('user__username', 'agency_name', 'phone')

    actions = ['activate_subscription', 'deactivate_subscription']


    def activate_subscription(self, request, queryset):
        from django.utils import timezone
        import datetime
        for agent in queryset:
            agent.subscription_active = True
            agent.subscription_expires = timezone.now() + datetime.timedelta(days=30)
            agent.save()
        self.message_user(request, "Selected agents' subscriptions activated for 1 month.")
    activate_subscription.short_description = "Activate subscription for 1 month"


    def deactivate_subscription(self, request, queryset):
        for agent in queryset:
            agent.subscription_active = False
            agent.subscription_expires = None
            agent.save()
        self.message_user(request, "Selected agents' subscriptions deactivated.")
    deactivate_subscription.short_description = "Deactivate subscription"


class MediaPropertyTabularInline(admin.TabularInline):
    model = MediaProperty
    
#class FeaturesTabularInline(admin.TabularInline):
   #model = Features

@admin.register(Property)
class PropertyInline(admin.ModelAdmin):
    list_display = ('title','price', 'location', 'created_at')
    list_filter = ('city', 'created_at')
    search_fields = ('title', 'description', 'city', 'location')
    inlines = [MediaPropertyTabularInline]

