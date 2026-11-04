'use strict';

// Invented data for sample mode. None of these advertisers are real.
const SAMPLE = [
  ['Sample Studio Alpha', 214, 9, 'Sample: a mobile RPG pushing a free first week.', ['facebook', 'instagram'], 480000, ['Long runner', 'Many ads']],
  ['Sample Esports Club', 151, 4, 'Sample: season ticket for a tournament weekend.', ['facebook', 'instagram'], 95000, ['Long runner']],
  ['Sample Gear Co', 126, 6, 'Sample: a headset with a thirty day trial.', ['facebook', 'instagram', 'messenger'], 210000, ['Long runner', 'Many ads']],
  ['Sample Indie Games', 73, 3, 'Sample: wishlist the demo before launch day.', ['facebook'], 38000, []],
  ['Sample Cloud Play', 58, 7, 'Sample: play big games on any screen.', ['facebook', 'instagram', 'audience_network'], 160000, ['Many ads']],
  ['Sample Creator Hub', 31, 2, 'Sample: streamers share a weekly challenge.', ['instagram'], 22000, []],
  ['Sample Card Battler', 12, 5, 'Sample: build a deck and challenge a friend.', ['facebook', 'instagram'], 51000, ['Many ads']],
  ['Sample Retro Pad', 6, 1, 'Sample: a pocket console for old favourites.', ['facebook'], null, ['New']],
];

function sampleResult() {
  const today = new Date();
  const advertisers = SAMPLE.map(([advertiser, days, adCount, snippet, platforms, maxReach, signals]) => ({
    advertiser,
    pageId: '',
    adCount,
    activeCount: adCount,
    longestDays: days,
    firstSeen: new Date(today.getTime() - days * 86400000).toISOString().slice(0, 10),
    platforms,
    languages: ['en'],
    maxReach,
    snippet,
    signals,
    adLibraryUrl: null,
  }));
  return { advertisers, totals: { advertisers: advertisers.length, ads: advertisers.reduce((n, a) => n + a.adCount, 0) } };
}

module.exports = { sampleResult };
