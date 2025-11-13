from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsAdmin
from datetime import timedelta
from .models import Profile
from properties.models import AgentProfile, Property
from .serializers import UserSerializer, UserProfileSerializer, AgentProfileSerializer
from .forms import SignupForm, ActivationForm
from .roles import get_user_role


class UserManagementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    # Only superusers (admin) should manage users
    permission_classes = [IsAdmin]
    
    def get_queryset(self):
        queryset = User.objects.all().select_related('profile')
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role == 'agent':
            queryset = queryset.filter(groups__name='agent')
        elif role == 'user':
            queryset = queryset.exclude(groups__name='agent').exclude(is_superuser=True)
        elif role == 'admin':
            queryset = queryset.filter(is_superuser=True)
        
        # Search by username or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset.order_by('-date_joined')
    
    @action(detail=True, methods=['post'])
    def toggle_agent_status(self, request, pk=None):
        """Toggle agent status for a user"""
        user = self.get_object()
        agent_group = Group.objects.get(name='agent')
        
        if user.groups.filter(name='agent').exists():
            user.groups.remove(agent_group)
            # Deactivate agent profile if exists
            try:
                agent_profile = user.agentprofile
                agent_profile.subscription_active = False
                agent_profile.save()
            except:
                pass
            message = f"{user.username} is no longer an agent"
        else:
            user.groups.add(agent_group)
            # Create agent profile if doesn't exist
            AgentProfile.objects.get_or_create(user=user)
            message = f"{user.username} is now an agent"
        
        return Response({'message': message})
    
    @action(detail=True, methods=['post'])
    def toggle_active_status(self, request, pk=None):
        """Toggle active status for a user"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        status_text = "activated" if user.is_active else "deactivated"
        return Response({'message': f"{user.username} has been {status_text}"})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'agents': User.objects.filter(groups__name='agent').count(),
            'admins': User.objects.filter(is_superuser=True).count(),
            'users_with_profiles': User.objects.filter(profile__isnull=False).count(),
            'recent_signups': User.objects.filter(
                date_joined__gte=timezone.now() - timedelta(days=30)
            ).count(),
        }
        # Monthly signup stats (last 6 months approximate)
        monthly_stats = []
        for i in range(6):
            month_start = timezone.now() - timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            count = User.objects.filter(
                date_joined__gte=month_start,
                date_joined__lt=month_end
            ).count()
            monthly_stats.append({
                'month': month_start.strftime('%b'),
                'count': count
            })

        stats['monthly_signups'] = monthly_stats

        return Response(stats)

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return Profile.objects.all()
        else:
            return Profile.objects.filter(user=self.request.user)
    
    def get_object(self):
        if self.request.user.is_superuser:
            return super().get_object()
        else:
            return self.request.user.profile
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save()

class AgentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = AgentProfileSerializer
    # Only authenticated agents or admins can access agent profile endpoints
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return AgentProfile.objects.all()
        else:
            return AgentProfile.objects.filter(user=self.request.user)
    
    def get_object(self):
        if self.request.user.is_superuser:
            return super().get_object()
        else:
            return self.request.user.agentprofile
    
    @action(detail=True, methods=['post'])
    def verify_agent(self, request, pk=None):
        """Verify an agent (admin only)"""
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        agent_profile = self.get_object()
        agent_profile.verified = True
        agent_profile.save()
        
        return Response({'message': f"Agent {agent_profile.user.username} has been verified"})
    
    @action(detail=True, methods=['post'])
    def activate_subscription(self, request, pk=None):
        """Activate agent subscription (admin only)"""
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        agent_profile = self.get_object()
        agent_profile.subscription_active = True
        agent_profile.subscription_expires = timezone.now() + timedelta(days=30)
        agent_profile.save()
        
        return Response({'message': f"Subscription activated for {agent_profile.user.username}"})


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        """Allow clients to POST either {'username','password'} or {'email','password'}.

        If 'email' is provided, we try to resolve the username and proceed with the standard
        token serializer flow. This keeps frontend callers that send 'email' working.
        """
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'email' in data and 'username' not in data:
            from django.contrib.auth import get_user_model
            UserModel = get_user_model()
            try:
                u = UserModel.objects.get(email__iexact=data.get('email'))
                data['username'] = u.get_username()
            except UserModel.DoesNotExist:
                # leave username absent so the serializer will return the usual error
                pass

        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_user_routes(request):
    routes = [
        '/api/token/',
        '/api/token/refresh/',
    ]
    return Response(routes)


from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auth_logout(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        return Response(status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    # Minimal registration implementation (replaces missing RegisterSerializer)
    data = request.data or {}
    username = data.get('username')
    # Support both 'password' and Django-style 'password1'/'password2' fields from frontend
    password = data.get('password') or data.get('password1')
    email = data.get('email')
    is_agent = bool(data.get('is_agent'))

    if not username or not password:
        return Response({'error': 'username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # If password1/password2 provided, ensure they match
    if data.get('password1') and data.get('password2') and data.get('password1') != data.get('password2'):
        return Response({'error': 'passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.is_active = False
    user.save()

    # If requested, add agent group and create AgentProfile
    if is_agent:
        agent_group, _ = Group.objects.get_or_create(name='agent')
        user.groups.add(agent_group)
        # create AgentProfile if not exists
        try:
            AgentProfile.objects.get_or_create(user=user)
        except Exception:
            pass

    # Send activation email with profile code (Profile created via signal)
    try:
        profile = user.profile
        send_mail(
            'Activate Your Account',
            f'Welcome {username}\nUse this code {profile.code} to activate your account.',
            settings.EMAIL_HOST_USER,
            [email] if email else [],
            fail_silently=True,
        )
    except Exception:
        # Non-fatal if email/profile unavailable
        pass

    return Response({'message': 'User created successfully. Please check your email to activate your account.'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get user profile"""
    try:
        user = request.user
        profile = getattr(user, 'profile', None)
        
        # Determine user role using central helper
        role = get_user_role(user)
        
        profile_data = {}
        if profile:
            profile_data = {
                'name': profile.name,
                'phone_number': profile.phone_number,
                'address': profile.address,
                'image': profile.image.url if profile.image else None,
            }
        # Include agent subscription info if available
        is_agent_flag = user.groups.filter(name='agent').exists()
        subscription_info = {
            # Backwards-compatible keys
            'is_agent': is_agent_flag,
            'subscription_active': False,
            'subscription_expires': None,
            # Frontend-friendly keys
            'is_active': False,
            'trial_end_date': None,
        }
        if is_agent_flag:
            agent_profile = AgentProfile.objects.filter(user=user).first()
            if agent_profile:
                subscription_info['subscription_active'] = bool(agent_profile.subscription_active)
                subscription_info['subscription_expires'] = agent_profile.subscription_expires
                # Map to frontend expected keys
                subscription_info['is_active'] = bool(agent_profile.subscription_active)
                subscription_info['trial_end_date'] = (
                    agent_profile.subscription_expires.isoformat() if agent_profile.subscription_expires else None
                )
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': role,
            'isAuthenticated': True,
            'is_superuser': user.is_superuser,
            # keep is_agent top-level for frontend compatibility
            'is_agent': is_agent_flag,
            'groups': list(user.groups.values_list('name', flat=True)),
            'profile': profile_data,
            'subscription': subscription_info,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update user profile"""
    try:
        user = request.user
        profile = getattr(user, 'profile', None)
        
        if not profile:
            return Response({'error': 'Profile not found'}, status=404)

        data = request.data or {}

        # Update profile fields
        if 'name' in data:
            profile.name = data.get('name')
        if 'phone_number' in data:
            profile.phone_number = data.get('phone_number')
        if 'address' in data:
            profile.address = data.get('address')

        profile.save()

        return Response({'message': 'Profile updated successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


def signup(request):
    """Register a new user. Creates an inactive user and sends activation code via email."""
    if request.method == 'POST':
        form = SignupForm(request.POST, request.FILES)
        if form.is_valid():
            username = form.cleaned_data['username']
            email = form.cleaned_data['email']

            user = form.save(commit=False)
            user.is_active = False
            user.save()  # The signal should create the Profile here

            # If the registrant asked to be an agent, add them to the agent group
            try:
                if form.cleaned_data.get('is_agent'):
                    agent_group, _ = Group.objects.get_or_create(name='agent')
                    user.groups.add(agent_group)
            except Exception:
                # Non-fatal: don't block signup if group logic fails
                pass

            profile = user.profile

            # Send an activation email
            send_mail(
                "Activate Your Account",
                f"Welcome {username}\nUse this code {profile.code} to activate your account.",
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            return redirect(f'/accounts/{username}/activate')

    else:
        form = SignupForm()
    return render(request, 'registration/register.html', {'form': form})


def activate(request, username):
    """Activate a user when they submit the activation code."""
    user = get_object_or_404(User, username=username)
    profile = user.profile

    if request.method == 'POST':
        form = ActivationForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            if code == profile.code:
                profile.code = ''
                profile.save()

                user.is_active = True
                user.save()

                return redirect('/accounts/login')
    else:
        form = ActivationForm()

    return render(request, 'registration/activate.html', {'form': form})


@login_required
def Profile(request):
    """Render the logged-in user's profile and their properties."""
    user_pk = request.user.pk
    profile = User.objects.get(pk=user_pk)
    properties = Property.objects.filter(owner=user_pk)
    return render(request, 'account/profile.html',
                  {'profile': profile, 'propertys': properties, 'request': request})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_ollama3_text(request):
    """Placeholder endpoint for GPT text generation (not implemented).

    Kept for compatibility with existing URL routes. Returns HTTP 501.
    """
    return Response({'error': 'generate_ollama3_text is not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)