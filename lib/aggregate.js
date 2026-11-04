'use strict';

const DAY = 86400000;

function toDate(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function cleanText(s, max = 110) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

function isoDay(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Turns the flat list of ads from Meta into one entry per advertiser (Facebook Page).
 * Run time is the main signal. Meta does not give spend or conversions for regular ads.
 */
function aggregate(ads, now = new Date()) {
  const groups = new Map();
  for (const ad of Array.isArray(ads) ? ads : []) {
    const start = toDate(ad.ad_delivery_start_time || ad.ad_creation_time);
    if (!start) continue;
    const stop = toDate(ad.ad_delivery_stop_time);
    const active = !stop || stop >= now;
    const end = active ? now : stop;
    const days = Math.max(0, Math.floor((end - start) / DAY));
    const key = String(ad.page_id || ad.page_name || 'unknown');
    let g = groups.get(key);
    if (!g) {
      g = {
        pageId: String(ad.page_id || ''),
        advertiser: cleanText(ad.page_name || 'Unknown advertiser', 80),
        adCount: 0,
        activeCount: 0,
        longestDays: -1,
        longestAdId: null,
        firstSeen: start,
        platforms: new Set(),
        languages: new Set(),
        maxReach: null,
        snippet: '',
      };
      groups.set(key, g);
    }
    g.adCount += 1;
    if (active) g.activeCount += 1;
    if (start < g.firstSeen) g.firstSeen = start;
    if (days > g.longestDays) {
      g.longestDays = days;
      g.longestAdId = /^\d+$/.test(String(ad.id)) ? String(ad.id) : null;
      const body = Array.isArray(ad.ad_creative_bodies) ? ad.ad_creative_bodies[0] : '';
      g.snippet = cleanText(body);
    }
    for (const p of Array.isArray(ad.publisher_platforms) ? ad.publisher_platforms : []) g.platforms.add(String(p).toLowerCase());
    for (const l of Array.isArray(ad.languages) ? ad.languages : []) g.languages.add(String(l).toLowerCase());
    const reach = Number(ad.eu_total_reach);
    if (Number.isFinite(reach) && reach > 0) g.maxReach = Math.max(g.maxReach || 0, reach);
  }

  const out = [...groups.values()].map((g) => {
    const sinceFirst = Math.floor((now - g.firstSeen) / DAY);
    const signals = [];
    if (g.longestDays >= 90 && g.activeCount > 0) signals.push('Long runner');
    if (g.adCount >= 5) signals.push('Many ads');
    if (sinceFirst <= 14) signals.push('New');
    return {
      advertiser: g.advertiser,
      pageId: g.pageId,
      adCount: g.adCount,
      activeCount: g.activeCount,
      longestDays: Math.max(0, g.longestDays),
      firstSeen: isoDay(g.firstSeen),
      platforms: [...g.platforms].sort(),
      languages: [...g.languages].sort(),
      maxReach: g.maxReach,
      snippet: g.snippet,
      signals,
      adLibraryUrl: g.longestAdId ? `https://www.facebook.com/ads/library/?id=${g.longestAdId}` : null,
    };
  });

  out.sort((a, b) => b.longestDays - a.longestDays || b.adCount - a.adCount || a.advertiser.localeCompare(b.advertiser));
  return out;
}

module.exports = { aggregate, cleanText };
