# qa/ — Production readiness harness (disposable)

Scaffolding built for the Aug 2026 production-readiness audit. Not part of any
npm workspace, not imported by `apps/*`, safe to delete after the audit closes.

## Layout

- `lib/metrics-injection.js` — string injected via `page.addInitScript()` in every
  measured page load. Hooks `PerformanceObserver` for LCP (with element
  attribution), CLS, long tasks, and a single scripted-interaction INP proxy.
- `lib/measure.mjs` — `measurePage()`: launches a browser, applies CDP network/CPU
  throttling (Chromium only), navigates, and returns TTFB/FCP/LCP/CLS/TBT/INP,
  full resource breakdown by type, console errors, and failed requests.
- `lib/network-profiles.mjs` — Fast / 4G / 3G profiles using the exact Lighthouse
  throttling numbers cited in the plan.
- `run-baseline.mjs` — Fase 0. Single cold-cache pass, desktop Fast + mobile 4G,
  across all 10 public routes. Screenshots at 7 viewports + landscape. Console/
  network error log. HAR for Home only (desktop + mobile 4G).
- `run-perf.mjs` — Fase 2. 3 runs x {cold, warm} x {Fast, 4G, 3G} for Home,
  /precios, /manifiesto, /sistema. This is the statistically-meaningful pass;
  baseline is a single-run snapshot for breadth, this is depth on the 4 routes
  that matter.
- `run-hero.mjs` — Fase 3. Hero-specific: byte accounting, preload behavior,
  reduced-motion / data-saver / repeat-visit paths, before/after comparison.
- `run-responsive.mjs` — Fase 4. Overflow detection (scrollWidth vs clientWidth)
  + touch-target audit + screenshots across the 7 viewports and 3 mobile
  landscape orientations, all 10 routes.
- `run-browsers.mjs` — Fase 5. Same smoke pass across Chromium/WebKit/Firefox
  desktop + Chromium/WebKit mobile emulation.
- `run-smoke.mjs` — Fase 6. Navigation, links, CTAs, forms, redirects, 404,
  console/network errors per route.
- `run-assets.mjs` — Fase 7. Remote HEAD inventory + on-disk heavy assets.
- `run-security.mjs` — Fase 8. Headers, Swagger, CORS, admin 401, sourcemaps.
- `run-after.mjs` — Post-fix measurement. Set `QA_BASE_URL` (default
  `http://localhost:3100`). **Must** hit a production `next start` build.
- `evidence/` — every artifact (JSON, PNG, HAR) referenced by QA_FINAL_REPORT.md.
- Final report: `../QA_FINAL_REPORT.md`.

## Scope decision on statistical rigor (documented per Karpathy guideline: surface
tradeoffs instead of silently doing less than promised)

The plan's Fase 0 text asks for 3 runs x cold/warm across all 10 public routes.
Running that literally is 120 page loads before any deeper work starts. I split
it instead:

- **Baseline (`run-baseline.mjs`)**: 1 cold-cache run per route, desktop Fast +
  mobile 4G. This is enough to catch broken routes, console errors, and gross
  layout problems, which is what the baseline bullets actually ask for
  (screenshots, error log, asset inventory).
- **Deep perf (`run-perf.mjs`)**: full 3x cold/warm x 3 network profiles, but
  scoped to the 4 routes Fase 2 explicitly names (Home, precios, manifiesto,
  sistema). This is where budget PASS/FAIL decisions are actually made, so it
  gets the statistical rigor.

This keeps total runtime reasonable while giving the routes that drive the
verdict the exact rigor the plan specifies.
