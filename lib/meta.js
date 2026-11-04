'use strict';

const FIELDS = [
  'id', 'page_id', 'page_name', 'ad_creation_time', 'ad_delivery_start_time', 'ad_delivery_stop_time',
  'ad_creative_bodies', 'publisher_platforms', 'languages', 'eu_total_reach',
]; // ad_snapshot_url is left out on purpose: Meta puts the access token inside that link.

class MetaError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'MetaError';
    this.code = code || null;
  }
}

async function fetchAds({ q, country, status = 'ACTIVE', limit = 100 }, { token, version = 'v23.0', base = 'https://graph.facebook.com', fetchImpl = fetch } = {}) {
  if (!token) throw new MetaError('No Meta access token is set on the server.', null);
  const params = new URLSearchParams({
    search_terms: q,
    search_type: 'KEYWORD_UNORDERED',
    ad_type: 'ALL',
    ad_reached_countries: JSON.stringify([country]),
    ad_active_status: status,
    fields: FIELDS.join(','),
    limit: String(limit),
    access_token: token,
  });
  let res;
  try {
    res = await fetchImpl(`${base}/${version}/ads_archive?${params.toString()}`, { signal: AbortSignal.timeout(15000) });
  } catch (e) {
    throw new MetaError('Could not reach Meta. Try again in a minute.', null);
  }
  let body = null;
  try { body = await res.json(); } catch (e) { /* fall through */ }
  if (!res.ok || (body && body.error)) {
    const code = body && body.error ? body.error.code : res.status;
    if (code === 190) throw new MetaError('The Meta access token is invalid or has expired. Create a new one and update it on the server.', code);
    throw new MetaError(`Meta returned an error (code ${code}). Check that the app has Ad Library API access and the API version is current.`, code);
  }
  return Array.isArray(body && body.data) ? body.data : [];
}

module.exports = { fetchAds, MetaError, FIELDS };
