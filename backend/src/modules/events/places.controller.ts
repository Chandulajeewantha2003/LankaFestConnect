import { BadRequestException, Controller, ForbiddenException, Get, HttpException, Query, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';

interface PhotonFeature {
 geometry?: { coordinates?: number[] };
 properties?: { osm_id?: number; osm_type?: string; name?: string; street?: string; housenumber?: string; city?: string; town?: string; village?: string; district?: string; county?: string; state?: string; country?: string; countrycode?: string };
}
@Controller('organizer/places')
@UseGuards(AuthGuard)
export class PlacesController {
 private readonly cache = new Map<string, { expires: number; results: unknown[] }>();
 private busy = false;
 private nextRequestAt = 0;
 constructor(private readonly auth: AuthService) {}
 @Get()
 async search(@Req() req: { user: { sub: string } }, @Query('query') query: string) {
  const user = await this.auth.current(req.user.sub);
  if (user.role !== 'ORGANIZER') throw new ForbiddenException('Organizer account required.');
  if (typeof query !== 'string' || query.trim().length < 3 || query.length > 200) throw new BadRequestException('Enter between 3 and 200 characters.');
  const cacheKey = query.trim().toLowerCase();
  const cached = this.cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.results;
  // Search is submitted explicitly. Cache results and limit public-service traffic.
  if (this.busy || Date.now() < this.nextRequestAt) throw new HttpException('Please wait a moment before searching again.', 429);
  this.busy = true; this.nextRequestAt = Date.now() + 1100;
  try {
   const url = new URL(process.env.PLACE_SEARCH_URL || 'https://photon.komoot.io/api/');
   url.search = new URLSearchParams({ q: query.trim(), limit: '10', lang: 'en', bbox: '79.4,5.8,82.0,10.1' }).toString();
   const response = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'LankaFestConnect/0.1 (event venue search)', Accept: 'application/json' } });
   if (!response.ok) throw new Error('Search unavailable');
   const data = await response.json() as { features?: PhotonFeature[] };
   const results = (data.features ?? []).filter(feature => {
    const point = feature.geometry?.coordinates;
    return point && Number.isFinite(point[0]) && Number.isFinite(point[1]) && feature.properties?.countrycode?.toUpperCase() === 'LK';
   }).map(feature => {
    const p = feature.properties!;
    const city = p.city || p.town || p.village || p.district || p.county || '';
    return { id: `osm:${p.osm_type}:${p.osm_id}`, name: p.name || p.street || city || 'Selected venue',
     address: [...new Set([p.name, [p.housenumber, p.street].filter(Boolean).join(' '), city, p.state, p.country || 'Sri Lanka'].filter(Boolean))].join(', '),
     city, latitude: feature.geometry!.coordinates![1], longitude: feature.geometry!.coordinates![0] };
   });
   if (this.cache.size >= 500) this.cache.delete(this.cache.keys().next().value!);
   this.cache.set(cacheKey, { expires: Date.now() + 86400000, results });
   return results;
  } catch { throw new ServiceUnavailableException('Venue search is unavailable. Try again or select a pin on the map.'); }
  finally { this.busy = false; }
 }
}
