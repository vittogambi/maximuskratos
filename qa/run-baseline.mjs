// Fase 0 — baseline congelado. Single cold-cache pass, desktop Fast + mobile 4G,
// across all 10 public routes. Screenshots at 7 viewports + 3 landscape. HAR for
// Home only. See qa/README.md for the scope/rigor tradeoff explanation.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { measurePage } from './lib/measure.mjs';
import {
  PUBLIC_ROUTES,
  VIEWPORTS,
  MOBILE_LANDSCAPE,
  STAGING_WEB,
} from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/baseline');
fs.mkdirSync(path.join(EVIDENCE, 'perf'), { recursive: true });
fs.mkdirSync(path.join(EVIDENCE, 'screenshots'), { recursive: true });
fs.mkdirSync(path.join(EVIDENCE, 'har'), { recursive: true });

const slug = (route) => (route === '/' ? 'home' : route.replace(/\//g, ''));

async function main() {
  const browser = await chromium.launch();
  const results = { generatedAt: new Date().toISOString(), routes: {} };

  console.log('== Perf snapshot: desktop Fast + mobile 4G, cold cache ==');
  for (const route of PUBLIC_ROUTES) {
    const url = STAGING_WEB + route;
    const s = slug(route);
    results.routes[route] = {};

    for (const [profileName, viewport] of [
      ['desktop-fast', VIEWPORTS.desktop1440],
      ['mobile-4g', VIEWPORTS.mobile390],
    ]) {
      const networkKey = profileName === 'desktop-fast' ? 'fast' : '4g';
      const harPath =
        route === '/' ? path.join(EVIDENCE, 'har', `home-${profileName}.har`) : null;
      process.stdout.write(`  ${route} [${profileName}] ... `);
      try {
        const r = await measurePage({
          browser,
          browserTypeName: 'chromium',
          url,
          viewport,
          networkProfileKey: networkKey,
          cacheMode: 'cold',
          harPath,
          screenshotPath: path.join(EVIDENCE, 'screenshots', `${s}-${profileName}.png`),
        });
        results.routes[route][profileName] = r;
        console.log(
          `LCP=${r.metrics.lcp?.toFixed(0)}ms FCP=${r.metrics.fcp?.toFixed(0)}ms CLS=${r.metrics.cls?.toFixed(3)} bytes=${(r.bytes.total / 1024).toFixed(0)}KB reqs=${r.requestCount} consoleErr=${r.consoleErrors.length} failedReq=${r.failedRequests.length}`,
        );
      } catch (e) {
        console.log(`ERROR: ${e}`);
        results.routes[route][profileName] = { error: String(e) };
      }
    }
  }

  console.log('\n== Full-page screenshots: 7 viewports + 3 landscape, Home + /precios ==');
  const screenshotRoutes = ['/', '/precios'];
  const allViewports = { ...VIEWPORTS, ...MOBILE_LANDSCAPE };
  for (const route of screenshotRoutes) {
    const s = slug(route);
    for (const [vpName, viewport] of Object.entries(allViewports)) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      try {
        await page.goto(STAGING_WEB + route, { waitUntil: 'load', timeout: 45000 });
        await page.waitForTimeout(800);
        await page.screenshot({
          path: path.join(EVIDENCE, 'screenshots', `${s}-${vpName}.png`),
          fullPage: true,
        });
        console.log(`  ${route} @ ${vpName} (${viewport.width}x${viewport.height}) saved`);
      } catch (e) {
        console.log(`  ${route} @ ${vpName} ERROR: ${e}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(EVIDENCE, 'baseline-results.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved ${path.join(EVIDENCE, 'baseline-results.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
