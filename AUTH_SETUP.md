# Authentication and role flow

Frontend: Expo / React Native. Backend: NestJS + MongoDB.
Flow: Welcome → Login → Sign Up → Role Selection → role dashboard.
Registration creates the account with no role. Continue persists the chosen role.
Login returns to the saved dashboard; accounts without a role resume selection.
Roles: SEEKER, ORGANIZER, AUTHORITY. Event Authority / Guide is one combined role. Legacy GUIDE accounts migrate to AUTHORITY on backend startup with approval disabled.

## Run locally

1. Copy backend/.env.example to backend/.env. Set MONGODB_URI and a random JWT_SECRET (32+ characters). Start local MongoDB or use your Atlas URI.
2. In backend: npm install, then npm run start:dev. Development uses nodemon and ts-node to run source directly; restart any older Nest watcher after this change.
3. Create or edit frontend/.env. Set EXPO_PUBLIC_API_BASE_URL to http://YOUR_COMPUTER_LAN_IP:3000/api for a physical phone, http://10.0.2.2:3000/api for an Android emulator, or http://localhost:3000/api for web. The existing .env is ignored by Git.
4. In frontend: npm install, then npx expo start --go --lan --clear (or npm run web). The app uses SDK 57 for Expo Go SDK 57. Stop old Expo terminals before restarting.
5. Web origin defaults to http://localhost:8081; set backend CORS_ORIGIN to comma-separated allowed origins if needed.

## User collection

MongoDB uses a users collection, equivalent to the requested user table:
_id, fullName, unique normalized email, passwordHash (excluded from queries by default),
nullable role, authorityApproved (false by default), createdAt, updatedAt.
Passwords use salted scrypt hashes. JWTs expire after seven days.
Mobile tokens use SecureStore; web sessions are memory-only and require login after reload.
Role selection is authenticated and may happen once. No client may set authorityApproved.
An authority dashboard is available immediately with an approval-pending state.
No privileged moderation endpoints are enabled in this milestone. Before adding them,
enforce role and authorityApproved server-side. Administrator approval UI is not implemented.

## API

POST /api/auth/register: { fullName, email, password, acceptTerms: true }
POST /api/auth/login: { email, password }
GET /api/auth/me: Authorization: Bearer token
PATCH /api/auth/role: { role } with Authorization: Bearer token
Registration, login and role selection return { token, user }.
Inputs are validated; unexpected fields are rejected. Login/registration are rate limited.
Roles cannot be changed through this public API.

## Checks

Backend: npm run build and npm test.
Frontend: npm run typecheck; npx expo export --platform all; npx expo-doctor.

## Remaining product configuration

Replace interim in-app terms with reviewed legal text before release.
Social sign-in and password reset require provider/mail configuration and are not shown as inactive buttons.
Dashboards are separate screens with honest empty states; event CRUD, guidance requests,
and moderation actions remain future work.
Rotate the database password and JWT secret previously present in the environment example.
Photo licensing is recorded in frontend/assets/ATTRIBUTION.md.

SDK 57 upgrade validation: frontend typecheck and Android/iOS/web bundle exports passed; Expo Doctor passed 21/21 checks. Backend source startup connected to Atlas, protected /auth/me returned 401 without a token, invalid registration returned 400, and all five backend tests passed. No phone UI verification was performed.

Dependency audit after the upgrade: frontend reports 23 advisories (7 moderate, 16 high); backend reports 3 high advisories after adding development tooling. These require a separate dependency security review. Do not use npm audit fix --force without reviewing its proposed SDK and framework version changes.
