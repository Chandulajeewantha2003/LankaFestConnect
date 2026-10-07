require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ValidationPipe } = require('@nestjs/common');
const { AuthorityReportsService } = require('../dist/modules/authority/authority-reports.service');
const { CreateReportDto, UpdateReportStatusDto, EvidenceQuery, ListReportsQuery } = require('../dist/modules/authority/authority.dto');
const id = n => n.toString(16).padStart(24, '0');
const chain = value => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean() { return this; }, exec: async () => value });
const image = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
function matches(row, q) {
 return Object.entries(q).every(([key, cond]) => {
  const value = row[key];
  if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
   if (cond.$in) return cond.$in.includes(value);
   if (cond.$ne !== undefined) return value !== cond.$ne;
   if (cond.$gt !== undefined) return value > cond.$gt;
   if (cond.$gte !== undefined) return value >= cond.$gte;
  }
  return String(value) === String(cond);
 });
}
function setup() {
 const rows = [];
 let next = 100;
 const reports = {
  rows,
  countDocuments: q => chain(rows.filter(r => matches(r, q)).length),
  find: q => chain(rows.filter(r => matches(r, q)).sort((a, b) => b.createdAt - a.createdAt)),
  findById: rid => chain(rows.find(r => r._id === rid) ?? null),
  aggregate: ([{ $match }]) => chain([{ total: rows.filter(r => matches(r, $match)).reduce((sum, r) => sum + r.evidenceCount, 0) }]),
  create: async data => { const row = { ...data, _id: id(next++), createdAt: new Date(Date.now() + next), updatedAt: new Date(), resolutionNote: '', handledBy: null }; rows.push(row); return { toObject: () => ({ ...row }) }; },
  findOneAndUpdate: (q, u) => { const row = rows.find(r => matches(r, q)); if (row) Object.assign(row, u.$set); return chain(row ? { ...row } : null); },
 };
 const events = { findById: eid => chain(eid === id(1) ? { _id: id(1), title: 'Kandy Esala Perahera' } : null), find: () => chain([{ _id: id(1), title: 'Kandy Esala Perahera', city: 'Kandy' }]) };
 return { service: new AuthorityReportsService(reports, events), rows };
}
const base = { category: 'SAFETY_CONCERN', priority: 'CRITICAL', source: 'FIELD_OFFICER', description: 'Overcrowding risk at the main gate' };
test('officer field reports are created open, linked to the event title, and listed by status with counts', async () => {
 const { service, rows } = setup();
 const created = await service.create(id(70), { ...base, eventId: id(1), evidence: [image, image] });
 assert.equal(created.status, 'OPEN');
 assert.equal(created.eventTitle, 'Kandy Esala Perahera');
 assert.equal(created.reporterLabel, 'Field Officer');
 assert.equal(created.evidenceCount, 2);
 assert.equal(created.evidence, undefined, 'summaries never include evidence images');
 assert.equal(rows[0].reporterId, id(70));
 await service.create(id(70), { ...base, priority: 'NORMAL', category: 'OTHER', source: 'LOCAL_POLICE' });
 const list = await service.list('OPEN');
 assert.deepEqual(list.counts, { OPEN: 2, IN_PROGRESS: 0, RESOLVED: 0, ARCHIVED: 0 });
 assert.equal(list.pendingActions, 2);
 assert.deepEqual(list.critical, { unresolved: 1, today: 1 });
 assert.equal(list.reports.length, 2);
 assert.match(list.reports[0].ref, /^#[0-9A-F]{6}$/);
 await assert.rejects(service.create(id(70), { ...base, eventId: id(9) }), /no longer exists/);
 await assert.rejects(service.create(id(70), { ...base, description: '   short   ' }), /at least 10 characters/);
});
test('status changes follow allowed transitions and resolving needs a note', async () => {
 const { service, rows } = setup();
 const report = await service.create(id(70), base);
 const started = await service.updateStatus(report.id, id(71), 'IN_PROGRESS');
 assert.equal(started.status, 'IN_PROGRESS');
 assert.equal(rows[0].handledBy, id(71));
 await assert.rejects(service.updateStatus(report.id, id(71), 'RESOLVED', ' ok '), /resolution note/);
 const resolved = await service.updateStatus(report.id, id(71), 'RESOLVED', 'Extra marshals deployed at the gate');
 assert.equal(resolved.resolutionNote, 'Extra marshals deployed at the gate');
 await assert.rejects(service.updateStatus(report.id, id(71), 'IN_PROGRESS'), /cannot be moved/);
 await assert.rejects(service.updateStatus(report.id, id(71), 'RESOLVED', 'again please'), /already has that status/);
 assert.equal((await service.updateStatus(report.id, id(71), 'ARCHIVED')).status, 'ARCHIVED');
 assert.equal((await service.updateStatus(report.id, id(71), 'OPEN')).status, 'OPEN');
 await assert.rejects(service.updateStatus(id(99), id(71), 'ARCHIVED'), /not found/);
 await assert.rejects(service.updateStatus('bad', id(71), 'ARCHIVED'), /not found/);
});
test('report detail includes evidence; evidence feed skips archived reports', async () => {
 const { service } = setup();
 const first = await service.create(id(70), { ...base, evidence: [image] });
 const second = await service.create(id(70), { ...base, evidence: [image, image] });
 assert.deepEqual((await service.get(first.id)).evidence, [image]);
 await assert.rejects(service.get(id(99)), /not found/);
 let feed = await service.evidence(2);
 assert.equal(feed.total, 3);
 assert.equal(feed.items.length, 2);
 assert.equal(feed.items[0].reportId, second.id);
 await service.updateStatus(second.id, id(70), 'ARCHIVED');
 feed = await service.evidence(10);
 assert.equal(feed.total, 1);
 assert.deepEqual(feed.items.map(i => i.reportId), [first.id]);
});
test('report inputs are strictly validated', async () => {
 const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
 const body = (metatype, value) => pipe.transform(value, { type: 'body', metatype });
 const q = (metatype, value) => pipe.transform(value, { type: 'query', metatype });
 assert.equal((await body(CreateReportDto, { ...base, eventId: id(1), evidence: [image] })).category, 'SAFETY_CONCERN');
 await assert.rejects(body(CreateReportDto, { ...base, source: 'PUBLIC' }), 'officers cannot pose as public users');
 await assert.rejects(body(CreateReportDto, { ...base, category: 'SPAM' }));
 await assert.rejects(body(CreateReportDto, { ...base, priority: 'URGENT' }));
 await assert.rejects(body(CreateReportDto, { ...base, description: 'short' }));
 await assert.rejects(body(CreateReportDto, { ...base, eventId: 'not-an-id' }));
 await assert.rejects(body(CreateReportDto, { ...base, evidence: [image, image, image, image] }));
 await assert.rejects(body(CreateReportDto, { ...base, evidence: ['data:text/html;base64,PHNjcmlwdD4='] }));
 await assert.rejects(body(CreateReportDto, { ...base, evidence: ['https://example.com/a.jpg'] }));
 await assert.rejects(body(CreateReportDto, { ...base, status: 'RESOLVED' }));
 await assert.rejects(body(CreateReportDto, { ...base, reporterId: id(1) }));
 await assert.rejects(body(UpdateReportStatusDto, { status: 'DELETED' }));
 await assert.rejects(body(UpdateReportStatusDto, { status: 'RESOLVED', note: 'x'.repeat(1001) }));
 assert.equal((await q(EvidenceQuery, { limit: '12' })).limit, 12);
 await assert.rejects(q(EvidenceQuery, { limit: '500' }));
 await assert.rejects(q(ListReportsQuery, { status: 'CLOSED' }));
});
