// AFTER measurement against local Next with fixes applied.
// Compares Home desktop-fast + mobile-4g cold to baseline staging numbers.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { measurePage } from './lib/measure.mjs';
import { VIEWPORTS } from './lib/network-profiles.mjs';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3100';
const EVIDENCE = path.join(process.cwd(), 'qa/evidence/regression');
fs.mkdirSync(EVIDENCE, { recursive: true });

async function main() {
  // Sanity: base must respond
  const probe = await fetch(BASE).catch((e) => ({ ok: false, error: e }));
  if (!probe.ok) {
    console.error(`Base ${BASE} not reachable. Start Next on 3100 first.`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const results = { generatedAt: new Date().toISOString(), base: BASE, runs: {} };

  for (const [label, viewport, network] of [
    ['home-desktop-fast', VIEWPORTS.desktop1440, 'fast'],
    ['home-mobile-4g', VIEWPORTS.mobile390, '4g'],
    ['precios-mobile-4g', VIEWPORTS.mobile390, '4g'],
    ['manifiesto-mobile-4g', VIEWPORTS.mobile390, '4g'],
  ]) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      process.stdout.write(`${label} run ${i + 1}/3 ... `);
      const r = await measurePage({
        browser,
        browserTypeName: 'chromium',
        url: BASE + (label.includes('precios') ? '/precios' : label.includes('manifiesto') ? '/manifiesto' : '/'),
        viewport,
        networkProfileKey: network,
        cacheMode: 'cold',
        screenshotPath: i === 0 ? path.join(EVIDENCE, `${label}-after.png`) : null,
      });
      runs.push(r);
      console.log(
        `LCP=${r.metrics.lcp?.toFixed(0)} FCP=${r.metrics.fcp?.toFixed(0)} CLS=${r.metrics.cls?.toFixed(3)} bytes=${(r.bytes.total / 1024).toFixed(0)}KB img=${((r.bytes.byType.image?.bytes || 0) / 1024).toFixed(0)}KB lcp=${r.metrics.lcpElement?.src?.split('/').pop() || r.metrics.lcpElement?.selector || '?'}`,
      );
    }
    results.runs[label] = runs;
  }

  // Hero asset check: lit should be webp on desktop, video preload metadata
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const heroAssets = [];
    page.on('response', async (res) => {
      const u = res.url();
      if (u.includes('statue-beam') || u.includes('statue-beam.mp4')) {
        const headers = await res.allHeaders();
        heroAssets.push({
          url: u.replace(BASE, ''),
          status: res.status(),
          bytes: Number(headers['content-length'] || 0),
        });
      }
    });
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3500);
    const dom = await page.evaluate(() => {
      const video = document.querySelector('video.ag-hero-bg__beam');
      const sources = [...document.querySelectorAll('picture source')].map((s) => ({
        type: s.getAttribute('type'),
        media: s.getAttribute('media'),
        srcset: s.getAttribute('srcset'),
      }));
      return {
        videoPreload: video?.getAttribute('preload'),
        videoSrc: video?.getAttribute('src'),
        sources,
      };
    });
    results.heroDom = { dom, heroAssets };
    await page.screenshot({ path: path.join(EVIDENCE, 'hero-desktop-after-live.png') });
    await context.close();
    console.log(
      'Hero preload=',
      dom.videoPreload,
      'lit webp source=',
      sourcesHasLitWebp(dom.sources),
    );
  }

  await browser.close();
  const out = path.join(EVIDENCE, 'after-results.json');
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`Saved ${out}`);
}

function sourcesHasLitWebp(sources) {
  return sources.some(
    (s) => s.type === 'image/webp' && s.media?.includes('768') && s.srcset?.includes('lit.webp'),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
