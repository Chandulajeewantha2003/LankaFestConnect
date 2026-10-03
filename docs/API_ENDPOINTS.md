# Planned REST API Endpoints

## Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

## Event Seeker
- GET /api/events
- GET /api/events/:id
- POST /api/events/:id/save
- DELETE /api/events/:id/save
- GET /api/saved-events
- POST /api/reminders
- PATCH /api/reminders/:id
- DELETE /api/reminders/:id
- GET /api/notifications
- POST /api/reports

## Organizer
- POST /api/events
- GET /api/organizer/events
- GET /api/events/:id
- PATCH /api/events/:id
- DELETE /api/events/:id
- POST /api/events/:id/duplicate

## Tourism Authority / Guide
- GET /api/authority/events?status=pending
- PATCH /api/authority/events/:id/verification
- GET /api/authority/reports
- PATCH /api/authority/reports/:id
- POST /api/alerts
- PATCH /api/alerts/:id
- GET /api/alerts
