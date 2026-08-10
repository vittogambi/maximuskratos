# Maximus Kratos — QA Final Report

**Date:** 2026-08-10  
**Baseline commit (staging):** `d6c2726` (`dev`, synced with `origin/dev`)  
**Staging web:** https://mkweb-staging.up.railway.app  
**Staging API:** https://mkapi-staging.up.railway.app  
**AFTER measurements:** local production build (`next build` + `next start` on `:3100`) with fixes applied  

**Method notes:** Lab INP is a proxy, not field data. Playwright WebKit ≠ Safari iOS. Performance AFTER must be measured on a production build (dev mode invalidates budgets).

---

## 1. Executive Summary

**Verdict: GO WITH KNOWN NON-BLOCKERS**

The Early Access public site is production-ready after the fixes in this working tree are **deployed**. Lab gates for Home performance (desktop + mobile 4G), functional smoke, auth API matrix, and hero sequence (video → image preserved) all pass on the local production build.

Remaining non-blockers: real-device Safari/Chrome Android checklist still `NOT VERIFIED`, contrast warnings on action-red labels, admin HTML shell reachable without auth (API still 401), and Early Access gaps (diagnostic, payments, subscription enforcement) classified as `OUT OF SCOPE — EARLY ACCESS`.

| Area | Result |
| ---- | ------ |
| Functional | **PASS** |
| Responsive | **PASS** (drawer overflow = false positive) |
| Browser (lab) | **PASS** |
| Browser (real devices) | **NOT VERIFIED** — see checklist |
| Performance (local AFTER) | **PASS** gates |
| Performance (staging BEFORE) | **FAIL** (superseded by fixes; redeploy required) |
| SEO Technical | **PASS** (fixes local) |
| Accessibility | **PASS WITH NOTES** |
| Security Sanity | **PASS** after deploy of local fixes |
| Regression | **PASS** (local) |

---

## 2. Functional Tests

| Área | Estado | Evidencia | Problemas |
| ---- | ------ | --------- | --------- |
| Public routes (10) | PASS | `qa/evidence/smoke/smoke-results.json` | Guest `auth/refresh` 401 noise in console (P3) |
| Redirects (4) | PASS | smoke redirects | — |
| 404 | PASS | smoke `notFound.status=404` | — |
| Contact form validation | PASS | smoke `contactValidation` | — |
| Nav / CTAs / links | PASS | smoke link audits | — |
| Register / login / logout | PASS | `qa/evidence/auth/auth-results.json` 26/26 | — |
| Password reset | PASS | `qa/evidence/auth/auth-reset-results.json` | — |
| Plans API → `/precios` | PASS | staging `GET /api/v1/billing/plans` | Admin create UI still limited (P3 / EA) |

---

## 3. Authentication

**Status: PASS** (local API + staging API probes)

| Check | Result |
| ----- | ------ |
| Register | 201 + access token; no password fields in body |
| Duplicate email | 409 |
| Validation | 400 on bad email / short password |
| Mass assignment (`role`) | 400 `forbidNonWhitelisted` |
| Login | cookie `mk_refresh` set; wrong password 401; no enumeration |
| `/auth/me` | 401 without token |
| Refresh rotation | covered in auth harness |
| Admin endpoints | 401 without token |

Evidence: `qa/evidence/auth/`.

---

## 4. Authorization

**Status: PASS for Early Access surface**

- Admin API: `JwtAuthGuard` + `RolesGuard` → 401/403 without ADMIN.
- Member routes: client guards only (middleware no-op). API still enforces Bearer auth for protected endpoints.
- `SubscriptionGuard` is a stub → classified **OUT OF SCOPE — EARLY ACCESS** (not a BUG for this release).

---

## 5. Trial

**Status: OUT OF SCOPE — EARLY ACCESS**

Registration creates `Subscription.status=TRIAL` with `trialEnd: null` by design (clock starts at platform launch). No expiry enforcement in this release. Documented, not failed.

---

## 6. Plans

**Status: PASS WITH NOTES**

- Source of truth: DB + `GET /api/v1/billing/plans` (not hardcoded in web).
- Admin can edit plans via API; create endpoint exists; UI create still thin (P3).
- `PlanFeature` / structured limits: **OUT OF SCOPE — EARLY ACCESS**.

---

## 7. Subscriptions

**Status: OUT OF SCOPE — EARLY ACCESS**

No `planId` on Subscription, no Payment model, MercadoPago not integrated. `BillingProvider` interface exists but unwired. Correct classification: not ready for paid lifecycle; not a smoke-test failure for public EA site.

---

## 8. Admin

**Status: PASS WITH NOTES (sanity only)**

| Check | Result |
| ----- | ------ |
| API without auth | 401 |
| HTML `/admin` without auth | 200 shell (client redirect) — P2 architecture |
| Exhaustive admin UX QA | Not in EA release scope |

---

## 9. API

Documented in audit exploration (24 endpoints under `/api/v1`). Auth matrix in `qa/evidence/auth/`. Swagger closed when `NODE_ENV=production` (local fix). Rate limits active on staging.

---

## 10. Database

Schema supports users, refresh tokens, plans, billing settings, stub subscriptions, diagnostic domain. Gaps for paid lifecycle listed as OUT OF SCOPE. No P0 integrity bugs found in EA auth paths (unique email, hashed refresh tokens).

---

## 11. Security

| ID | Severity | Staging BEFORE | Local AFTER | Status |
| -- | -------- | -------------- | ----------- | ------ |
| SEC-HDR-WEB-01 | P1 | Missing HSTS / XCTO / XFO / RP | All present | **FIXED** (deploy needed) |
| SEC-HDR-API-01 | P1 | Missing helmet headers | helmet active | **FIXED** (deploy needed) |
| SEC-SWAGGER-01 | P1 | `/api/v1/docs` 200 | gated on `NODE_ENV!==production` | **FIXED** (deploy needed) |
| SEC-ADMIN-01/02 | — | 401 | 401 | PASS |
| SEC-CORS-01 | — | evil origin denied | — | PASS |
| SEC-RATE-01 | — | present | — | PASS |
| SEC-ADMIN-SHELL-01 | P2 | `/admin` 200 HTML | unchanged | OPEN (known non-blocker) |
| SEC-SOURCEMAP-01 | — | no map found | — | PASS |

Evidence: `qa/evidence/security/security-results.json`.

---

## 12. Responsive

| Check | Result | Evidence |
| ----- | ------ | -------- |
| 7 viewports + 3 landscape, 10 routes | Screenshots captured | `qa/evidence/responsive/screenshots/` |
| Horizontal overflow | 3 reports on `/manifiesto` mobile | Culprit = off-canvas `mobile-drawer` (false positive) |
| Local spot-check after fixes | 0 overflows | `qa/evidence/regression/local-overflow-spotcheck.json` |
| Touch targets &lt; 44px | Many text links / hamburger 40px | P3 |

---

## 13. Performance

### Budgets (from plan)

**Desktop fast — Gate:** LCP ≤2.5s, FCP ≤1.8s, CLS ≤0.10, weight ≤2.0MB, reqs ≤70  
**Mobile 4G — Gate:** LCP ≤4.0s, FCP ≤3.0s, CLS ≤0.10, weight ≤1.5MB

### BEFORE (staging @ d6c2726, cold)

| Route | Profile | LCP | FCP | CLS | Bytes | LCP element |
| ----- | ------- | --- | --- | --- | ----- | ----------- |
| `/` | desktop-fast | 1.51s | 1.24s | 0.002 | **7.3 MB** | `statue-beam-dark.webp` |
| `/` | mobile-4g | **14.2s** | 2.24s | 0.001 | **4.4 MB** | `span.ag-hero-signature__line` |
| `/manifiesto` | mobile-4g | **12.8s** | 3.3s | 0.001 | 2.5 MB | `about-systems.png` (raw) |
| `/sistema` | mobile-4g | **14.7s** | 4.1s | 0.001 | 2.8 MB | dashboard PNG (raw) |
| `/precios` | mobile-4g | 3.9s | 2.9s | 0.001 | 0.58 MB | text |

Deep perf medians (3 runs): Home mobile-4g-cold LCP ≈ 8.5–14s. **Gate FAIL.**

Root cause chain (Home):
1. Desktop: `statue-beam-lit-hd.png` **3.10 MB** selected; WebP sibling unused.
2. Mobile: eager below-fold raw PNGs (1.3MB columns + dashboard mocks) + support copy at `opacity:0` until 1.72s after intro → text LCP ~6–14s.
3. `public/*` served with `max-age=0`.

Evidence: `qa/evidence/baseline/`, `qa/evidence/perf/perf-results-latest.json`, HARs under `qa/evidence/baseline/har/`.

### AFTER (local production build)

| Route | Profile | LCP | FCP | CLS | Bytes | Img bytes | Gate |
| ----- | ------- | --- | --- | --- | ----- | --------- | ---- |
| `/` | desktop-fast | **0.16s** | 0.05s | 0.000 | **1.14 MB** | 0.52 MB | **PASS** |
| `/` | mobile-4g | **1.7–1.9s** | 1.7–1.9s | 0.003 | **1.12 MB** | 0.18 MB | **PASS** |
| `/manifiesto` | mobile-4g | **1.86s** | 1.86s | 0.001 | 0.71 MB | 0.04 MB | **PASS** |
| `/precios` | mobile-4g | **3.6s** | 1.77s | 0.001 | 0.61 MB | ~0 | **PASS** |

Hero assets AFTER (desktop): `statue-beam-lit.webp` 319KB (not 3.10MB PNG), video 322KB, `preload=metadata`, lit WebP `<source>` present.

Evidence: `qa/evidence/regression/after-results-v2.json`, hero screenshots in `qa/evidence/regression/`.

---

## 14. Network Conditions

| Profile | Finding |
| ------- | ------- |
| Fast | Desktop gates pass AFTER |
| 4G | Home LCP pass AFTER; FCP pass |
| 3G | Resilience OK on staging deep run (slow but progresses); no blank-forever |
| Offline | NOT VERIFIED end-to-end (no offline shell by design) |

---

## 15. Mobile Devices

| Surface | Status |
| ------- | ------ |
| Emulated mobile Chromium/WebKit | PASS (browsers harness) |
| Real Safari iOS | **NOT VERIFIED** — `qa/evidence/regression/manual-device-checklist.md` |
| Real Chrome Android | **NOT VERIFIED** — same checklist |

---

## 16. SEO

| Check | Status |
| ----- | ------ |
| titles / canonical / OG / Twitter | PASS on public routes |
| robots.txt + sitemap | PASS; private paths disallowed |
| H1 | `/precios` missing H1 on staging → **FIXED** locally (`SectionIntro as="h1"`) |
| Home meta length 342 | **FIXED** locally (~155 chars) |
| `/marco-central` meta 173 | P3 (slightly long) |
| JSON-LD | Present on key pages |

---

## 17. Accessibility

| Check | Status |
| ----- | ------ |
| Keyboard / tab stops | Captured in `seo-a11y-results.json` |
| Focus / labels | Forms validate; contact invalidCount works |
| Contrast | **P2/P3:** axe `color-contrast` on `.text-action-red` / status marks / footer titles (brand crimson on dark) |
| `prefers-reduced-motion` | Hero skips to lit; video src omitted after fix |
| Alt on content images | 0 missing on audited public pages |

---

## 18. Error Handling

| Case | Status |
| ---- | ------ |
| 404 page | PASS |
| API 401 on refresh (guest) | Expected; console noise P3 |
| Auth errors | Spanish user-facing, no stack traces |
| Contact empty submit | Blocked client-side |

---

## 19. Mobile App Readiness

**Status: PASS for architecture direction / OUT OF SCOPE for product features**

Critical auth + billing catalog live in Nest API + Prisma. Web is a client. Gaps for mobile parity: subscription enforcement, payment provider wiring, stable mobile auth cookie strategy. Does not block EA web launch.

---

## 20. Bugs Found

### PERF-001

Severity: **P1**  
Category: Performance / Assets  
Environment: Staging (dev @ d6c2726)  
Device / Browser / Network: Desktop Chromium / Fast  
Steps: Cold load `/` → inspect hero requests  
Expected: Lit still ≤ ~400KB  
Actual: `statue-beam-lit-hd.png` 3.10MB; WebP unused  
Evidence: `qa/evidence/hero/hero-results.json`, baseline HAR  
Root cause: Missing `<source type="image/webp" media="(min-width: 768px)">`  
Fix: Add WebP source before PNG fallback  
Status: **FIXED** (local) → REGRESSION PASSED

### PERF-002

Severity: **P1**  
Category: Performance / Hero  
Environment: Staging  
Device: Mobile 390×844 / Chromium 4G  
Steps: Cold load `/`  
Expected: LCP ≤ 4.0s  
Actual: LCP 8–14s; element `span.ag-hero-signature__line`  
Evidence: baseline + perf-results-latest  
Root cause: (1) eager multi-MB below-fold images (2) support group `opacity:0` until 1.72s after intro  
Fix: `next/image` + lazy on below-fold; `lcpSafe` on support group  
Status: **FIXED** (local) → REGRESSION PASSED (LCP 1.7–1.9s)

### PERF-003

Severity: **P2**  
Category: Performance / Caching  
Environment: Staging  
Actual: `/images/*` and `/video/*` `Cache-Control: max-age=0`  
Fix: long-cache headers in `next.config.ts` (query-string busting already used)  
Status: **FIXED** (local)

### PERF-004

Severity: **P2**  
Category: Performance / Hero  
Actual: `preload="auto"` + video fetched on data-saver / reduced-motion paths  
Fix: `preload="metadata"`; omit `src` when skip paths known synchronously  
Status: **FIXED** (local) → data-saver confirmed `src=null`

### SEC-001

Severity: **P1**  
Category: Security  
Actual: No security headers on web/API; Swagger public on staging  
Fix: `helmet` on API; headers() on Next; Swagger only if not production  
Status: **FIXED** (local; deploy required)

### SEO-001

Severity: **P2**  
Category: SEO  
Actual: `/precios` had no H1 on staging  
Fix: `SectionIntro as="h1"`  
Status: **FIXED** (local)

### SEO-002

Severity: **P3**  
Category: SEO  
Actual: Home meta description 342 chars  
Fix: shortened to ~155 chars in `landing-copy.ts`  
Status: **FIXED** (local)

### A11Y-001

Severity: **P2**  
Category: Accessibility  
Actual: axe contrast failures on action-red labels / footer titles  
Fix: Not changed (brand color system)  
Status: **OPEN** (known non-blocker)

### SEC-002

Severity: **P2**  
Category: Security / Architecture  
Actual: `/admin` returns 200 HTML without auth (client-only guard)  
Fix: Requires first-party session cookie / BFF (out of this fix loop)  
Status: **OPEN** (known non-blocker; API still protected)

### RESP-001

Severity: **P4**  
Category: Responsive  
Actual: `scrollWidth` overflow flagged on `/manifiesto` mobile  
Root cause: Off-canvas drawer in layout flow  
Status: **FALSE POSITIVE** (local spot-check clean)

---

## 21. Performance Results (BEFORE → AFTER)

### HOME — Desktop Fast (cold)

| Metric | BEFORE (staging) | AFTER (local prod) |
| ------ | ---------------- | ------------------ |
| LCP | 1.51s | **0.16s** |
| FCP | 1.24s | **0.05s** |
| CLS | 0.002 | **0.000** |
| Transferred | 7.34 MB | **1.14 MB** |
| Image bytes | 6.43 MB | **0.52 MB** |
| Lit still | 3.10 MB PNG | **0.31 MB WebP** |

### HOME — Mobile 4G (cold)

| Metric | BEFORE (staging) | AFTER (local prod) |
| ------ | ---------------- | ------------------ |
| LCP | 8.5–14.2s | **1.7–1.9s** |
| FCP | 2.2–5.5s | **1.7–1.9s** |
| CLS | ~0.001 | **0.003** |
| Transferred | 4.39 MB | **1.12 MB** |
| Image bytes | 3.48 MB | **0.18 MB** |
| LCP element | signature (late) | signature (lcpSafe, under intro) |

### MANIFIESTO — Mobile 4G

| Metric | BEFORE | AFTER |
| ------ | ------ | ----- |
| LCP | ~12.8s | **1.86s** |
| Bytes | 2.47 MB | **0.71 MB** |
| LCP asset | raw 1.75MB PNG | `/_next/image` ~36KB |

---

## 22. Remaining Risks

1. **Fixes not on staging/production until deploy** — AFTER numbers are local production build only.
2. **Real Safari iOS / Chrome Android** not run — checklist provided.
3. **Contrast** on brand red labels may fail strict AA.
4. **Admin shell** still client-guarded.
5. **Paid subscription / MercadoPago / trial expiry** not in this release.
6. **`origin/main` behind `dev`** — ensure production tracks the branch that receives these fixes.
7. Dead asset `hero-statue.png` (7.5MB) unused; safe to delete later (P4).

---

## 23. Final Recommendation

### GO WITH KNOWN NON-BLOCKERS

**Conditions met:**
- No open P0
- P1 performance + security items fixed in tree and retested locally
- Home mobile 4G LCP gate PASS after fixes
- No real horizontal overflow on spot-check
- Functional smoke + auth PASS
- Hero video → image sequence preserved and verified

**Before flipping production DNS / announcing to Rafa:**
1. Deploy this working tree (web + API) to staging, then re-run `node qa/run-after.mjs` with `QA_BASE_URL=https://mkweb-staging.up.railway.app` (production mode only).
2. Execute `qa/evidence/regression/manual-device-checklist.md` on one iPhone Safari + one Android Chrome (~10 minutes).
3. Confirm Railway `NODE_ENV=production` so Swagger stays closed.

---

## OUT OF SCOPE — EARLY ACCESS

| Item | Note |
| ---- | ---- |
| Diagnostic / questionnaire E2E | Not in EA release |
| Subscription enforcement | `SubscriptionGuard` stub |
| Trial expiry / abuse | `trialEnd: null` by design |
| MercadoPago / Payment model | Interface only |
| PlanFeature entitlements | Benefits JSON only |
| Full admin CRUD QA | Sanity only |

---

## NOT VERIFIED

| Item | How to verify |
| ---- | ------------- |
| Safari iOS hero/autoplay/`100vh` | Manual checklist |
| Chrome Android | Manual checklist |
| Staging AFTER metrics | Redeploy then `QA_BASE_URL=... node qa/run-after.mjs` |
| Field INP / CWV CrUX | Search Console / RUM after launch |
| Offline UX | DevTools → Offline → navigate |

---

## Manifest of files touched in this audit (separable from prior local drift)

| File | Why |
| ---- | --- |
| `apps/web/components/landing/hero-beam-media.tsx` | WebP lit source; preload metadata; skip video fetch paths |
| `apps/web/components/landing/landing-hero.tsx` | `lcpSafe` on support group (mobile LCP) |
| `apps/web/components/landing/landing-how-it-works.tsx` | `next/image` for phase shots |
| `apps/web/components/landing/landing-method-brief.tsx` | `next/image` + lazy background |
| `apps/web/components/landing/sticky-statue.tsx` | `loading="lazy"` |
| `apps/web/components/device-showcase.tsx` | `next/image` + lazy product shots |
| `apps/web/components/pages/precios-content.tsx` | `SectionIntro as="h1"` |
| `apps/web/lib/landing-copy.ts` | Shorter home meta description |
| `apps/web/next.config.ts` | Cache + security headers |
| `apps/api/src/main.ts` | helmet + Swagger prod gate |
| `apps/api/package.json` | `helmet` dependency |
| `package.json` | `playwright` devDependency for harness |
| `qa/**` | Disposable measurement harness + evidence |

Prior uncommitted drift (copy/manifiesto/etc.) was not introduced by this audit; treat separately when committing.
