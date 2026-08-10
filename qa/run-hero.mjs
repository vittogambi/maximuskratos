// Fase 3 — hero audit. Confirms, on the live deployed build, the byte
// accounting done by hand earlier and checks the 3 paths where playback is
// skipped (reduced motion, data saver, repeat soft-nav visit) to see whether
// the video bytes are fetched anyway.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { STAGING_WEB } from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/hero');
fs.mkdirSync(EVIDENCE, { recursive: true });

async function heroRequestLog(context, page) {
  const log = [];
  page.on('requestfinished', async (r) => {
    if (/statue-beam|statue-beam-lit|statue-beam-dark/i.test(r.url())) {
      const resp = await r.response().catch(() => null);
      const sizes = await r.sizes().catch(() => null);
      log.push({
        url: r.url().replace(STAGING_WEB, ''),
        status: resp ? resp.status() : null,
        bytes: sizes ? sizes.responseBodySize : null,
      });
    }
  });
  return log;
}

async function scenario(browser, name, { viewport, reducedMotion, dataSaver, softNavRepeat }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();

  if (dataSaver) {
    // navigator.connection.saveData isn't spoofable via a real network stack in
    // Playwright; the hero code reads navigator.connection.saveData directly,
    // so we override the property before any app JS runs.
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'connection', {
        value: { saveData: true },
        configurable: true,
      });
    });
  }

  const log = await heroRequestLog(context, page);
  await page.goto(STAGING_WEB + '/', { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2500);

  if (softNavRepeat) {
    // Simulate returning to '/' within the same SPA lifetime (client nav),
    // which is the beamPlayedThisDocument path — navigate to another public
    // route via a real link click, then back via the browser back button so
    // Next's client router (not a hard reload) drives it.
    const navLink = page.locator('a[href="/manifiesto"]').first();
    if (await navLink.count()) {
      await navLink.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);
      await page.goBack({ waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  const state = await page.evaluate(() => {
    const video = document.querySelector('video.ag-hero-bg__beam');
    const imgs = Array.from(document.querySelectorAll('img.ag-hero-bg__beam')).map((img) => ({
      src: img.currentSrc || img.src,
      opacity: getComputedStyle(img).opacity,
    }));
    return {
      videoPreload: video ? video.preload : null,
      videoReadyState: video ? video.readyState : null,
      videoNetworkState: video ? video.networkState : null,
      videoCurrentTime: video ? video.currentTime : null,
      images: imgs,
    };
  }).catch((e) => ({ error: String(e) }));

  const screenshotPath = path.join(EVIDENCE, `${name}.png`);
  await page.screenshot({ path: screenshotPath }).catch(() => {});

  await context.close();
  return { name, scenario: { viewport, reducedMotion, dataSaver, softNavRepeat }, requestLog: log, domState: state, screenshotPath };
}

async function main() {
  const browser = await chromium.launch();
  const desktop = { width: 1440, height: 900 };
  const mobile = { width: 390, height: 844 };

  const scenarios = [
    { name: 'desktop-normal', opts: { viewport: desktop, reducedMotion: false, dataSaver: false, softNavRepeat: false } },
    { name: 'desktop-reduced-motion', opts: { viewport: desktop, reducedMotion: true, dataSaver: false, softNavRepeat: false } },
    { name: 'desktop-data-saver', opts: { viewport: desktop, reducedMotion: false, dataSaver: true, softNavRepeat: false } },
    { name: 'desktop-soft-nav-repeat', opts: { viewport: desktop, reducedMotion: false, dataSaver: false, softNavRepeat: true } },
    { name: 'mobile-normal', opts: { viewport: mobile, reducedMotion: false, dataSaver: false, softNavRepeat: false } },
  ];

  const results = { generatedAt: new Date().toISOString(), scenarios: {} };
  for (const s of scenarios) {
    console.log(`\n=== ${s.name} ===`);
    try {
      const r = await scenario(browser, s.name, s.opts);
      results.scenarios[s.name] = r;
      const videoFetched = r.requestLog.some((l) => l.url.includes('.mp4'));
      console.log(`  video bytes fetched: ${videoFetched}`);
      console.log(`  requests: ${JSON.stringify(r.requestLog)}`);
      console.log(`  dom: preload=${r.domState.videoPreload} readyState=${r.domState.videoReadyState} networkState=${r.domState.videoNetworkState}`);
    } catch (e) {
      console.log(`  ERROR: ${e}`);
      results.scenarios[s.name] = { error: String(e) };
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(EVIDENCE, 'hero-results.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved ${path.join(EVIDENCE, 'hero-results.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
