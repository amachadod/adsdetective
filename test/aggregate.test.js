'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { aggregate, cleanText } = require('../lib/aggregate');

const NOW = new Date('2026-11-03T12:00:00Z');
const ad = (o) => ({ id: '111', page_id: 'p1', page_name: 'Page One', ad_delivery_start_time: '2026-08-05', publisher_platforms: ['FACEBOOK'], languages: ['en'], ad_creative_bodies: ['Hello world'], ...o });

test('groups ads by advertiser and finds the longest run', () => {
  const out = aggregate([ad({ id: '1' }), ad({ id: '2', ad_delivery_start_time: '2026-10-20' }), ad({ id: '3', page_id: 'p2', page_name: 'Page Two' })], NOW);
  assert.equal(out.length, 2);
  assert.equal(out[0].advertiser, 'Page One');
  assert.equal(out[0].adCount, 2);
  assert.equal(out[0].longestDays, 90); // 5 Aug to 3 Nov
  assert.equal(out[0].adLibraryUrl, 'https://www.facebook.com/ads/library/?id=1');
  assert.ok(out[0].signals.includes('Long runner'));
});

test('stopped ads count until their stop date and are not active', () => {
  const out = aggregate([ad({ ad_delivery_start_time: '2026-01-01', ad_delivery_stop_time: '2026-01-11' })], NOW);
  assert.equal(out[0].longestDays, 10);
  assert.equal(out[0].activeCount, 0);
  assert.ok(!out[0].signals.includes('Long runner'));
});

test('ignores ads without a usable date and tolerates bad input', () => {
  assert.deepEqual(aggregate([{ page_id: 'x' }], NOW), []);
  assert.deepEqual(aggregate(null, NOW), []);
});

test('only builds a link from numeric ad ids', () => {
  const out = aggregate([ad({ id: 'javascript:alert(1)' })], NOW);
  assert.equal(out[0].adLibraryUrl, null);
});

test('reach is the largest single ad, not a sum', () => {
  const out = aggregate([ad({ id: '1', eu_total_reach: 1000 }), ad({ id: '2', eu_total_reach: 5000 })], NOW);
  assert.equal(out[0].maxReach, 5000);
});

test('marks new advertisers and trims long copy', () => {
  const out = aggregate([ad({ ad_delivery_start_time: '2026-11-01', ad_creative_bodies: ['x'.repeat(300)] })], NOW);
  assert.ok(out[0].signals.includes('New'));
  assert.ok(out[0].snippet.length <= 110);
  assert.equal(cleanText('  a   b  '), 'a b');
});
