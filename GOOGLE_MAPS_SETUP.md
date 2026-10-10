# Maps without Google API keys

The app now uses OpenStreetMap tiles with Leaflet and OpenStreetMap-based Photon venue search. No Google API key, Google Cloud activation, or Google billing account is required. Google credentials were removed from local environment files.

## Create or edit
Search for a venue inside the location form and select a result. Its name, address, city and coordinates are saved. If a venue is missing, zoom/tap the map or drag the pin, press Use this pin, and fill in the venue name/address/city manually. Finish saving/publishing the event. Editing loads the existing coordinates; selecting a new venue clears the old Google place ID/share link.

## Seekers
The in-app map shows the saved coordinates. Open in Maps opens OpenStreetMap for new coordinate-based venues. Get Directions opens Google Maps using a regular no-key directions URL. Navigation remains in the maps app/browser. Old Google share links remain usable; old events without coordinates should be edited once to select their pin. They show the Sri Lanka overview rather than an invented venue marker.

## Network and hosting
Internet is required for maps and search. Photon public demo permits reasonable request volume but has no availability guarantee: https://github.com/komoot/photon#demo-server . Search is only requested by pressing Search, cached for 24 hours (up to 500 searches per backend process), and rate limited to one outgoing request per 1.1 seconds. `PLACE_SEARCH_URL` optionally points to a different/self-hosted Photon endpoint without changing the app. Run one backend instance for this public-service configuration; multi-instance deployments need a shared cache/rate limiter or a dedicated search service.

OSM tiles must follow https://operations.osmfoundation.org/policies/tiles/ : attribution remains visible, native WebViews identify LankaFestConnect, and browser/WebView HTTP caching is enabled. No bulk download or offline map feature is included. Public map/search coverage may differ from Google; manual pin placement remains available.

Restart backend and Expo after updating (`npm.cmd start -- --clear` in frontend). Verify search/pin -> save -> edit -> seeker map on your phone. No setup credentials are required. The document keeps its previous filename so existing references continue to work.
