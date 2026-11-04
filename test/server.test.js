'use strict';
const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { createServer } = require('../server');

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}
async function get(port, path, headers = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { headers });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (e) { /* not json */ }
  return { status: res.status, text, json, headers: res.headers };
}

test('sample mode when no token is set', async () => {
  const s = createServer({}); const port = await listen(s);
  const r = await get(port, '/api/search?q=esports&country=GB');
  assert.equal(r.status, 200);
  assert.equal(r.json.sample, true);
  assert.ok(r.json.advertisers.length > 3);
  const cfg = await get(port, '/api/config');
  assert.equal(cfg.json.sample, true);
  s.close();
});

test('validates input', async () => {
  const s = createServer({}); const port = await listen(s);
  assert.equal((await get(port, '/api/search?q=a&country=GB')).status, 400);
  assert.equal((await get(port, '/api/search?q=esports&country=US')).status, 400);
  assert.equal((await get(port, '/api/search?q=esports&country=GB&status=DELETE')).status, 400);
  s.close();
});

test('access code is required when set', async () => {
  const s = createServer({ ACCESS_CODE: 'letmein' }); const port = await listen(s);
  assert.equal((await get(port, '/api/search?q=esports&country=GB')).status, 401);
  assert.equal((await get(port, '/api/search?q=esports&country=GB', { 'x-access-code': 'wrong' })).status, 401);
  assert.equal((await get(port, '/api/search?q=esports&country=GB', { 'x-access-code': 'letmein' })).status, 200);
  s.close();
});

test('real mode talks to Meta, aggregates, and never leaks the token', async () => {
  let seen = null;
  const fakeMeta = http.createServer((req, res) => {
    seen = new URL(req.url, 'http://x');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ data: [{ id: '777', page_id: 'p', page_name: 'Real Page', ad_delivery_start_time: '2026-01-01', publisher_platforms: ['facebook'], ad_snapshot_url: 'https://x/?access_token=SECRETTOKEN' }] }));
  });
  const metaPort = await listen(fakeMeta);
  const s = createServer({ META_ACCESS_TOKEN: 'SECRETTOKEN', META_API_BASE: `http://127.0.0.1:${metaPort}`, META_API_VERSION: 'v99.0' });
  const port = await listen(s);
  const r = await get(port, '/api/search?q=esports&country=IE');
  assert.equal(r.status, 200);
  assert.equal(r.json.sample, false);
  assert.equal(r.json.advertisers[0].advertiser, 'Real Page');
  assert.ok(!r.text.includes('SECRETTOKEN'), 'token must not reach the browser');
  assert.equal(seen.pathname, '/v99.0/ads_archive');
  assert.equal(seen.searchParams.get('ad_reached_countries'), '["IE"]');
  assert.ok(!seen.searchParams.get('fields').includes('ad_snapshot_url'));
  const again = await get(port, '/api/search?q=esports&country=IE');
  assert.equal(again.json.cached, true);
  s.close(); fakeMeta.close();
});

test('Meta errors become a safe message', async () => {
  const fakeMeta = http.createServer((req, res) => { res.statusCode = 400; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ error: { code: 190, message: 'token SECRETTOKEN bad' } })); });
  const metaPort = await listen(fakeMeta);
  const s = createServer({ META_ACCESS_TOKEN: 'SECRETTOKEN', META_API_BASE: `http://127.0.0.1:${metaPort}` });
  const port = await listen(s);
  const r = await get(port, '/api/search?q=esports&country=GB');
  assert.equal(r.status, 502);
  assert.ok(!r.text.includes('SECRETTOKEN'));
  assert.match(r.json.error, /invalid or has expired/);
  s.close(); fakeMeta.close();
});

test('static files cannot escape the public folder', async () => {
  const s = createServer({}); const port = await listen(s);
  assert.equal((await get(port, '/..%2Fserver.js')).status, 404);
  assert.equal((await get(port, '/healthz')).text, 'ok');
  s.close();
});
