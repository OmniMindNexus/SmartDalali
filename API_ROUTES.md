# API_ROUTES.md

| Route | Methods | View | Name |
|---|---|---|---|
| `/admin/` | N/A | django.contrib.admin.sites.index | admin:index |
| `/api/v1/accounts/users/` | GET,POST | apps.accounts.viewsets.UserManagementViewSet | user-list |
| `/api/v1/accounts/users/{pk}/` | GET,PUT,PATCH,DELETE | apps.accounts.viewsets.UserManagementViewSet | user-detail |
| `/api/v1/accounts/users/{pk}/toggle_agent_status/` | POST | apps.accounts.viewsets.UserManagementViewSet | user-toggle-agent-status |
| `/api/v1/accounts/users/{pk}/toggle_active_status/` | POST | apps.accounts.viewsets.UserManagementViewSet | user-toggle-active-status |
| `/api/v1/accounts/users/stats/` | GET | apps.accounts.viewsets.UserManagementViewSet | user-stats |
| `/api/v1/accounts/profiles/` | GET,POST | apps.accounts.viewsets.UserProfileViewSet | profile-list |
| `/api/v1/accounts/profiles/{pk}/` | GET,PUT,PATCH,DELETE | apps.accounts.viewsets.UserProfileViewSet | profile-detail |
| `/api/v1/accounts/agent-profiles/` | GET,POST | apps.accounts.viewsets.AgentProfileViewSet | agent-profile-list |
| `/api/v1/accounts/agent-profiles/{pk}/` | GET,PUT,PATCH,DELETE | apps.accounts.viewsets.AgentProfileViewSet | agent-profile-detail |
| `/api/v1/accounts/agent-profiles/{pk}/verify_agent/` | POST | apps.accounts.viewsets.AgentProfileViewSet | agent-profile-verify-agent |
| `/api/v1/accounts/agent-profiles/{pk}/activate_subscription/` | POST | apps.accounts.viewsets.AgentProfileViewSet | agent-profile-activate-subscription |
| `/api/v1/accounts/token/` | POST | apps.accounts.viewsets.MyTokenObtainPairView | token_obtain_pair |
| `/api/v1/accounts/token/refresh/` | POST | rest_framework_simplejwt.views.TokenRefreshView | token_refresh |
| `/api/v1/accounts/logout/` | POST | apps.accounts.viewsets.auth_logout | auth_logout |
| `/api/v1/accounts/register/` | POST | apps.accounts.viewsets.register | register |
| `/api/v1/accounts/user-profile/` | GET | apps.accounts.viewsets.user_profile | user_profile |
| `/api/v1/accounts/user-profile/update/` | PUT | apps.accounts.viewsets.update_user_profile | update_user_profile |
| `/api/v1/accounts/routes/` | GET | apps.accounts.viewsets.get_user_routes | get_user_routes |
| `/api/v1/accounts/generate-ollama3-text/` | POST | apps.accounts.viewsets.generate_ollama3_text | generate_ollama3_text |
| `/api/v1/properties/properties/` | GET,POST | apps.properties.viewsets.PropertyViewSet | property-list |
| `/api/v1/properties/properties/{pk}/` | GET,PUT,PATCH,DELETE | apps.properties.viewsets.PropertyViewSet | property-detail |
| `/api/v1/properties/properties-media/` | GET,POST | apps.properties.viewsets.MediaPropertyViewSet | mediaproperty-list |
| `/api/v1/properties/properties-media/{pk}/` | GET,PUT,PATCH,DELETE | apps.properties.viewsets.MediaPropertyViewSet | mediaproperty-detail |
| `/api/v1/properties/property-visits/` | GET,POST | apps.properties.viewsets.PropertyVisitViewSet | propertyvisit-list |
| `/api/v1/properties/property-visits/{pk}/` | GET,PUT,PATCH,DELETE | apps.properties.viewsets.PropertyVisitViewSet | propertyvisit-detail |
| `/api/v1/messaging/conversations/` | GET,POST | apps.messaging.viewsets.ConversationViewSet | conversation-list |
| `/api/v1/messaging/conversations/{pk}/` | GET,PUT,PATCH,DELETE | apps.messaging.viewsets.ConversationViewSet | conversation-detail |
| `/api/v1/messaging/conversations/{pk}/messages/` | GET | apps.messaging.viewsets.ConversationViewSet | conversation-messages |
| `/api/v1/messaging/conversations/{pk}/send_message/` | POST | apps.messaging.viewsets.ConversationViewSet | conversation-send-message |