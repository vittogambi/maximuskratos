// Fase 5 — cross-browser. Chromium/WebKit/Firefox desktop + Chromium/WebKit
// mobile emulation. No CDP throttling here (WebKit/Firefox don't support it,
// and this pass is about functional/visual parity, not performance budgets —
// those are Chromium-only in run-perf.mjs).
import { chromium, webkit, firefox } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { STAGING_WEB } from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/browsers');
fs.mkdirSync(EVIDENCE, { recursive: true });

const ROUTES = ['/', '/precios', '/login', '/register'];

const ENGINES = {
  'chromium-desktop': { launcher: chromium, viewport: { width: 1440, height: 900 } },
  'webkit-desktop': { launcher: webkit, viewport: { width: 1440, height: 900 } },
  'firefox-desktop': { launcher: firefox, viewport: { width: 1440, height: 900 } },
  'chromium-mobile': { launcher: chromium, viewport: { width: 390, height: 844 } },
  'webkit-mobile': { launcher: webkit, viewport: { width: 390, height: 844 } },
};

async function checkOnEngine(engineName, { launcher, viewport }, route) {
  const browser = await launcher.launch();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));

  let status = null;
  let navError = null;
  try {
    const resp = await page.goto(STAGING_WEB + route, { waitUntil: 'load', timeout: 45000 });
    status = resp ? resp.status() : null;
    await page.waitForTimeout(1200);
  } catch (e) {
    navError = String(e).slice(0, 300);
  }

  const slug = (route === '/' ? 'home' : route.replace(/\//g, ''));
  const screenshotPath = path.join(EVIDENCE, `${engineName}-${slug}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

  // Hero-specific check on Home: does the video element exist and report a
  // playable state (readyState/networkState), since autoplay policy differs
  // per engine and is exactly the kind of thing Playwright WebKit may not
  // reproduce faithfully versus real Safari.
  let heroState = null;
  if (route === '/') {
    heroState = await page.evaluate(() => {
      const v = document.querySelector('video.ag-hero-bg__beam');
      if (!v) return null;
      return { readyState: v.readyState, networkState: v.networkState, paused: v.paused, currentTime: v.currentTime };
    }).catch(() => null);
  }

  await context.close();
  await browser.close();
  return { engine: engineName, route, status, navError, consoleErrors, pageErrors, heroState, screenshotPath };
}

async function main() {
  const output = { generatedAt: new Date().toISOString(), results: [] };
  for (const [engineName, cfg] of Object.entries(ENGINES)) {
    console.log(`\n=== ${engineName} ===`);
    for (const route of ROUTES) {
      try {
        const r = await checkOnEngine(engineName, cfg, route);
        output.results.push(r);
        console.log(
          `  ${route}: status=${r.status} navError=${r.navError ?? 'none'} consoleErr=${r.consoleErrors.length} pageErr=${r.pageErrors.length}${r.heroState ? ` hero(readyState=${r.heroState.readyState},paused=${r.heroState.paused})` : ''}`,
        );
        if (r.consoleErrors.length) console.log(`    console: ${JSON.stringify(r.consoleErrors.slice(0, 2))}`);
        if (r.pageErrors.length) console.log(`    pageerror: ${JSON.stringify(r.pageErrors.slice(0, 2))}`);
      } catch (e) {
        console.log(`  ${route}: LAUNCH/RUN ERROR ${e}`);
        output.results.push({ engine: engineName, route, error: String(e) });
      }
    }
  }

  fs.writeFileSync(path.join(EVIDENCE, 'browsers-results.json'), JSON.stringify(output, null, 2));
  console.log(`\nSaved ${path.join(EVIDENCE, 'browsers-results.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
