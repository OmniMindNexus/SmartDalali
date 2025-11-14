# SmartDalaliTZ — Frontend integration (Material UI + TypeScript)

This branch adds a Material-UI based frontend scaffold integrated with:
- Backend-first Google authentication (Django handles Google OAuth)
- Role-based dashboards (superuser, agent, user)
- Geospatial map view using react-leaflet
- API client using axios with cookie/session support

Environment variables:
- REACT_APP_API_BASE (e.g. http://localhost:8000)

Backend endpoints required:
- GET /api/me/ -> { id, username, email, role }
- GET /api/properties/ -> list of properties with lat & lng (or /api/properties/geojson/)
- POST /accounts/google/login/ -> Django social login start (redirect)
- POST /logout/ -> clear session
- GET /api/analytics/summary/ -> aggregated data for admin charts (optional)

Run (frontend):
1. cd SmartDalaliTZ (frontend folder)
2. npm install
3. npm start

Django notes:
- Use django-allauth or python-social-auth for Google OAuth2 (backend-first).
- Implement /api/me/ for the current user and expose 'role' to the frontend.
- Recommended: PostGIS for spatial queries if you need bounding-box or proximity search.
