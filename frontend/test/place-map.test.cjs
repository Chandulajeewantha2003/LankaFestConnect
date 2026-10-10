const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/utils/placeMap.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject });
const { parseMapPoint, placeMapHtml } = exportsObject;
test('map bridge validates coordinates and rejects malformed or unrelated messages', () => {
 const point = parseMapPoint(JSON.stringify({ type: 'venue-pin', latitude: 7.29, longitude: 80.63 }));
 assert.equal(point.latitude, 7.29); assert.equal(point.longitude, 80.63);
 for (const value of ['invalid', null, { type: 'venue-pin', latitude: 91, longitude: 80 }, { type: 'venue-pin', latitude: 7, longitude: '80' }, { type: 'venue-pin', latitude: NaN, longitude: 80 }, { type: 'other', latitude: 7, longitude: 80 }]) assert.equal(parseMapPoint(value), null);
});
test('maps use saved venue coordinates, show attribution, and keep invalid coordinates out of scripts', () => {
 const html = placeMapHtml(7.29, 80.63, true);
 assert.match(html, /"latitude":7.29,"longitude":80.63,"selected":true,"selectable":true/);
 assert.match(html, /OpenStreetMap contributors/); assert.match(html, /tile.openstreetmap.org/);
 assert.doesNotMatch(html, /googleapis|AIza/);
 assert.match(placeMapHtml(undefined, undefined), /"selected":false/);
 assert.match(placeMapHtml('<script>', 80), /"latitude":7.8/);
});

test('interactive map forwards clicked and dragged pins, while seeker map stays read-only', () => {
 function run(selectable) {
  const messages = [], mapHandlers = {}, markerHandlers = {};
  let point = { lat: 7.29, lng: 80.63 };
  const map = { setView() { return this; }, on(name, handler) { mapHandlers[name] = handler; }, invalidateSize() {} };
  const marker = { addTo() { return this; }, on(name, handler) { markerHandlers[name] = handler; }, setLatLng(value) { point = value; }, getLatLng() { return point; } };
  const L = { map: () => map, tileLayer: () => ({ addTo() { return this; }, on() {} }), divIcon: () => ({}), marker: () => marker };
  const html = placeMapHtml(7.29, 80.63, selectable);
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  vm.runInNewContext(script, { L, window: { L, ReactNativeWebView: { postMessage: value => messages.push(JSON.parse(value)) } }, setTimeout: callback => callback() });
  return { messages, mapHandlers, markerHandlers };
 }
 const organizer = run(true);
 organizer.mapHandlers.click({ latlng: { lat: 6.92, lng: 79.84 } });
 assert.equal(organizer.messages[0].latitude, 6.92); assert.equal(organizer.messages[0].longitude, 79.84);
 organizer.markerHandlers.dragend(); assert.equal(organizer.messages.length, 2);
 const seeker = run(false);
 assert.equal(seeker.mapHandlers.click, undefined); assert.equal(seeker.markerHandlers.dragend, undefined);
});
