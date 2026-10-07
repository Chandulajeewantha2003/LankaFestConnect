require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AuthorityService } = require('../dist/modules/authority/authority.service');
const { AuthorityGuard } = require('../dist/modules/authority/authority.guard');
const { ReportSchema } = require('../dist/modules/reports/report.schema');
const { VerificationSchema } = require('../dist/modules/verifications/verification.schema');
const query = value => ({ select() { return this; }, lean() { return this; }, exec: async () => value });
const id = n => n.toString(16).padStart(24, '0');
test('dashboard counts pending, new, verified, flagged and open reports from active events only', async () => {
 const now = new Date(), old = new Date(Date.now() - 3 * 86400000);
 const events = [{ _id: id(1), createdAt: now }, { _id: id(2), createdAt: old }, { _id: id(3), createdAt: old }, { _id: id(4), createdAt: old }, { _id: id(5), createdAt: old }];
 let eventQuery, reportQuery;
 const service = new AuthorityService(
  { find: q => { eventQuery = q; return query(events); } },
  { find: () => query([{ eventId: id(3), status: 'VERIFIED' }, { eventId: id(4), status: 'FLAGGED' }, { eventId: id(5), status: 'REJECTED' }, { eventId: id(99), status: 'FLAGGED' }]) },
  { countDocuments: q => { reportQuery = q; return query(2); } },
 );
 const result = await service.dashboard();
 assert.deepEqual(eventQuery, { status: { $in: ['Published', 'Upcoming'] } });
 assert.deepEqual(reportQuery, { status: { $in: ['OPEN', 'IN_PROGRESS'] } });
 assert.equal(result.pendingReview, 2);
 assert.equal(result.newPendingToday, 1);
 assert.equal(result.verifiedActive, 1);
 assert.equal(result.flagged, 1);
 assert.equal(result.openReports, 2);
});
test('empty database returns zero counts', async () => {
 const service = new AuthorityService({ find: () => query([]) }, { find: () => query([]) }, { countDocuments: () => query(0) });
 const { generatedAt, ...counts } = await service.dashboard();
 assert.deepEqual(counts, { pendingReview: 0, newPendingToday: 0, verifiedActive: 0, flagged: 0, openReports: 0 });
});
test('only tourism officer accounts pass the authority guard', async () => {
 const roles = { [id(1)]: 'AUTHORITY', [id(2)]: 'SEEKER', [id(3)]: 'ORGANIZER', [id(4)]: null };
 const guard = new AuthorityGuard({ findById: userId => query(userId in roles ? { role: roles[userId] } : null) });
 const context = sub => ({ switchToHttp: () => ({ getRequest: () => ({ user: sub === undefined ? undefined : { sub } }) }) });
 assert.equal(await guard.canActivate(context(id(1))), true);
 for (const sub of [id(2), id(3), id(4), id(9), 'not-an-id', undefined]) await assert.rejects(guard.canActivate(context(sub)), /Tourism officer account required/);
});
test('schemas restrict statuses and keep one decision per event', () => {
 assert.deepEqual(ReportSchema.path('status').enumValues, ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED']);
 assert.deepEqual(VerificationSchema.path('status').enumValues, ['VERIFIED', 'REJECTED', 'FLAGGED']);
 assert.equal(VerificationSchema.path('eventId').options.unique, true);
});
function eventStore(rows) {
 const matches = (row, q) => Object.entries(q).every(([key, cond]) => {
  const value = String(row[key]);
  if (cond.$in) return cond.$in.map(String).includes(value);
  if (cond.$nin) return !cond.$nin.map(String).includes(value);
  return value === String(cond);
 });
 let projection;
 return {
  get projection() { return projection; },
  countDocuments: q => query(rows.filter(r => matches(r, q)).length),
  find: q => ({ select(p) { projection = p; return this; }, sort() { return this; }, lean() { return this; }, exec: async () => rows.filter(r => matches(r, q)).map(r => ({ ...r, images: r.images.slice(0, p1(projection)) })) }),
 };
}
const p1 = p => (p && p.images && p.images.$slice) || Infinity;
test('event listings split by review status with counts, organizer names and cover image only', async () => {
 const organizer = id(50);
 const base = { description: 'd', category: 'Cultural', city: 'Kandy', locationName: 'Temple', locationAddress: 'Road', startDate: 'Aug 10, 2026', startTime: '6:00 PM', endDate: 'Aug 20, 2026', endTime: '11:00 PM', organizerId: organizer, createdAt: new Date() };
 const rows = [
  { ...base, _id: id(1), title: 'Pending one', status: 'Published', images: ['a', 'b'] },
  { ...base, _id: id(2), title: 'Verified one', status: 'Upcoming', images: [] },
  { ...base, _id: id(3), title: 'Rejected one', status: 'Published', images: [] },
  { ...base, _id: id(4), title: 'Draft', status: 'Draft', images: [] },
  { ...base, _id: id(5), title: 'Flagged', status: 'Published', images: [] },
 ];
 const events = eventStore(rows);
 const service = new AuthorityService(events,
  { find: () => query([{ eventId: id(2), status: 'VERIFIED', note: 'ok' }, { eventId: id(3), status: 'REJECTED', note: 'missing permit' }, { eventId: id(5), status: 'FLAGGED' }]) },
  {},
  { find: () => query([{ _id: organizer, fullName: 'Central Tourism Board' }]) });
 const pending = await service.listEvents('PENDING');
 assert.deepEqual(pending.counts, { PENDING: 1, VERIFIED: 1, REJECTED: 1 });
 assert.deepEqual(pending.events.map(e => e.title), ['Pending one']);
 assert.equal(pending.events[0].coverImage, 'a');
 assert.equal(pending.events[0].images, undefined);
 assert.deepEqual(events.projection, { images: { $slice: 1 } });
 assert.deepEqual(pending.events[0].organizer, { id: organizer, fullName: 'Central Tourism Board' });
 assert.equal(pending.events[0].verification.status, 'PENDING');
 const rejected = await service.listEvents('REJECTED');
 assert.deepEqual(rejected.events.map(e => [e.title, e.verification.status, e.verification.note]), [['Rejected one', 'REJECTED', 'missing permit']]);
 assert.deepEqual((await service.listEvents('VERIFIED')).events.map(e => e.title), ['Verified one']);
});
test('listing query only accepts known review statuses', async () => {
 const { ValidationPipe } = require('@nestjs/common');
 const { AuthorityController } = require('../dist/modules/authority/authority.controller');
 const metatype = Reflect.getMetadata('design:paramtypes', AuthorityController.prototype, 'events')[0];
 const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
 assert.equal((await pipe.transform({ status: 'VERIFIED' }, { type: 'query', metatype })).status, 'VERIFIED');
 await assert.rejects(pipe.transform({ status: 'FLAGGED' }, { type: 'query', metatype }));
 await assert.rejects(pipe.transform({ status: { $ne: 'x' } }, { type: 'query', metatype }));
 await assert.rejects(pipe.transform({ other: '1' }, { type: 'query', metatype }));
});
const allChecked = { organizer: true, documents: true, media: true, safety: true, cultural: true };
function decisionSetup() {
 const event = { _id: id(1), title: 'Kandy Esala Perahera', status: 'Published', organizerId: id(50), images: ['a', 'b', 'c'], viewerIds: ['secret'] };
 const decisions = [];
 let eventQuery;
 const verifications = {
  findOne: q => query(decisions.find(d => d.eventId === q.eventId) ?? null),
  findOneAndUpdate: (q, u) => { let row = decisions.find(d => d.eventId === q.eventId); if (!row) { row = { ...u.$setOnInsert }; decisions.push(row); } Object.assign(row, u.$set, { updatedAt: new Date() }); return query(row); },
  deleteOne: q => { const i = decisions.findIndex(d => d.eventId === q.eventId); if (i >= 0) decisions.splice(i, 1); return query({}); },
 };
 const events = { findOne: q => { eventQuery = q; return query(q._id === event._id && q.status.$in.includes(event.status) ? event : null); } };
 const users = { findById: () => query({ _id: id(50), fullName: 'Kandy Municipal Council' }) };
 return { service: new AuthorityService(events, verifications, {}, users), decisions, event, get eventQuery() { return eventQuery; } };
}
test('event detail returns all photos, organizer and a pending checklist without private fields', async () => {
 const { service } = decisionSetup();
 const detail = await service.getEvent(id(1));
 assert.equal(detail.images.length, 3);
 assert.equal(detail.organizer.fullName, 'Kandy Municipal Council');
 assert.equal(detail.verification.status, 'PENDING');
 assert.deepEqual(detail.verification.checklist, { organizer: false, documents: false, media: false, safety: false, cultural: false });
 assert.equal(detail.viewerIds, undefined);
 await assert.rejects(service.getEvent('bad-id'), /not found/);
 await assert.rejects(service.getEvent(id(9)), /not found/);
});
test('approval needs every checklist item; reject and flag need a reason', async () => {
 const { service, decisions } = decisionSetup();
 await assert.rejects(service.decide(id(1), id(70), { status: 'VERIFIED', checklist: { ...allChecked, safety: false } }), /Complete every evidence checklist item/);
 await assert.rejects(service.decide(id(1), id(70), { status: 'REJECTED', note: '  no ', checklist: allChecked }), /Add a reason/);
 await assert.rejects(service.decide(id(1), id(70), { status: 'FLAGGED', checklist: allChecked }), /Add a reason/);
 assert.equal(decisions.length, 0);
 const approved = await service.decide(id(1), id(70), { status: 'VERIFIED', note: '  Cleared  ', checklist: allChecked });
 assert.equal(approved.verification.status, 'VERIFIED');
 assert.equal(approved.verification.note, 'Cleared');
 assert.equal(decisions[0].reviewerId, id(70));
 const rejected = await service.decide(id(1), id(71), { status: 'REJECTED', note: 'Missing fire brigade sign-off', checklist: { ...allChecked, safety: false } });
 assert.equal(rejected.verification.status, 'REJECTED');
 assert.equal(decisions.length, 1, 'a second decision updates the same record');
 assert.equal((await service.getEvent(id(1))).verification.checklist.safety, false);
 await service.resetDecision(id(1));
 assert.equal(decisions.length, 0);
 assert.equal((await service.getEvent(id(1))).verification.status, 'PENDING');
});
test('decisions are refused for unknown or inactive events', async () => {
 const setup = decisionSetup();
 setup.event.status = 'Draft';
 await assert.rejects(setup.service.decide(id(1), id(70), { status: 'VERIFIED', checklist: allChecked }), /no longer open for review/);
 await assert.rejects(setup.service.decide('x', id(70), { status: 'VERIFIED', checklist: allChecked }), /not found/);
 await assert.rejects(setup.service.resetDecision(id(9)), /not found/);
});
test('decision body is strictly validated', async () => {
 const { ValidationPipe } = require('@nestjs/common');
 const { DecisionDto } = require('../dist/modules/authority/authority.dto');
 const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
 const check = body => pipe.transform(body, { type: 'body', metatype: DecisionDto });
 assert.equal((await check({ status: 'VERIFIED', note: 'ok', checklist: allChecked })).status, 'VERIFIED');
 await assert.rejects(check({ status: 'PENDING', checklist: allChecked }));
 await assert.rejects(check({ status: 'VERIFIED', checklist: { ...allChecked, safety: 'yes' } }));
 await assert.rejects(check({ status: 'VERIFIED', checklist: { ...allChecked, extra: true } }));
 await assert.rejects(check({ status: 'VERIFIED', checklist: allChecked, reviewerId: id(1) }));
 await assert.rejects(check({ status: 'VERIFIED', note: 'x'.repeat(1001), checklist: allChecked }));
 await assert.rejects(check({ status: 'VERIFIED' }));
});
