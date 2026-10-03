# Architecture Overview

Expo / React Native mobile client
  -> HTTPS REST API
NestJS / Node.js backend
  -> Mongoose ODM
MongoDB database

External integrations may include map deep links / map SDK, Expo push notifications and image storage.

Role-based access:
- SEEKER: public event discovery + personal saves/reminders/reports
- ORGANIZER: own event CRUD and management
- AUTHORITY: verification/reports/alerts
- GUIDE: tourist-support information
