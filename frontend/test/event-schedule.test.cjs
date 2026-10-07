const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
// Simulate an engine which cannot parse display strings (as on Android Hermes).
class NumericDate extends Date { constructor(...args) { if (typeof args[0] === 'string') throw new Error('String date parsing is unsupported'); super(...args); } }
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/utils/eventSchedule.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(source, { exports: exportsObject, Date: NumericDate });
const { parseEventDate, parseEventDateTime } = exportsObject;
test('screenshot schedule is valid without native date string parsing', () => {
 const start = parseEventDateTime('Oct 7, 2026','03:30 AM');
 const end = parseEventDateTime('Oct 7, 2026','10:30 PM');
 assert.equal(start.getHours(),3); assert.equal(start.getMinutes(),30);
 assert.equal(end.getHours(),22); assert.ok(end > start);
});
test('noon, midnight, and multiple-day schedules work', () => {
 assert.equal(parseEventDateTime('2026-10-07','12:00 AM').getHours(),0);
 assert.equal(parseEventDateTime('Oct 7, 2026','12:00 PM').getHours(),12);
 assert.ok(parseEventDateTime('Oct 8, 2026','01:00 AM') > parseEventDateTime('Oct 7, 2026','11:00 PM'));
});
test('invalid calendar dates and times do not pass validation', () => {
 for (const date of ['', 'Feb 30, 2026', '2026-13-07', 'Bad 7, 2026']) assert.equal(parseEventDate(date),null);
 for (const time of ['', '00:30 AM', '13:30 PM', '03:60 AM']) assert.equal(parseEventDateTime('Oct 7, 2026',time),null);
 assert.ok(parseEventDate('Feb 29, 2028'));
});
