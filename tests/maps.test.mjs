import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseIncidentPoint, parseCoordinateText, policeSearchUrl, incidentMapUrl } from '../assets/station-core.js';

test('parses incident decimal coordinates, including copied Google Maps pairs', () => {
  const point = { lat: 13.7563, lon: 100.5018 };
  assert.deepEqual(parseIncidentPoint(' 13.756300 ', '100.501800'), point);
  for (const text of ['13.756300, 100.501800', '  (13.756300, 100.501800) ', '13.756300 100.501800']) {
    assert.deepEqual(parseCoordinateText(text), point);
  }
  assert.deepEqual(parseIncidentPoint(0, 0), { lat: 0, lon: 0 });
  assert.deepEqual(parseIncidentPoint('-90', '+180'), { lat: -90, lon: 180 });
  assert.equal(parseCoordinateText('แยกอโศก กรุงเทพมหานคร'), null);
  assert.equal(parseCoordinateText('123 ถนนสุขุมวิท กรุงเทพฯ'), null);
  assert.equal(parseCoordinateText(''), null);
  assert.equal(parseCoordinateText('  '), null);
});

test('blank, partial, swapped out-of-range, malformed and nonfinite coordinates fail', () => {
  for (const pair of [['', ''], [' ', '100'], ['13', ''], [null, 100], [false, 100], [[], 100], ['Infinity', 100], [NaN, 100], [91, 100], [13, 181], [100.5018, 13.7563], ['13north', '100']]) {
    assert.throws(() => parseIncidentPoint(...pair));
  }
  for (const text of ['13.75', '13.75,', ',100.5', '13,100,5', '13.75 north,100.50', '(13.75,100.50', '1e1,100']) {
    assert.throws(() => parseCoordinateText(text));
  }
});

test('police search uses precise incident coordinates and point link displays that point', () => {
  const point = { lat: 13.7563, lon: 100.5018 };
  const search = new URL(policeSearchUrl(point, 'สถานที่ข้อความที่อาจไม่ตรงพิกัด'));
  assert.equal(search.origin, 'https://www.google.com');
  assert.equal(search.pathname, '/maps/search/');
  assert.equal(search.searchParams.get('api'), '1');
  assert.equal(search.searchParams.get('query'), 'สถานีตำรวจ ใกล้ 13.7563,100.5018');
  assert.equal(new URL(incidentMapUrl(point)).searchParams.get('query'), '13.7563,100.5018');
});

test('place-only search is encoded and supported only when coordinates are absent', () => {
  const place = 'ถนน A & B เขตปทุมวัน กรุงเทพฯ';
  for (const missing of [null, undefined]) {
    assert.equal(new URL(policeSearchUrl(missing, place)).searchParams.get('query'), `สถานีตำรวจ ใกล้ ${place}`);
    assert.equal(new URL(incidentMapUrl(missing, place)).searchParams.get('query'), place);
  }
  for (const invalid of [{}, { lat: '', lon: '' }, { lat: 13, lon: undefined }, { lat: 91, lon: 100 }, { lat: NaN, lon: 100 }, false, '']) {
    assert.throws(() => policeSearchUrl(invalid, place));
    assert.throws(() => incidentMapUrl(invalid, place));
  }
  assert.throws(() => policeSearchUrl(null, ' '));
  assert.throws(() => incidentMapUrl(undefined));
  assert.throws(() => policeSearchUrl(null, 'ก'.repeat(1000)));
});

test('map module has no network query or OpenStreetMap endpoint', async () => {
  const source = await readFile(new URL('../assets/station-core.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /fetch\s*\(|openstreetmap|overpass/i);
});
