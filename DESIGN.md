# LankaFest Connect design
Visual authority: user-supplied four-screen reference.
Mobile-first white authentication screens, forest-green primary actions, soft gray input borders,
dark navy headings and generous vertical whitespace. Welcome uses a full-height Sigiriya photograph
with a dark overlay and centered brand. Ionicons supplies consistent leaf and interface icons.
Three role choices: Event Seeker, Event Organizer, and the combined Event Authority / Guide.
Forms show validation, loading and server error states. Screen content scrolls on small devices.
Dashboards keep the same palette and use text-led, honest empty states.

Event Seeker home inherits the supplied mobile reference: warm light background, compact branded header, greeting panel, five colored category controls, photographic event cards, and a fixed five-tab navigation bar. Demo data lives in frontend/src/screens/event-seeker/data/demoEvents.ts; filtering, search, hearts, event details, alerts, profile and logout work locally. Sample dates, prices, ratings, verification and session-only saving are labeled.

Explore opens a separate Filters surface: centered title, green Reset, date chips and custom date input, two-column checkboxes, inline location selector, language choices, and a fixed Apply Filters action. Applied selections filter demo events; Back discards draft changes. Bottom tabs are hidden during filter editing.

Event details follow the supplied photo-led reference, with overlay back/save/share, metadata rows, a map link, and fixed Save/Set Reminder actions. Saved and Notifications list the user's local demo state; Profile shows account details and an editable photo.

Event Location follows the supplied map-and-bottom-sheet reference. View on Map opens the embedded map; Open in Maps launches Google Maps at the demo pin. Get Directions draws an OSRM driving route inside Leaflet, starting at a labelled demo origin that users can change by tapping the map.
