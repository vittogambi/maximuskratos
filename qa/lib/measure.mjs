import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { NETWORK_PROFILES, CPU_THROTTLE } from './network-profiles.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const METRICS_SRC = readFileSync(path.join(__dirname, 'metrics-injection.js'), 'utf8');

/**
 * Measures a single page load. Network/CPU throttling only applies to Chromium
 * (CDP-based); WebKit/Firefox runs are recorded with throttled: false so the
 * report never attributes a throttled budget result to an untrottled engine.
 *
 * cacheMode 'cold' = brand-new context (empty cache).
 * cacheMode 'warm' = same context, navigate twice, measure the 2nd load.
 */
export async function measurePage({
  browserTypeName = 'chromium',
  browser,
  url,
  viewport = { width: 1440, height: 900 },
  networkProfileKey = 'fast',
  cacheMode = 'cold',
  screenshotPath = null,
  screenshotFullPage = true,
  harPath = null,
  interact = true,
  timeoutMs = 45000,
  extraHttpHeaders = undefined,
}) {
  const isChromium = browserTypeName === 'chromium';
  const contextOptions = { viewport, extraHTTPHeaders: extraHttpHeaders };
  if (harPath) contextOptions.recordHar = { path: harPath, content: 'omit' };

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.addInitScript({ content: METRICS_SRC });

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const requestLog = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 500));
  });
  page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 500)));
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' });
  });
  page.on('requestfinished', async (request) => {
    try {
      const response = await request.response();
      const sizes = await request.sizes().catch(() => null);
      requestLog.push({
        url: request.url(),
        resourceType: request.resourceType(),
        status: response ? response.status() : null,
        transferBytes: sizes ? sizes.responseBodySize + sizes.responseHeadersSize : null,
      });
    } catch {
      /* best-effort; some requests (e.g. aborted) can't be inspected */
    }
  });

  let throttled = false;
  let cdp = null;
  if (isChromium) {
    cdp = await context.newCDPSession(page);
    const netProfile = NETWORK_PROFILES[networkProfileKey];
    if (netProfile) {
      await cdp.send('Network.emulateNetworkConditions', netProfile);
      throttled = true;
    }
    const cpuRate = CPU_THROTTLE[networkProfileKey] ?? 1;
    if (cpuRate > 1) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
      throttled = true;
    }
  }

  let navError = null;
  try {
    if (cacheMode === 'warm') {
      await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
      await page.waitForTimeout(300);
    }
    await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
  } catch (e) {
    navError = String(e).slice(0, 300);
  }

  await page.waitForTimeout(1500).catch(() => {});

  // IMPORTANT: read LCP/CLS/FCP BEFORE any synthetic interaction. Per the LCP
  // spec, the browser freezes LCP reporting on the first user input, so
  // interacting first would truncate LCP at whatever painted before the
  // click/keypress — silently wrong on slow networks where the true LCP
  // element (e.g. the hero image) hasn't painted yet at that point.
  let timing = null;
  let qa = null;
  try {
    [timing, qa] = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const t = nav
        ? {
            ttfb: nav.responseStart - nav.requestStart,
            domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
            load: nav.loadEventEnd - nav.startTime,
            transferSize: nav.transferSize || 0,
          }
        : null;
      return [t, window.__qa || null];
    });
  } catch (e) {
    navError = navError || String(e).slice(0, 300);
  }

  // INP proxy comes from a SEPARATE post-hoc read, after LCP/CLS are already
  // captured above, so the synthetic interaction can't contaminate them.
  let inpProxyMs = null;
  if (interact && !navError) {
    try {
      await page.mouse.move(100, 100);
      const link = page.locator('a, button').first();
      if (await link.count()) {
        await link.hover({ timeout: 2000 }).catch(() => {});
      }
      await page.keyboard.press('Tab').catch(() => {});
    } catch {
      /* interaction is best-effort, absence shouldn't fail the run */
    }
    await page.waitForTimeout(500).catch(() => {});
    inpProxyMs = await page.evaluate(() => window.__qa?.inpProxy ?? null).catch(() => null);
  }

  if (screenshotPath) {
    await page.screenshot({ path: screenshotPath, fullPage: screenshotFullPage }).catch((e) => {
      pageErrors.push(`screenshot failed: ${e}`);
    });
  }

  const title = await page.title().catch(() => null);
  const finalUrl = page.url();

  await context.close().catch(() => {});

  const byType = {};
  let totalBytes = 0;
  for (const r of requestLog) {
    const t = r.resourceType || 'other';
    byType[t] = byType[t] || { count: 0, bytes: 0 };
    byType[t].count += 1;
    const b = r.transferBytes || 0;
    byType[t].bytes += b;
    totalBytes += b;
  }

  // Cross-reference the LCP element's resource URL against the request log to
  // report its actual transferred bytes, since entry.size from the LCP API is
  // rendered pixel area (width*height), not a byte size.
  const lcpResourceUrl = qa?.lcp?.url ?? qa?.lcp?.element?.src ?? null;
  const lcpMatch = lcpResourceUrl ? requestLog.find((r) => r.url === lcpResourceUrl) : null;

  return {
    url,
    finalUrl,
    title,
    viewport,
    browserTypeName,
    networkProfileKey,
    cacheMode,
    throttled,
    navError,
    metrics: {
      ttfb: timing?.ttfb ?? null,
      domContentLoaded: timing?.domContentLoaded ?? null,
      load: timing?.load ?? null,
      fcp: qa?.fcp ?? null,
      lcp: qa?.lcp?.renderTime ?? null,
      lcpElement: qa?.lcp?.element ?? null,
      lcpResourceUrl,
      lcpAreaPx: qa?.lcp?.size ?? null,
      lcpTransferBytes: lcpMatch?.transferBytes ?? null,
      cls: qa?.cls ?? null,
      clsShiftCount: qa?.clsShifts?.length ?? 0,
      tbtApprox: qa?.tbtApprox ?? null,
      longTaskCount: qa?.longTasks?.length ?? 0,
      inpProxyMs,
    },
    bytes: { total: totalBytes, byType },
    requestCount: requestLog.length,
    consoleErrors,
    pageErrors,
    failedRequests,
  };
}

export async function withBrowser(browserType, fn) {
  const browser = await browserType.launch();
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}
