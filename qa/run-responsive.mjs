// Fase 4 — responsive matrix. 7 viewports + 3 mobile landscape, all 10 public
// routes. Overflow detected by measurement (scrollWidth vs clientWidth), not
// by eyeballing screenshots, and the actual offending element is identified.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { PUBLIC_ROUTES, VIEWPORTS, MOBILE_LANDSCAPE, STAGING_WEB } from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/responsive');
fs.mkdirSync(path.join(EVIDENCE, 'screenshots'), { recursive: true });

const slug = (route) => (route === '/' ? 'home' : route.replace(/\//g, ''));
const ALL_VIEWPORTS = { ...VIEWPORTS, ...MOBILE_LANDSCAPE };

const OVERFLOW_CHECK = () => {
  const docEl = document.documentElement;
  const hasOverflow = docEl.scrollWidth > docEl.clientWidth + 1; // +1px rounding tolerance
  let culprits = [];
  if (hasOverflow) {
    const all = document.querySelectorAll('body *');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > docEl.clientWidth + 1 || rect.left < -1) {
        const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
        culprits.push({
          selector: `${el.tagName.toLowerCase()}${cls}`,
          right: Math.round(rect.right),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
        });
        if (culprits.length >= 8) break;
      }
    }
  }
  // Touch target audit: interactive elements smaller than 44x44 CSS px.
  const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
  const smallTargets = [];
  for (const el of interactive) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue; // hidden/display:none
    if ((rect.width < 44 || rect.height < 44) && rect.width > 0 && rect.height > 0) {
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
      smallTargets.push({
        selector: `${el.tagName.toLowerCase()}${cls}`,
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
      if (smallTargets.length >= 15) break;
    }
  }
  return {
    scrollWidth: docEl.scrollWidth,
    clientWidth: docEl.clientWidth,
    hasOverflow,
    culprits,
    smallTargetCount: smallTargets.length,
    smallTargets: smallTargets.slice(0, 10),
  };
};

async function main() {
  const browser = await chromium.launch();
  const results = { generatedAt: new Date().toISOString(), routes: {} };

  for (const route of PUBLIC_ROUTES) {
    const s = slug(route);
    results.routes[route] = {};
    console.log(`\n=== ${route} ===`);

    for (const [vpName, viewport] of Object.entries(ALL_VIEWPORTS)) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      try {
        await page.goto(STAGING_WEB + route, { waitUntil: 'load', timeout: 45000 });
        await page.waitForTimeout(700);
        const check = await page.evaluate(OVERFLOW_CHECK);
        results.routes[route][vpName] = { viewport, ...check };
        await page.screenshot({
          path: path.join(EVIDENCE, 'screenshots', `${s}-${vpName}.png`),
          fullPage: true,
        });
        const flag = check.hasOverflow ? 'OVERFLOW' : 'ok';
        console.log(
          `  ${vpName} (${viewport.width}x${viewport.height}): ${flag} scrollW=${check.scrollWidth} clientW=${check.clientWidth} smallTargets=${check.smallTargetCount}`,
        );
        if (check.hasOverflow) {
          console.log(`    culprits: ${JSON.stringify(check.culprits.slice(0, 3))}`);
        }
      } catch (e) {
        console.log(`  ${vpName} ERROR: ${e}`);
        results.routes[route][vpName] = { error: String(e) };
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(EVIDENCE, 'responsive-results.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved ${path.join(EVIDENCE, 'responsive-results.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
