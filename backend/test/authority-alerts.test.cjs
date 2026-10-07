require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { AuthorityAlertsService } = require('../dist/modules/authority/authority-alerts.service');
const { AlertsService } = require('../dist/modules/alerts/alerts.service');
const { PublishAlertDto } = require('../dist/modules/authority/authority.dto');
const id = n => n.toString(16).padStart(24, '0');
const chain = value => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean() { return this; }, exec: async () => value });
function store() {
 const rows = [];
 let next = 1, feedQuery;
 return {
  rows, get feedQuery() { return feedQuery; },
  create: async data => { const row = { ...data, _id: id(next++), createdAt: new Date(), withdrawnAt: null }; rows.push(row); return { toObject: () => ({ ...row }) }; },
  find: q => { feedQuery = q; return chain(rows.filter(r => !q || !q.status || (r.status === q.status && r.audiences.some(a => q.audiences.$in.includes(a))))); },
  findById: rid => chain(rows.find(r => r._id === rid) ?? null),
  findOneAndUpdate: (q, u) => { const row = rows.find(r => r._id === q._id && r.status === q.status); if (row) Object.assign(row, u.$set); return chain(row ? { ...row } : null); },
 };
}
const base = { type: 'SAFETY_ALERT', title: '  Heavy Rain Warning: Kandy Route  ', message: '  Avoid the A1 near Kadugannawa until 6 PM.  ', classification: 'WEATHER', urgent: true, audiences: ['TOURISTS', 'GUIDES', 'TOURISTS'] };
test('publishing trims text, removes duplicate audiences and records the officer', async () => {
 const alerts = store();
 const service = new AuthorityAlertsService(alerts);
 const alert = await service.publish(id(70), base);
 assert.equal(alert.title, 'Heavy Rain Warning: Kandy Route');
 assert.equal(alert.message, 'Avoid the A1 near Kadugannawa until 6 PM.');
 assert.deepEqual(alert.audiences, ['TOURISTS', 'GUIDES']);
 assert.equal(alert.status, 'ACTIVE');
 assert.equal(alert.authorId, undefined, 'author id is not exposed');
 assert.equal(alerts.rows[0].authorId, id(70));
 await assert.rejects(service.publish(id(70), { ...base, title: '  Hi  ' }), /at least 5/);
 await assert.rejects(service.publish(id(70), { ...base, message: ' short ' }), /at least 10/);
 await assert.rejects(service.publish(id(70), { ...base, audiences: [] }), /at least one/);
});
test('withdrawing is one-way and the feed only shows active alerts for the reader role', async () => {
 const alerts = store();
 const service = new AuthorityAlertsService(alerts);
 const tourists = await service.publish(id(70), base);
 const organizers = await service.publish(id(70), { ...base, audiences: ['ORGANIZERS'] });
 const roles = { [id(80)]: 'SEEKER', [id(81)]: 'ORGANIZER', [id(82)]: null };
 const feed = new AlertsService(alerts, { findById: uid => chain(uid in roles ? { role: roles[uid] } : null) });
 assert.deepEqual((await feed.feed(id(80))).map(a => a.id), [tourists.id]);
 assert.deepEqual(alerts.feedQuery, { status: 'ACTIVE', audiences: { $in: ['ALL_USERS', 'TOURISTS'] } });
 assert.deepEqual((await feed.feed(id(81))).map(a => a.id), [organizers.id]);
 await assert.rejects(feed.feed(id(82)), /Choose a role/);
 await assert.rejects(feed.feed('bad'), /Choose a role/);
 const withdrawn = await service.withdraw(tourists.id);
 assert.equal(withdrawn.status, 'WITHDRAWN');
 assert.ok(withdrawn.withdrawnAt);
 assert.deepEqual(await feed.feed(id(80)), []);
 await assert.rejects(service.withdraw(tourists.id), /already been withdrawn/);
 await assert.rejects(service.withdraw(id(99)), /not found/);
 await assert.rejects(service.withdraw('bad'), /not found/);
 assert.equal((await service.list()).length, 2);
});
test('alert body is strictly validated', async () => {
 const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
 const check = body => pipe.transform(body, { type: 'body', metatype: PublishAlertDto });
 assert.equal((await check(base)).classification, 'WEATHER');
 await assert.rejects(check({ ...base, type: 'PUSH' }));
 await assert.rejects(check({ ...base, classification: 'FIRE' }));
 await assert.rejects(check({ ...base, audiences: ['EVERYONE'] }));
 await assert.rejects(check({ ...base, audiences: [] }));
 await assert.rejects(check({ ...base, urgent: 'yes' }));
 await assert.rejects(check({ ...base, message: 'x'.repeat(301) }));
 await assert.rejects(check({ ...base, title: 'x'.repeat(101) }));
 await assert.rejects(check({ ...base, status: 'WITHDRAWN' }));
 await assert.rejects(check({ ...base, authorId: id(1) }));
});
