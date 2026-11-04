'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { aggregate } = require('./lib/aggregate');
const { sampleResult } = require('./lib/sample');
const { fetchAds, MetaError } = require('./lib/meta');

// Countries where Meta's Ad Library API returns data for all ads (UK and EU).
const COUNTRIES = {
  GB: 'United Kingdom', IE: 'Ireland', DE: 'Germany', FR: 'France', ES: 'Spain',
  PT: 'Portugal', NL: 'Netherlands', IT: 'Italy', SE: 'Sweden', PL: 'Poland',
};
const STATUSES = new Set(['ACTIVE', 'ALL']);
const PUBLIC_DIR = path.join(__dirname, 'docs');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
const CSP = "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

function createServer(env = process.env, deps = {}) {
  const token = env.META_ACCESS_TOKEN || '';
  const version = env.META_API_VERSION || 'v23.0';
  const base = env.META_API_BASE || 'https://graph.facebook.com';
  const accessCode = env.ACCESS_CODE || '';
  const perMinute = Number(env.RATE_LIMIT_PER_MIN) || 20;
  const fetchImpl = deps.fetchImpl || fetch;

  const cache = new Map(); // key -> { at, data }
  const CACHE_MS = 10 * 60 * 1000;
  const hits = new Map(); // ip -> [timestamps]

  const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
  const codeOk = (given) => !accessCode || crypto.timingSafeEqual(sha(given || ''), sha(accessCode));

  function limited(ip) {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
    return list.length > perMinute;
  }

  function send(res, status, body, headers = {}) {
    const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
    res.writeHead(status, {
      'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
      ...headers,
    });
    res.end(isJson ? JSON.stringify(body) : body);
  }

  async function handleSearch(url, req, res) {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (limited(ip)) return send(res, 429, { error: 'Too many searches. Wait a minute and try again.' });
    if (!codeOk(req.headers['x-access-code'])) return send(res, 401, { error: 'That access code is not right.' });

    const q = String(url.searchParams.get('q') || '').trim();
    const country = String(url.searchParams.get('country') || 'GB').toUpperCase();
    const status = String(url.searchParams.get('status') || 'ACTIVE').toUpperCase();
    if (q.length < 2 || q.length > 100) return send(res, 400, { error: 'Type 2 to 100 characters to search for.' });
    if (!COUNTRIES[country]) return send(res, 400, { error: 'Pick one of the listed countries.' });
    if (!STATUSES.has(status)) return send(res, 400, { error: 'Status must be ACTIVE or ALL.' });

    const meta = { query: q, country, countryName: COUNTRIES[country], status, fetchedAt: new Date().toISOString() };
    if (!token) return send(res, 200, { ...meta, sample: true, ...sampleResult() });

    const key = `${country}|${status}|${q.toLowerCase()}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return send(res, 200, { ...meta, ...hit.data, cached: true });

    try {
      const ads = await fetchAds({ q, country, status }, { token, version, base, fetchImpl });
      const advertisers = aggregate(ads);
      const data = { sample: false, advertisers, totals: { advertisers: advertisers.length, ads: ads.length } };
      if (cache.size > 200) cache.clear();
      cache.set(key, { at: Date.now(), data });
      return send(res, 200, { ...meta, ...data });
    } catch (e) {
      const msg = e instanceof MetaError ? e.message : 'Something went wrong on the server. Try again.';
      console.error('search failed:', e instanceof MetaError ? `meta code ${e.code}` : e.name); // never log URLs: they contain the token
      return send(res, 502, { error: msg });
    }
  }

  function serveStatic(pathname, res) {
    const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
    const file = path.normalize(path.join(PUBLIC_DIR, rel));
    if (!file.startsWith(PUBLIC_DIR + path.sep) || !MIME[path.extname(file)]) return send(res, 404, 'Not found');
    fs.readFile(file, (err, buf) => {
      if (err) return send(res, 404, 'Not found');
      const ext = path.extname(file);
      send(res, 200, buf, {
        'Content-Type': MIME[ext],
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
        ...(ext === '.html' ? { 'Content-Security-Policy': CSP } : {}),
      });
    });
  }

  return http.createServer((req, res) => {
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch (e) { return send(res, 400, 'Bad request'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    if (url.pathname === '/healthz') return send(res, 200, 'ok');
    if (url.pathname === '/api/config') {
      return send(res, 200, { sample: !token, accessCodeRequired: !!accessCode, countries: COUNTRIES });
    }
    if (url.pathname === '/api/search') return handleSearch(url, req, res);
    return serveStatic(url.pathname, res);
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => console.log(`AdsDetective listening on ${port}${process.env.META_ACCESS_TOKEN ? '' : ' (sample mode: no Meta token set)'}`));
}

module.exports = { createServer, COUNTRIES };
