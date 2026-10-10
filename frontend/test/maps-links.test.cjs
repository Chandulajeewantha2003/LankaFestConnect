const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/services/places.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject, URL, require: () => ({ apiRequest: () => { throw new Error('Unexpected network request'); } }) });
const { parseMapsLink, mapsDestination, eventMapsUrl } = exportsObject;
const event = { venue: 'Old venue', address: 'Old street', city: 'Kandy', latitude: 7, longitude: 80 };
test('accepts Maps share links and rejects deceptive hosts and protocols', () => {
 assert.equal(parseMapsLink('New venue https://maps.app.goo.gl/abc123'), 'https://maps.app.goo.gl/abc123');
 for (const link of ['https://google.com.evil.test/maps/place/a', 'https://evil.test/maps', 'javascript:alert(1)', 'http://maps.app.goo.gl/abc', 'https://user@www.google.com/maps', 'https://www.google.com:444/maps', 'https://goo.gl/other/a']) assert.equal(parseMapsLink(link), null);
});
test('new share link wins over previous coordinates and directions keep opaque venue links', () => {
 const saved = { ...event, mapsUrl: 'https://maps.app.goo.gl/newVenue' };
 assert.equal(eventMapsUrl(saved, false), saved.mapsUrl);
 assert.equal(eventMapsUrl(saved, true), saved.mapsUrl);
 assert.equal(mapsDestination('https://www.google.com/maps/place/Venue/@6.1,79.2,15z'), null);
 assert.equal(mapsDestination('https://www.google.com/maps/place/Venue/data=!3d6.1!4d79.2'), '6.1,79.2');
 assert.match(eventMapsUrl({ ...saved, mapsUrl: 'https://www.google.com/maps/search/?api=1&query=6.1%2C79.2' }, true), /destination=6.1%2C79.2/);
 assert.match(eventMapsUrl(event, true), /destination=7%2C80/);
});

test('keyless venue links open OpenStreetMap and directions still need no Google key', () => {
 const link = eventMapsUrl({ ...event, placeId: undefined }, false);
 assert.match(link, /openstreetmap.org/); assert.match(link, /mlat=7&mlon=80/);
 assert.match(eventMapsUrl({ ...event, placeId: undefined }, true), /google.com\/maps\/dir/);
});
