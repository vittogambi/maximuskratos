// Fase 6 — functional smoke, Early Access scope. Navigation, internal links,
// CTAs, contact form validation, the 4 next.config.ts redirects, and 404.
// Login/register/logout run separately against the local stack (see
// run-smoke-auth.mjs) to avoid writing test accounts into staging's database.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { PUBLIC_ROUTES, STAGING_WEB } from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/smoke');
fs.mkdirSync(EVIDENCE, { recursive: true });

async function checkRoute(browser, route) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const badStatuses = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
  page.on('requestfailed', (r) => failedRequests.push({ url: r.url(), failure: r.failure()?.errorText }));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.request().resourceType() !== 'document') {
      badStatuses.push({ url: r.url(), status: r.status() });
    }
  });

  const status = await page
    .goto(STAGING_WEB + route, { waitUntil: 'load', timeout: 45000 })
    .then((r) => r.status())
    .catch((e) => `ERROR: ${e}`);
  await page.waitForTimeout(600);

  const linkAudit = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const internal = [];
    const external = [];
    const empty = [];
    for (const a of anchors) {
      const href = a.getAttribute('href');
      if (!href || href === '#') { empty.push(a.outerHTML.slice(0, 100)); continue; }
      if (href.startsWith('http') && !href.includes(location.hostname)) external.push(href);
      else if (href.startsWith('/') || href.startsWith('#')) internal.push(href);
    }
    const h1Count = document.querySelectorAll('h1').length;
    return { internalCount: internal.length, externalCount: external.length, emptyHrefCount: empty.length, h1Count, internal: [...new Set(internal)] };
  });

  await context.close();
  return { route, status, consoleErrors, failedRequests, badStatuses, linkAudit };
}

async function checkRedirect(browser, from, expectedTo) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const resp = await page.goto(STAGING_WEB + from, { waitUntil: 'load', timeout: 30000 }).catch((e) => null);
  const finalUrl = page.url();
  const ok = finalUrl.endsWith(expectedTo);
  await context.close();
  return { from, expectedTo, finalUrl, status: resp?.status() ?? null, ok };
}

async function check404(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const resp = await page.goto(STAGING_WEB + '/esta-ruta-no-existe-qa-test', { waitUntil: 'load', timeout: 30000 }).catch((e) => null);
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300)).catch(() => '');
  await context.close();
  return { status: resp?.status() ?? null, bodyText };
}

async function checkContactFormValidation(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(STAGING_WEB + '/contacto', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(500);
  const submitBtn = page.locator('form button[type="submit"], form input[type="submit"]').first();
  const result = { formFound: false, emptySubmitBlocked: null, validationVisible: null };
  if (await submitBtn.count()) {
    result.formFound = true;
    await submitBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    const stillOnContact = page.url().includes('/contacto');
    const validationMsgs = await page.evaluate(() => {
      const invalids = document.querySelectorAll(':invalid');
      const ariaErrors = document.querySelectorAll('[aria-invalid="true"], [role="alert"]');
      return { invalidCount: invalids.length, ariaErrorCount: ariaErrors.length };
    });
    result.emptySubmitBlocked = stillOnContact;
    result.validationVisible = validationMsgs.invalidCount > 0 || validationMsgs.ariaErrorCount > 0;
    result.validationDetail = validationMsgs;
  }
  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch();
  const output = { generatedAt: new Date().toISOString() };

  console.log('== Route smoke pass ==');
  output.routes = {};
  for (const route of PUBLIC_ROUTES) {
    const r = await checkRoute(browser, route);
    output.routes[route] = r;
    console.log(
      `  ${route}: status=${r.status} h1=${r.linkAudit.h1Count} internalLinks=${r.linkAudit.internalCount} consoleErr=${r.consoleErrors.length} badStatus=${r.badStatuses.length}`,
    );
  }

  console.log('\n== Redirects (next.config.ts) ==');
  output.redirects = [];
  const redirectPairs = [
    ['/prestaciones', '/sistema'],
    ['/quienes-somos', '/manifiesto'],
    ['/porque-mk', '/manifiesto'],
    ['/base-conceptual', '/marco-central'],
  ];
  for (const [from, to] of redirectPairs) {
    const r = await checkRedirect(browser, from, to);
    output.redirects.push(r);
    console.log(`  ${from} -> ${r.finalUrl} (expected ...${to}) ${r.ok ? 'OK' : 'FAIL'}`);
  }

  console.log('\n== 404 page ==');
  output.notFound = await check404(browser);
  console.log(`  status=${output.notFound.status}`);

  console.log('\n== Contact form validation (empty submit) ==');
  output.contactValidation = await checkContactFormValidation(browser);
  console.log(`  ${JSON.stringify(output.contactValidation)}`);

  await browser.close();
  fs.writeFileSync(path.join(EVIDENCE, 'smoke-results.json'), JSON.stringify(output, null, 2));
  console.log(`\nSaved ${path.join(EVIDENCE, 'smoke-results.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
