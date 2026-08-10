// Fase 8 — SEO tecnico + accesibilidad basica, scoped to what the plan asks:
// not a full SEO/WCAG audit, just what would block a good launch.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { PUBLIC_ROUTES, STAGING_WEB } from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/seo');
fs.mkdirSync(EVIDENCE, { recursive: true });

const AXE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js';

async function seoCheck(page, route) {
  return page.evaluate((route) => {
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null;
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? null;
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null;
    const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') ?? null;
    const h1s = Array.from(document.querySelectorAll('h1')).map((h) => h.textContent?.trim().slice(0, 60));
    const imgsNoAlt = Array.from(document.querySelectorAll('img')).filter((img) => !img.hasAttribute('alt') || (img.getAttribute('alt') === null));
    const robotsMeta = document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;
    const jsonLdCount = document.querySelectorAll('script[type="application/ld+json"]').length;
    const favicon = !!document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    return {
      route, title, titleLength: title?.length ?? 0, metaDesc, metaDescLength: metaDesc?.length ?? 0,
      canonical, ogTitle, ogImage, twitterCard, h1Count: h1s.length, h1s, imgsMissingAlt: imgsNoAlt.length,
      robotsMeta, jsonLdCount, favicon,
    };
  }, route);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('== SEO technical, per public route ==');
  const seoResults = {};
  for (const route of PUBLIC_ROUTES) {
    await page.goto(STAGING_WEB + route, { waitUntil: 'load', timeout: 30000 });
    const r = await seoCheck(page, route);
    seoResults[route] = r;
    console.log(`  ${route}: title="${r.title}" (${r.titleLength}c) h1Count=${r.h1Count} canonical=${!!r.canonical} og=${!!r.ogTitle} imgsMissingAlt=${r.imgsMissingAlt} jsonLd=${r.jsonLdCount}`);
  }

  console.log('\n== Private routes: robots meta + auth-gated check ==');
  const privateRoutes = ['/admin', '/panel', '/perfil', '/ruta', '/cuenta', '/diagnostico'];
  const privateResults = {};
  for (const route of privateRoutes) {
    await page.goto(STAGING_WEB + route, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    const robotsMeta = await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null).catch(() => null);
    privateResults[route] = { robotsMeta };
    console.log(`  ${route}: robotsMeta="${robotsMeta}"`);
  }

  console.log('\n== Accessibility (axe-core) — Home, /precios, /contacto, /login, /register ==');
  const a11yRoutes = ['/', '/precios', '/contacto', '/login', '/register'];
  const a11yResults = {};
  try {
    await page.addScriptTag({ url: AXE_CDN });
  } catch (e) {
    console.log(`  Could not load axe-core from CDN (${e}); skipping automated a11y scan.`);
  }
  for (const route of a11yRoutes) {
    await page.goto(STAGING_WEB + route, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(500);
    try {
      await page.addScriptTag({ url: AXE_CDN });
      const axeResults = await page.evaluate(async () => {
        // eslint-disable-next-line no-undef
        const results = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
        return {
          violations: results.violations.map((v) => ({
            id: v.id, impact: v.impact, description: v.description, help: v.help, nodeCount: v.nodes.length,
            targets: v.nodes.slice(0, 3).map((n) => n.target),
          })),
        };
      });
      a11yResults[route] = axeResults;
      console.log(`  ${route}: ${axeResults.violations.length} violation types — ${axeResults.violations.map((v) => `${v.id}(${v.impact},x${v.nodeCount})`).join(', ') || 'none'}`);
    } catch (e) {
      a11yResults[route] = { error: String(e) };
      console.log(`  ${route}: ERROR ${e}`);
    }
  }

  console.log('\n== Keyboard navigation smoke (Home) ==');
  await page.goto(STAGING_WEB + '/', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(500);
  const tabStops = [];
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
        hasOutline: style.outlineStyle !== 'none' && style.outlineWidth !== '0px',
        visible: rect.width > 0 && rect.height > 0,
      };
    });
    tabStops.push(active);
  }
  const noFocusIndicator = tabStops.filter((t) => t && t.visible && !t.hasOutline);
  console.log(`  15 Tab presses: ${tabStops.filter(Boolean).length} focusable stops reached, ${noFocusIndicator.length} with no visible outline (may use custom focus styles — verify manually)`);

  await browser.close();
  fs.writeFileSync(path.join(EVIDENCE, 'seo-a11y-results.json'), JSON.stringify({ seoResults, privateResults, a11yResults, tabStops }, null, 2));
  console.log(`\nSaved ${path.join(EVIDENCE, 'seo-a11y-results.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
