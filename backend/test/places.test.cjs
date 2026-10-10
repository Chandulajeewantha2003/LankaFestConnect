require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PlacesController } = require('../dist/modules/events/places.controller');
test('keyless venue search filters Sri Lanka, caches results, and enforces request limits', async () => {
 const previousFetch = global.fetch;
 const controller = new PlacesController({ current: async () => ({ role: 'ORGANIZER' }) });
 const req = { user: { sub: 'owner' } };
 let requests = 0;
 try {
  global.fetch = async (url, options) => {
   requests++;
   assert.equal(url.searchParams.get('q'), 'Kandy');
   assert.equal(url.searchParams.get('bbox'), '79.4,5.8,82.0,10.1');
   assert.match(options.headers['User-Agent'], /LankaFestConnect/);
   assert.equal(options.headers['X-Goog-Api-Key'], undefined);
   return { ok: true, json: async () => ({ features: [
    { geometry: { coordinates: [80.63, 7.29] }, properties: { osm_id: 1, osm_type: 'N', name: 'Venue', city: 'Kandy', country: 'Sri Lanka', countrycode: 'LK' } },
    { geometry: { coordinates: [0, 0] }, properties: { countrycode: 'US' } },
   ] }) };
  };
  const result = await controller.search(req, 'Kandy');
  assert.equal(result.length, 1); assert.equal(result[0].latitude, 7.29); assert.equal(result[0].longitude, 80.63);
  assert.equal(result[0].city, 'Kandy'); assert.equal(result[0].placeId, undefined);
  assert.deepEqual(await controller.search(req, ' kandy '), result); assert.equal(requests, 1);
  await assert.rejects(controller.search(req, 'Colombo'), /wait a moment/);
  await assert.rejects(controller.search(req, 'ab'), /between 3 and 200/);
  await assert.rejects(new PlacesController({ current: async () => ({ role: 'SEEKER' }) }).search(req, 'Kandy'), /Organizer/);
  controller.nextRequestAt = 0;
  global.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(controller.search(req, 'Galle'), /select a pin/);
  assert.equal(controller.busy, false);
 } finally { global.fetch = previousFetch; }
});
