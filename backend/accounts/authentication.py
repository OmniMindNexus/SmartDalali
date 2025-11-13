from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from django.contrib.auth.models import User


class JWTAuthentication(BaseAuthentication):
    """JWT authentication using HS256 and SECRET_KEY.

    Supports Authorization: Bearer <token> with payload containing:
    { 'user_id': <id>, 'type': 'access', 'exp': <ts>, 'iat': <ts> }
    """

    keyword = 'bearer'

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != self.keyword:
            return None

        token = parts[1]
        # payload = decode_token(token) # This was the custom decode_token
        # if not payload:
        #     raise exceptions.AuthenticationFailed('Invalid or expired token')

        # token_type = payload.get('type')
        # if token_type != 'access':
        #     raise exceptions.AuthenticationFailed('Invalid token type')

        # user_id = payload.get('user_id')
        # if not isinstance(user_id, int):
        #     raise exceptions.AuthenticationFailed('Invalid token payload')

        # try:
        #     user = User.objects.get(pk=user_id)
        # except User.DoesNotExist:
        #     raise exceptions.AuthenticationFailed('User not found')

        # if not user.is_active:
        #     raise exceptions.AuthenticationFailed('User inactive')

        # return (user, None)
        raise exceptions.AuthenticationFailed('Custom JWT authentication is disabled. Use simplejwt.')