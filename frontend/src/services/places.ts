import { apiRequest } from './api';
export interface PlaceResult { id: string; placeId?: string; name: string; address: string; city: string; latitude: number; longitude: number; }
export const searchPlaces = (query: string) => apiRequest<PlaceResult[]>('/organizer/places?query=' + encodeURIComponent(query));

// Share links remain available as a fallback for existing events.
export function parseMapsLink(text: string): string | null {
 const match = text.trim().match(/https:\/\/[^\s<>]+/i);
 if (!match) return null;
 try {
  const url = new URL(match[0]);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.href.length > 2048) return null;
  const host = url.hostname.toLowerCase();
  const valid = (host === 'maps.app.goo.gl' && url.pathname.length > 1)
   || (host === 'goo.gl' && url.pathname.startsWith('/maps/'))
   || ((host === 'google.com' || host === 'www.google.com') && /^\/maps(?:\/|$)/.test(url.pathname))
   || host === 'maps.google.com';
  return valid ? url.href : null;
 } catch { return null; }
}

export function mapsSearchUrl(query: string): string {
 return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query.trim() || 'Sri Lanka');
}

// Only explicit destination coordinates are used; /@lat,lng is a camera position.
export function mapsDestination(link: string): string | null {
 const valid = parseMapsLink(link);
 if (!valid) return null;
 const url = new URL(valid);
 const query = url.searchParams.get('destination') || url.searchParams.get('query') || url.searchParams.get('q');
 if (query) return query;
 const point = valid.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
 if (point && Math.abs(Number(point[1])) <= 90 && Math.abs(Number(point[2])) <= 180) return point[1] + ',' + point[2];
 return null;
}

export function eventMapsUrl(event: { mapsUrl?: string; placeId?: string; latitude?: number; longitude?: number; venue: string; address: string; city: string }, directions: boolean): string {
 const saved = event.mapsUrl ? parseMapsLink(event.mapsUrl) : null;
 if (saved && !directions) return saved;
 const destination = saved ? mapsDestination(saved) : null;
 // Short share links are opaque. Open the exact venue; the user taps Directions there.
 if (saved && !destination) return saved;
 const query = destination || (Number.isFinite(event.latitude) && Number.isFinite(event.longitude) ? `${event.latitude},${event.longitude}` : [event.venue, event.address, event.city, 'Sri Lanka'].filter(Boolean).join(', '));
 if (!directions && !saved && Number.isFinite(event.latitude) && Number.isFinite(event.longitude)) return `https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=16/${event.latitude}/${event.longitude}`;
 const placeId = saved ? new URL(saved).searchParams.get('query_place_id') || new URL(saved).searchParams.get('destination_place_id') : event.placeId;
 return (directions ? 'https://www.google.com/maps/dir/?api=1&destination=' : 'https://www.google.com/maps/search/?api=1&query=') + encodeURIComponent(query)
  + (placeId ? (directions ? '&destination_place_id=' : '&query_place_id=') + encodeURIComponent(placeId) : '');
}
