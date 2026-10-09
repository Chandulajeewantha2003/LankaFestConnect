require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { AuthorityProfileService } = require('../dist/modules/authority/authority-profile.service');
const { UpdateProfileDto, ProfilePhotoDto } = require('../dist/modules/authority/authority.dto');
const { OfficerProfileSchema, OFFICER_REGIONS } = require('../dist/modules/authority/officer-profile.schema');
const id = n => n.toString(16).padStart(24, '0');
const chain = value => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean() { return this; }, exec: async () => value });
const me = id(70), other = id(71);
function matches(row, q) {
 return Object.entries(q).every(([k, v]) => (v && typeof v === 'object' ? ('$ne' in v ? row[k] !== v.$ne : v.$in.map(String).includes(String(row[k]))) : row[k] === v));
}
const counter = rows => ({ countDocuments: q => chain(rows.filter(r => matches(r, q)).length), find: q => chain(rows.filter(r => matches(r, q)).sort((a, b) => b.updatedAt - a.updatedAt)) });
function setup() {
 const profiles = [];
 const profileModel = {
  rows: profiles,
  findOne: q => chain(profiles.find(r => r.userId === q.userId) ?? null),
  findOneAndUpdate: (q, u) => { let row = profiles.find(r => r.userId === q.userId); if (!row) { row = { ...u.$setOnInsert }; profiles.push(row); } Object.assign(row, u.$set); return chain({ ...row }); },
 };
 const users = { findById: uid => chain(uid === me ? { _id: me, fullName: 'Nimal Perera', email: 'nimal@example.com', role: 'AUTHORITY', authorityApproved: false, createdAt: new Date('2026-01-02'), passwordHash: 'secret' } : null) };
 const events = { find: () => chain([{ _id: id(1), title: 'Kandy Esala Perahera' }]) };
 const verifications = counter([
  { reviewerId: me, status: 'VERIFIED', eventId: id(1), updatedAt: new Date(2) },
  { reviewerId: me, status: 'REJECTED', eventId: id(2), updatedAt: new Date(3) },
  { reviewerId: other, status: 'VERIFIED', eventId: id(3), updatedAt: new Date(4) },
 ]);
 const reports = counter([
  { reporterId: me, source: 'FIELD_OFFICER', handledBy: me, status: 'RESOLVED' },
  { reporterId: me, source: 'PUBLIC', handledBy: other, status: 'OPEN' },
  { reporterId: other, source: 'LOCAL_POLICE', handledBy: me, status: 'IN_PROGRESS' },
 ]);
 const alerts = counter([{ authorId: me, status: 'ACTIVE' }, { authorId: me, status: 'WITHDRAWN' }, { authorId: other, status: 'ACTIVE' }]);
 return { service: new AuthorityProfileService(profileModel, users, events, verifications, reports, alerts), profiles };
}
test('profile shows own account, defaults and only this officer\'s activity', async () => {
 const { service } = setup();
 const data = await service.get(me);
 assert.deepEqual(data.account, { id: me, fullName: 'Nimal Perera', email: 'nimal@example.com', authorityApproved: false, memberSince: new Date('2026-01-02') });
 assert.equal(data.account.passwordHash, undefined);
 assert.deepEqual(data.profile, { designation: 'Tourism Officer', region: 'Island-wide', officePhone: '', photo: null });
 assert.deepEqual(data.activity, { eventsVerified: 1, eventsRejected: 1, eventsFlagged: 0, reportsFiled: 1, reportsResolved: 1, alertsPublished: 2, alertsActive: 1 });
 assert.deepEqual(data.recentDecisions.map(d => [d.eventTitle, d.status]), [['Event no longer available', 'REJECTED'], ['Kandy Esala Perahera', 'VERIFIED']]);
 await assert.rejects(service.get(id(99)), /Account not found/);
 await assert.rejects(service.get('bad'), /Account not found/);
});
test('updates are saved per officer, trimmed, and photos can be set and removed', async () => {
 const { service, profiles } = setup();
 const updated = await service.update(me, { designation: '  Senior Tourism Officer ', region: 'Kandy', officePhone: ' +94  81 222 3333 ' });
 assert.deepEqual(updated, { designation: 'Senior Tourism Officer', region: 'Kandy', officePhone: '+94 81 222 3333', photo: null });
 assert.equal(profiles.length, 1);
 assert.equal(profiles[0].userId, me);
 assert.equal((await service.update(me, { designation: '   ' })).designation, 'Tourism Officer', 'blank designation falls back to the default');
 assert.equal((await service.update(me, {})).region, 'Kandy', 'omitted fields are unchanged');
 assert.equal((await service.setPhoto(me, 'data:image/jpeg;base64,AAAA')).photo, 'data:image/jpeg;base64,AAAA');
 assert.equal((await service.setPhoto(me, null)).photo, null);
 await service.update(other, { region: 'Galle' });
 assert.equal(profiles.length, 2);
 assert.equal((await service.get(me)).profile.region, 'Kandy');
});
test('profile inputs are strictly validated', async () => {
 const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
 const check = (metatype, value) => pipe.transform(value, { type: 'body', metatype });
 assert.equal((await check(UpdateProfileDto, { region: 'Nuwara Eliya', officePhone: '+94 81 222 3333', designation: 'Field Officer' })).region, 'Nuwara Eliya');
 assert.equal((await check(UpdateProfileDto, { officePhone: '' })).officePhone, '', 'phone can be cleared');
 await assert.rejects(check(UpdateProfileDto, { region: 'Atlantis' }));
 await assert.rejects(check(UpdateProfileDto, { officePhone: 'call me' }));
 await assert.rejects(check(UpdateProfileDto, { officePhone: '12' }));
 await assert.rejects(check(UpdateProfileDto, { designation: 'x'.repeat(61) }));
 await assert.rejects(check(UpdateProfileDto, { fullName: 'New Name' }), 'name and account fields cannot be changed here');
 await assert.rejects(check(UpdateProfileDto, { userId: id(1) }));
 await assert.rejects(check(UpdateProfileDto, { authorityApproved: true }));
 assert.ok(await check(ProfilePhotoDto, { photo: 'data:image/png;base64,iVBORw0KGgo=' }));
 await assert.rejects(check(ProfilePhotoDto, { photo: 'https://example.com/me.jpg' }));
 await assert.rejects(check(ProfilePhotoDto, { photo: 'data:image/jpeg;base64,' + 'A'.repeat(400001) }));
 await assert.rejects(check(ProfilePhotoDto, {}));
 assert.equal(OFFICER_REGIONS.length, 26, '25 districts plus Island-wide');
 assert.equal(OfficerProfileSchema.path('userId').options.unique, true);
});
