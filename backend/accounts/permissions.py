from rest_framework.permissions import BasePermission
from .roles import is_agent, is_admin


class IsAgent(BasePermission):
    """Allow access only to users in the 'agent' group (or superusers)."""

    def has_permission(self, request, view):
        user = request.user
        if not user or user.is_anonymous:
            return False
        return is_agent(user) or is_admin(user)


class IsAdmin(BasePermission):
    """Allow access only to superusers."""

    def has_permission(self, request, view):
        user = request.user
        if not user or user.is_anonymous:
            return False
        return is_admin(user)
