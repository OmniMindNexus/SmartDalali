from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
from properties.models import AgentProfile
from .roles import get_user_role

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    agent_profile = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    groups = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser', 'date_joined',
            'last_login', 'profile', 'agent_profile', 'role', 'groups'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'name': profile.name,
                'phone_number': profile.phone_number,
                'address': profile.address,
                'image': profile.image.url if profile.image else None,
                'code': profile.code,
                'created_at': profile.created_at
            }
        except:
            return None
    
    def get_agent_profile(self, obj):
        try:
            agent_profile = obj.agentprofile
            return {
                'agency_name': agent_profile.agency_name,
                'phone': agent_profile.phone,
                'verified': agent_profile.verified,
                'subscription_active': agent_profile.subscription_active,
                'subscription_expires': agent_profile.subscription_expires
            }
        except:
            return None
    
    def get_role(self, obj):
        # Use centralized role helper
        return get_user_role(obj)

class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'name', 'phone_number', 'address', 'image', 'code', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'code', 'created_at', 'password']

class AgentProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    property_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AgentProfile
        fields = [
            'id', 'user', 'user_email', 'user_username', 'agency_name', 'phone',
            'verified', 'subscription_active', 'subscription_expires',
            'first_name', 'last_name', 'property_count'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'user_username', 'first_name', 'last_name']
    
    def get_property_count(self, obj):
        from properties.models import Property
        return Property.objects.filter(owner=obj.user).count()