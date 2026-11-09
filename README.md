# AdsDetective

**Find out which gaming and esports ads keep running on Meta.**

**Who it's for:** marketers, creative strategists and researchers in gaming and esports who want to see which competitors' ads keep running.

AdsDetective is a small research tool. You pick a topic and a country. It reads Meta's public Ad Library and ranks advertisers by how long their ads stay live. A long run is a useful clue that an ad pays for itself. It is a clue, not proof.

👉 **Live demo:** https://amachadod.github.io/adsdetective/ (sample data)

Portfolio project by Alberto Machado Domínguez. The advertisers in the demo are fictional.

## What it does

There are two ways to use it. They share the same idea and the same honesty rules.

1. **The web app.** A tiny Node server and one page. Type a topic, choose a country, get ranked case files with a link to each ad in Meta's library. A cartoon detective walks around and follows your cursor.
2. **The research method for Claude.** A plain-English playbook that asks Claude to open the public ad libraries of Meta, Google, TikTok and LinkedIn and write a report in a fixed format. See [`research/`](research/).

## Which setup is right for you?

| | Web app | Research in Claude |
|---|---|---|
| Sources | Meta Ad Library API | Meta, Google, TikTok and LinkedIn libraries, read in a browser |
| Speed | Seconds | A few minutes |
| Needs | A Meta access token to show real data | A Claude plan that can browse |
| Covers | Ads delivered in the UK and the EU | Anything the libraries show |
| Output | Ranked case files on a page | A written report with visual notes and a test plan |
| Cost | Free tier of a host is enough | Your Claude plan |

Rule of thumb: use the web app for quick checks on Meta, and the Claude method when you want several platforms and a written report.

## How the web app works

```
Browser ──► /api/search ──► Meta Ad Library API
   ▲              │
   │              └─ group ads by advertiser, work out run time
   └──────── ranked case files ◄──────────────┘
```

1. You type a topic and choose a country (UK or an EU country).
2. The server asks Meta's Ad Library API for matching ads.
3. It groups the ads by advertiser and works out how long each has been running.
4. It returns the advertisers, longest-running first. Each links to the ad in Meta's own library.

## What a case file shows

- Advertiser, number of ads found, first seen date, platforms.
- Days the longest ad has been running, as a bar.
- The largest estimated reach of a single ad, when Meta gives one (UK and EU ads).
- A short snippet of the ad text and a signal: Long runner, Many ads or New.
- A note that the signal is inferred from run time, with medium confidence.

## Safeguards

- **The token stays on the server.** The browser never sees it. A test checks this. The `ad_snapshot_url` field is not requested because Meta puts the token inside that link.
- **Ad text is untrusted.** It is shown as plain text, never as code. Links are built only from numeric ad ids.
- **Nothing is stored.** Searches are not saved. Results are cached in memory for ten minutes. Ad images and videos are never downloaded.
- **Input is checked.** Search text length, country and status are validated. There is a rate limit per visitor and an optional access code.
- **Logs hold no content.** The server logs an error code at most, never a URL or ad text.
- **Sample mode is labelled.** Without a token the page shows invented advertisers, each marked Sample.

## Try it without any accounts

You need Node 18 or newer. There are no dependencies to install.

```bash
node server.js     # http://localhost:3000, sample mode
npm test           # 12 tests
```

## Use real data

1. Confirm your identity at facebook.com/ID. Meta says this can take a few days.
2. Create a Meta for Developers account and an app.
3. Open Meta's Ad Library API page, follow the steps and generate an access token.
4. Start the server with the token in the environment:

```bash
META_ACCESS_TOKEN=your-token node server.js
```

| Variable | What it does |
|---|---|
| `META_ACCESS_TOKEN` | Your Meta access token. Keep it secret. Without it the app shows sample data. |
| `META_API_VERSION` | Graph API version. Check Meta's documentation for a current one. Default `v23.0`. |
| `ACCESS_CODE` | Optional. If set, visitors must type this code to search. |
| `RATE_LIMIT_PER_MIN` | Optional. Searches per minute per visitor. Default 20. |

## Deploy on Render (free tier)

1. Fork or copy this repository.
2. On Render choose **New, Web Service** and connect the repository.
3. Runtime **Node**, build command `npm install`, start command `node server.js`, instance type **Free**, health check path `/healthz`.
4. Add the environment variables above in Render's **Environment** tab. Put the token there, never in the code.

`render.yaml` describes the same setup. The free tier sleeps when idle, so the first visit after a pause takes a moment.

## Costs

Node, GitHub Pages, the Meta Ad Library API and a free Render instance cost nothing. The Claude method uses your own Claude plan.

## Limitations

- Meta gives full ad data only for ads delivered in the **UK and the EU**. Other countries return political ads only.
- Spend, impressions and conversions are not available for regular ads. Run time is the signal.
- The live demo uses sample data, because a static page cannot hold a token.
- The Meta connection is tested against a fake Meta server in the tests. It has not been run against live Meta data yet.
- Check Meta's Ad Library API terms, including its rules on storing data, before using real results.

## Project structure

```
server.js            tiny Node server: /api/config, /api/search, static files
lib/
  meta.js            calls the Ad Library API
  aggregate.js       groups ads by advertiser and works out run time and signals
  sample.js          invented advertisers for sample mode
docs/                the single-file front end and the GitHub Pages demo
research/            the research method for Claude and the report template
examples/            an invented example report
brand/               logo files and the brand guidelines PDF
test/                12 tests with node:test
render.yaml          Render setup
```

## Brand

Colours: Deep Pompeian Red `#8F2F3D`, Cameo Pink `#E6C9C8`, Dark Tyrian Blue `#27346B`, Light Glaucous Blue `#AFBDCA`. Fonts, all under the SIL Open Font License: Bagel Fat One, Anton and Inter Tight. The detective is an original character. See [`brand/`](brand/).

## Tech

Node.js, plain HTML, CSS and JavaScript, `node:test`. No dependencies.

## More tools

[Plano](https://amachadod.github.io/plano/), [Minuta](https://amachadod.github.io/minuta/) and [Posta](https://amachadod.github.io/posta/).

## License

MIT. See [LICENSE](LICENSE). Meta, Facebook and Instagram are trademarks of Meta Platforms, Inc. AdsDetective is not affiliated with or endorsed by Meta.

---
Built by Alberto Machado Domínguez · [albertomachdom@gmail.com](mailto:albertomachdom@gmail.com) · [LinkedIn](https://www.linkedin.com/in/alberto-machado-dom%C3%ADnguez-708290251/)
