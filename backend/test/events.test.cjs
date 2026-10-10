require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventsService } = require('../dist/modules/events/events.service');
const { EventsController } = require('../dist/modules/events/events.controller');
const base = { title: 'Community celebration', description: 'A local event', category: 'Community', locationName: 'Town hall', locationAddress: 'Main Street', city: 'Colombo', startDate: 'Nov 15, 2026', startTime: '10:00 AM', endDate: 'Nov 15, 2026', endTime: '12:00 PM', status: 'Published', isPaid: false };
function store() {
 const rows = [];
 function matches(row, query) { return Object.entries(query).every(([key,value]) => value && value.$in ? value.$in.includes(row[key]) : String(row[key]) === String(value)); }
 function doc(row) { return { toObject: () => ({ ...row }) }; }
 class Model { constructor(data) { this.data = data; } async save() { const row = { ...this.data, _id: (rows.length + 1).toString(16).padStart(24,'0') }; rows.push(row); return doc(row); } }
 Model.find = query => ({ select() { return this; }, sort: () => ({ select() { return this; }, exec: async () => rows.filter(r => matches(r,query)).map(doc) }) });
 Model.findOne = query => ({ select() { return this; }, exec: async () => { const r = rows.find(r => matches(r,query)); return r ? doc(r) : null; } });
 Model.findOneAndUpdate = (query,data) => ({ select() { return this; }, exec: async () => { const r=rows.find(r => matches(r,query)); if (!r) return null; Object.assign(r,data); return doc(r); } });
 Model.deleteOne = query => ({ exec: async () => { const i=rows.findIndex(r => matches(r,query)); if(i>=0)rows.splice(i,1); } });
 return Model;
}
test('publish is visible to seekers and only the owning organizer; drafts remain private', async () => {
 const service = new EventsService(store());
 const published = await service.create({ ...base, organizerId: 'forged' }, 'owner');
 await service.create({ ...base, status: 'Draft' }, 'other');
 assert.equal(published.organizerId,'owner');
 assert.equal(published.viewsCount,0);
 assert.equal((await service.findOrganizerEvents('owner')).length,1);
 assert.equal((await service.findAll()).length,1);
 assert.equal((await service.findAll())[0].id,published.id);
 await assert.rejects(service.update(published.id,{ title: 'Changed' },'other'),/not found/);
 await service.update(published.id,{ title: 'Updated title' },'owner');
 assert.equal((await service.findAll())[0].title,'Updated title');
 const copy = await service.duplicate(published.id,'owner');
 assert.equal(copy.status,'Draft');
 await assert.rejects(service.findOne(copy.id),/not found/);
 await service.remove(published.id,'owner');
 assert.deepEqual(await service.findAll(),[]);
 await assert.rejects(service.findOne(published.id),/not found/);
});
test('empty database stays empty; database failures never return fake success', async () => {
 const service = new EventsService(store()); assert.deepEqual(await service.findAll(),[]);
 class Broken { async save() { throw new Error('database unavailable'); } }
 await assert.rejects(new EventsService(Broken).create(base,'owner'),/database unavailable/);
 await assert.rejects(service.create({ ...base, title: '' },'owner'),/title is required/);
 await assert.rejects(service.create({ ...base, endTime: '9:00 AM' },'owner'),/valid schedule/);
 await assert.rejects(service.create({ ...base, isPaid: true, ticketPrice: 0 },'owner'),/ticket price/);
});
test('controller uses authenticated owner and rejects seeker mutations', async () => {
 const service = new EventsService(store());
 const controller = new EventsController(service,{ current: async id => ({ role: id === 'owner' ? 'ORGANIZER' : 'SEEKER' }) });
 await assert.rejects(controller.create({ user: { sub: 'seeker' } },base),/Organizer account required/);
 const event = await controller.create({ user: { sub: 'owner' } },{ ...base, organizerId: 'forged' });
 assert.equal(event.organizerId,'owner');
});

test('views and saves are unique per seeker and unsaving reduces interested count', async () => {
 const row = { _id: '000000000000000000000001', viewerIds: [], savedByIds: [] };
 const model = { findOneAndUpdate: (_query, update) => {
  for (const [field,value] of Object.entries(update.$addToSet ?? {})) if (!row[field].includes(value)) row[field].push(value);
  for (const [field,value] of Object.entries(update.$pull ?? {})) row[field] = row[field].filter(id => id !== value);
  return { select() { return this; }, exec: async () => ({ toObject: () => ({ ...row }) }) };
 } };
 const service = new EventsService(model);
 await service.recordView(row._id, 'seeker-one'); await service.recordView(row._id, 'seeker-one');
 assert.equal((await service.recordView(row._id, 'seeker-two')).viewsCount, 2);
 await service.setSaved(row._id, 'seeker-one', true); await service.setSaved(row._id, 'seeker-one', true);
 assert.equal((await service.setSaved(row._id, 'seeker-two', true)).interestedCount, 2);
 assert.equal((await service.setSaved(row._id, 'seeker-one', false)).interestedCount, 1);
 assert.equal((await service.setSaved(row._id, 'seeker-one', false)).interestedCount, 1);
 assert.equal(service.normalize({ toObject: () => row }).viewerIds, undefined);
 assert.equal(service.normalize({ toObject: () => row }).savedByIds, undefined);
});

test('update validation accepts editable fields and partial updates, rejects invalid values and metadata', async () => {
 const { ValidationPipe } = require('@nestjs/common');
 const { UpdateEventDto } = require('../dist/modules/events/dto/update-event.dto');
 const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
 const metadata = { type: 'body', metatype: UpdateEventDto };
 const valid = { ...base, eventType: 'Physical Event', audience: ['All Ages'], images: [], isPaid: true, ticketPrice: 1200, additionalInfo: { familyFriendly: true } };
 assert.equal((await pipe.transform(valid, metadata)).title, base.title);
 assert.equal((await pipe.transform({ title: 'Edited title' }, metadata)).title, 'Edited title');
 await assert.rejects(pipe.transform({ title: 123 }, metadata));
 await assert.rejects(pipe.transform({ ticketPrice: 'invalid' }, metadata));
 await assert.rejects(pipe.transform({ ...valid, _id: 'server-id', viewsCount: 10, organizer: {} }, metadata));
});

 test('venue identity and coordinates survive publishing, editing, and duplication', async () => {
  const service = new EventsService(store());
  const location = { placeId: 'venue-one', latitude: 7.29, longitude: 80.63 };
  const event = await service.create({ ...base, ...location }, 'owner');
  for (const [key, value] of Object.entries(location)) assert.equal((await service.findAll())[0][key], value);
  await service.update(event.id, { placeId: 'venue-two', latitude: 6.92, longitude: 79.84 }, 'owner');
  const copy = await service.duplicate(event.id, 'owner');
  assert.equal(copy.placeId, 'venue-two'); assert.equal(copy.latitude, 6.92); assert.equal(copy.longitude, 79.84);
 });

test('editing a venue replaces its map link and clears stale coordinates', async () => {
 const service = new EventsService(store());
 const event = await service.create({ ...base, mapsUrl: 'https://maps.app.goo.gl/oldVenue', placeId: 'old-id', latitude: 7, longitude: 80 }, 'owner');
 await service.update(event.id, { mapsUrl: 'https://maps.app.goo.gl/newVenue', placeId: null, latitude: null, longitude: null }, 'owner');
 const saved = (await service.findAll())[0];
 assert.equal(saved.mapsUrl, 'https://maps.app.goo.gl/newVenue');
 assert.equal(saved.placeId, null); assert.equal(saved.latitude, null); assert.equal(saved.longitude, null);
});

test('map links accept share URLs and null for legacy edits, reject unrelated URLs', async () => {
 const { validate } = require('class-validator');
 const { UpdateEventDto } = require('../dist/modules/events/dto/update-event.dto');
 for (const mapsUrl of ['https://maps.app.goo.gl/venue', 'https://www.google.com/maps/place/Venue', null]) {
  assert.equal((await validate(Object.assign(new UpdateEventDto(), { mapsUrl }))).length, 0);
 }
 for (const mapsUrl of ['https://evil.test/maps', 'https://google.com.evil.test/maps', '']) {
  assert.ok((await validate(Object.assign(new UpdateEventDto(), { mapsUrl }))).length > 0);
 }
});
