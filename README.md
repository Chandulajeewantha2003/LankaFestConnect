# LankaFest Connect - Milestone 03 App Structure

This repository structure is prepared for IT3060 HCI Milestone 03.

## Planned stack
- Mobile frontend: React Native + Expo + TypeScript
- Backend API: NestJS on Node.js + TypeScript
- Database: MongoDB
- ODM: Mongoose
- Authentication: JWT + password hashing
- Maps/location: React Native Maps / external map deep links
- Notifications: Expo Notifications

> No packages or `node_modules` are included in this ZIP. Install dependencies after agreeing on exact package versions.

## Main role flows
1. Event Seeker - discover/search/filter events, view details, directions, save/reminders, notifications.
2. Event Organizer - create and manage event listings, schedule/location, media/pricing, status updates and insights.
3. Tourism Authority / Guide - review/verify events, manage reports, publish alerts and provide tourist-support information.

## Repository setup later
1. Install frontend dependencies inside `frontend/`.
2. Install backend dependencies inside `backend/`.
3. Set up MongoDB, copy `backend/.env.example` to `backend/.env`, and configure `MONGODB_URI`.
4. Configure frontend API base URL in `frontend/.env`.
5. Seed MongoDB when a seed script is available.
6. Start backend, then start Expo frontend.

See `docs/IMPLEMENTATION_PLAN.md` and `docs/API_ENDPOINTS.md`.
