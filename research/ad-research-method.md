# Ad research method for Claude

A repeatable way to ask Claude which ads are working in a field. It uses the public ad libraries, so it needs no API keys. Claude opens each library in a browser, reads what is there, and writes a report in a fixed format.

You need a Claude plan that can browse the web. Paste this file into a Claude Project as instructions, or paste it at the start of a chat.

## Start a research

Send the details, in any order. Missing details are fine.

> Project: a mobile card game. Goal: installs. Audience: players who like deck builders. Niche: mobile games. Country: United Kingdom. Competitors: find the main ones. Platforms: Meta, Google, TikTok, LinkedIn.

If the project or the country is missing, Claude asks one short question. Otherwise it picks sensible defaults and lists them at the top of the report.

## Sources (free, public, no sign-in)

1. Meta Ad Library: https://www.facebook.com/ads/library/
2. Google Ads Transparency Center: https://adstransparency.google.com/
3. TikTok Creative Center, Top Ads: https://ads.tiktok.com/business/creativecenter
4. LinkedIn Ad Library: https://www.linkedin.com/ad-library/

If a source is blocked, empty or needs a login, the report says so and carries on with the others. Claude never invents ads and never gets around bot checks or logins.

## Method

1. Find the main advertisers: the competitors you named plus the ones the libraries show for the keywords. Aim for 5 to 10.
2. For each advertiser, record platform, start date, number of versions, format, hook (first line or first three seconds), angle, offer, call to action and landing page.
3. Describe how each top ad looks: visual style, the opening, text on screen, colours, layout and production level. Describe in words. Do not copy or download the creative.
4. Open the landing pages of the strongest ads and note headline, offer, proof and call to action.
5. Rank by proxies, because free libraries do not show spend or conversions: long run time, many versions of one concept, presence on several platforms, several competitors using the same angle.
6. Group by angle and hook, and separately by visual style. Count how many advertisers use each.
7. Find gaps: angles, formats, visual styles or offers that few advertisers use.

## Honesty rules

- Every ad has a source: platform, advertiser and a link.
- Every ad has a confidence label. High means seen directly in the library. Medium means inferred from run time or volume. Low means unclear.
- The report says plainly that spend, reach and conversions are not available for regular ads. A long run time is a signal, not proof.
- Creatives are described in the researcher's own words. Competitor ads are inspiration for angle and structure only.
- The report names which sources and advertisers were covered and which were not.

## Report format

See [report-template.md](report-template.md). An invented example is in [../examples/sample-report.md](../examples/sample-report.md).

## What this method cannot do

- It is slower than the web app, usually a few minutes per research.
- It depends on the libraries staying open to a browser. Layouts change, so a source may fail on a given day.
- It reads what is public. It cannot tell you what an ad cost or whether it converted.
