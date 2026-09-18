# Ooredoo Qatar — Amplitude demo app

A mobile-styled web app that reproduces the look of the real **Ooredoo Qatar** consumer app
(App Store / Google Play `qa.ooredoo.android`), built as a static site for a browser demo on a Mac.
The whole UI lives inside a centred 390×844 phone frame with a bottom tab bar; everything outside
the frame is a neutral backdrop.

Publishes to **https://khaledismail-sandbox.github.io/ooredoo-demo/**

---

## The story this demo tells

A long-tenured postpaid customer on a **legacy** Shahry plan goes over their data quota month after
month and pays overage — but the app's "See what's using your data" control **does nothing** on
their plan generation. They tap it, nothing happens, they tap it again, and then they leave the plan
list without upgrading.

| Step | Event |
|---|---|
| 1 | `App Home Opened` |
| 2 | `Usage Summary Viewed` |
| 3 | `Plan Options Viewed` |
| 4 | `Plan Upgrade Started` |
| 5 | `Plan Upgrade Confirmed` (revenue) |

Friction: `Usage Breakdown Tap Unresponsive` + native `[Amplitude] Dead Click` / `[Amplitude] Rage Click`.
Drop-off: `Plan Comparison Abandoned`.
The experiment `usage-breakdown-tap-unresponsive-reduction` tests whether a **consumption-based
recommendation** on the plan cards recovers the upgrade — without fixing the broken control.

---

## Personas and the hidden toggle

At the very bottom of `/login` there is a ~20 px unlabelled grey switch that reads as footer
decoration. It silently decides which persona the **next** login resolves to. Nothing in the UI
names a persona.

| | Toggle **off** (default) | Toggle **on** |
|---|---|---|
| `usage_insights_enabled` | `false` | `true` |
| `plan_generation` | `legacy` | `current` |
| `nojoom_tier` | `nojoom_basic` | `nojoom_gold` |
| `account_age_days` | `410` | `520` |
| `device_type` | `mobile` | `mobile` |
| `avg_monthly_gb` | 38 | 24 |
| `months_over_quota` | 2 | 0 |
| `overage_charge_qar` | 45 | 0 |
| `quota_exceeded` | `true` | `false` |
| Current plan | Shahry Legacy 30 GB · QAR 175 | Shahry 40 GB · QAR 175 |
| Breakdown control | **inert** (fires the friction event) | works → `/usage/breakdown` |
| `/usage` anchor | `Usage Insights Unavailable` | `Usage Insights Loaded` |

The user id is `<name>_<demoNumber>_<YYYYMMDD>` (e.g. `khaled_1_20260917`), previewed live on the
login screen. The session persists in `localStorage` keyed to today's date; **Log out** (under
**More**) calls `amplitude.reset()`.

---

## Demo scripts

### Before — the friction (2 min)

1. Open `/` → **Log in** → name `khaled`, demo number `1`, leave the footer toggle alone → **Log In**.
2. Home: over-quota data card, `QAR 220.00` bill, Nojoom Basic.
3. **All allowances** → `/usage`: 38.0 GB of 30 GB, `QAR 45.00` overage, over quota in 2 of 3.
4. Tap **See what's using your data** four or five times. Nothing happens.
   → 4–5 × `Usage Breakdown Tap Unresponsive` + `[Amplitude] Dead Click` + `[Amplitude] Rage Click`.
5. **Compare plans** → `/plans`: six plans described in **GB only** — nothing tells them which one
   fits. Tap the same broken control here too.
6. Tap **Home** → `Plan Comparison Abandoned`.

### After — the treatment (1 min)

Open `/plans?variant=treatment`. The list filters to the plans that fit, and the best-fit card reads:

> Based on your last 3 months (avg 38 GB, over quota in 2 of 3), Shahry 60 GB fits your usage and
> would have saved you QAR 45/month.

→ `Plan Recommendation Shown`, then **Choose plan** → **Upgrade to this plan** → promo `OOREDOO10`
→ **Confirm upgrade** → `Plan Upgrade Confirmed` with `revenue` / `price` / `quantity` /
`revenueType` and `mrr_delta_qar` / `overage_avoided_qar`.

### The standalone "after" page

`/plans/recommended` — recommendation cards **and** a working per-app usage breakdown. Nothing in
the app links to it and it never reads the experiment flag; type the URL to show the manual
before/after. It fires `[Amplitude] Page Viewed` only — no taxonomy events.

### Persona A (the working-app comparison)

Log out → on `/login` tap the small grey switch in the footer → log in again. Now the breakdown
control works, `/usage/breakdown` lists per-app GB, and `/usage` fires `Usage Insights Loaded`.

---

## Routes

| Route | Page title |
|---|---|
| `/` | Ooredoo Qatar — Home |
| `/login` | Log In |
| `/usage` | My Usage |
| `/usage/breakdown` | Usage Breakdown |
| `/plans` | Upgrade Your Plan |
| `/plans/:planId` | Plan Detail |
| `/plans/upgrade` | Confirm Upgrade |
| `/plans/confirmation` | Upgrade Confirmed |
| `/plans/recommended` | Recommended Plans *(standalone, unlinked)* |
| `/bill` | My Bill |
| `/help` | Help |
| `/search` | Search Plans |
| `/nojoom` | Nojoom *(tab-bar slot)* |
| `/more` | More *(tab-bar slot, holds Log out)* |

`/nojoom` and `/more` exist so all five required tab slots navigate to something real — a dead tab
would manufacture false dead-click signals and pollute the friction story.

Deep links work on GitHub Pages: `404.html` is a byte-identical copy of `index.html`, and the
base path (`/ooredoo-demo`) is derived from `location.pathname` at boot, so the same files also work
at a domain root or under any other repo name.

---

## Plans catalog

| id | Plan | Family | Data | QAR/month |
|---|---|---|---|---|
| `data_add_on_20` | Shahry Data Add-On 20 GB | `data_add_on` | 20 GB | 125 |
| `shahry_40` | Shahry 40 GB | `shahry_postpaid` | 40 GB | 175 |
| `shahry_60` | Shahry 60 GB | `shahry_postpaid` | 60 GB | 220 |
| `qatarna_plus_100` | Qatarna+ 100 GB | `qatarna_plus` | 100 GB | 300 |
| `home_plus_250` | Shahry Home+ 250 GB Bundle | `home_plus_bundle` | 250 GB | 380 |
| `family_share_300` | Shahry Family Share 300 GB | `family_share` | 300 GB | 450 |

Promo code: **`OOREDOO10`** (10 % off for 3 months). Activation fee QAR 0 (waived), tax QAR 0
(no tax in Qatar).

---

## Amplitude wiring

API key `0d135cb349890f3715863642f065bcbd`, loaded from the unified CDN smart loader in `<head>`
(never npm) plus the engagement script for Guides & Surveys.

```js
if (window.sessionReplay) amplitude.add(window.sessionReplay.plugin({ sampleRate: 1 }));
if (window.engagement)    amplitude.add(window.engagement.plugin());
amplitude.init("0d135cb349890f3715863642f065bcbd", {
  fetchRemoteConfig: true,
  autocapture: {
    attribution: false, pageViews: false, sessions: false, formInteractions: false,
    fileDownloads: false, elementInteractions: false,
    frustrationInteractions: true   // dead clicks + rage clicks ONLY
  }
});
```

Everything else is fired explicitly by name — no autocaptured element event stands in for a
taxonomy event.

* **Experiment SDK** — checked after load and again 3 s later. Detected at runtime as
  `window.Experiment` + `window.webExperiment`. If it is ever missing, the console gets a red
  banner error, an in-frame dev notice appears, and the flag defaults to **control**.
* **Frustration path** — the loader's Browser SDK version is read from the resolved bundle URL
  (`analytics-browser-<version>`). Verified **2.42.4**, so **native** autocapture owns dead/rage
  clicks. If the version cannot be read, a fallback detector is armed (dead click = no DOM change
  within 3 s; rage click = ≥3 clicks on one element within 2 s) that fires
  `[Amplitude] Dead Click` / `[Amplitude] Rage Click` via `amplitude.track` with
  `[Amplitude] Element Selector` / `Element Text` / `Element Tag`. It stands itself down the moment
  native support or a native event is observed, so the signal is never dropped and never doubled.
  The active path is logged to the console and exposed at `window.__OOREDOO__.frustration.mode`.
* **Page views** — `[Amplitude] Page Viewed` on every route change with exactly the five
  `[Amplitude] Page *` properties. Values are canonicalised to the production origin so local and
  GitHub Pages data are identical.
* **Attribution** — `utm_source` / `utm_medium` / `utm_campaign` parsed at boot (defaulting to
  `direct`), `initial_utm_*` with `setOnce`, plus `referrer` / `referring_domain`. Nothing can
  resolve to `(none)`: `country: "Qatar"` is on every custom event as an event property **and** as
  Amplitude's reserved country in event options.

### Session Replay masking — read this before demoing replays

This project's Session Replay remote config currently returns
`sr_privacy_config.defaultMaskLevel: "medium"`, and **the Amplitude UI setting always wins over SDK
code**. `medium` masks every input value but leaves headings, labels and button text visible — which
is what this story needs ("See what's using your data" stays readable in the replay). If you want
input values visible too, change it in the Amplitude UI, not here. The init block above is the one
the spec fixed verbatim, so it deliberately does not pass a local `privacyConfig`.

### Live event log

```js
__OOREDOO__.events        // everything this app tracked: { name, props, options }
__OOREDOO__.outgoingFull  // what the SDK actually sent, incl. reserved revenue fields
__OOREDOO__.frustration   // { mode: 'native' | 'fallback', nativeSeen, fired }
__OOREDOO__.experiment    // { present, variant, source }
__OOREDOO__.sdk           // { version, frustrationNativeSupported }
```

### Demo query parameters

| Parameter | Effect |
|---|---|
| `?variant=treatment` | force the treatment arm (sticky) |
| `?variant=control` | force the control arm (sticky) |
| `?utm_source=…&utm_medium=…&utm_campaign=…` | drive campaign attribution |

---

## Event taxonomy

| Event | Trigger |
|---|---|
| `App Home Opened` | `/` route entry |
| `Logged In` | successful `/login` submit |
| `Usage Summary Viewed` | `/usage` route entry |
| `Usage Insights Loaded` | `/usage` entry, Persona A only |
| `Usage Insights Unavailable` | `/usage` entry, Persona B only |
| `Usage Breakdown Tap Unresponsive` | each tap of the inert control (Persona B), on `/usage` and `/plans` |
| `Plan Options Viewed` | `/plans` route entry, after the flag resolves |
| `Plan Recommendation Shown` | `/plans` entry, treatment arm only, once per visit |
| `Plan Family Browsed` | family filter chip on `/plans` |
| `Plan Shortlisted` | bookmark icon on a plan card or plan detail |
| `Recommended Plan Tapped` | "Recommended for you" card on Home |
| `Plans Searched` | `/search` — Enter, or 700 ms after typing ≥2 characters |
| `Plan Upgrade Started` | "Upgrade to this plan" on `/plans/:planId` |
| `Upgrade Promo Applied` | **Apply** on the `/plans/upgrade` promo field |
| `Plan Upgrade Confirmed` | **Confirm upgrade** — carries reserved `revenue`/`price`/`quantity`/`revenueType` |
| `Plan Comparison Abandoned` | leaving `/plans` with no upgrade started in that visit (including tab-hidden) |
| `Upgrade Offer Viewed` | `/bill` route entry (offer banner render) |
| `Help Article Read` | star rating inside an open `/help` article |
| `Session Ended` | `visibilitychange` → hidden |
| `[Amplitude] Page Viewed` | every route change |
| `[Amplitude] Dead Click` / `[Amplitude] Rage Click` | native autocapture (fallback detector if unsupported) |

---

## Files

```
ooredoo-demo/
├── index.html            phone frame + Amplitude loader + base-path bootstrap
├── 404.html              byte-identical copy — the GitHub Pages SPA deep-link fallback
├── .nojekyll
├── README.md
└── assets/
    ├── css/app.css       design system sampled from the real app
    └── js/
        ├── core.js       config, personas, plans, state, router
        ├── analytics.js  Amplitude init, tracking gate, experiment, frustration paths
        ├── ui.js         logo SVG, icons, headers, tab bar, components
        ├── views.js      every route view and every UI trigger
        └── boot.js       start-up order
```

## Publish

```bash
cd ~/Desktop/ooredoo-demo
git init -b main
git add -A
git commit -m "Ooredoo Qatar Amplitude demo app"
git remote add origin https://github.com/khaledismail-sandbox/ooredoo-demo.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.

## Local preview

The site is static — any static server works, but it must be served under a `/ooredoo-demo/` path
with a 404 fallback to match GitHub Pages:

```bash
cd ~/Desktop && python3 -m http.server 4321
```

then open `http://localhost:4321/ooredoo-demo/`. (Deep links need the 404 fallback; plain
`http.server` returns a real 404 for `/ooredoo-demo/plans`, so navigate in-app from the home screen,
or use the GitHub Pages URL.)
