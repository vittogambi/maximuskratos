// Fase 2 — performance audit. 3 runs x {cold, warm} x {Fast, 4G, 3G} for the 4
// routes Fase 2 names explicitly: Home, /precios, /manifiesto, /sistema.
// This is where budget PASS/FAIL decisions are made, so it gets full rigor.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { measurePage } from './lib/measure.mjs';
import { PERF_PRIORITY_ROUTES, VIEWPORTS, STAGING_WEB } from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/perf');
fs.mkdirSync(EVIDENCE, { recursive: true });

const RUNS_PER_CONDITION = 3;
const CONDITIONS = [
  { network: 'fast', cache: 'cold', viewport: VIEWPORTS.desktop1440, label: 'desktop-fast-cold' },
  { network: 'fast', cache: 'warm', viewport: VIEWPORTS.desktop1440, label: 'desktop-fast-warm' },
  { network: '4g', cache: 'cold', viewport: VIEWPORTS.mobile390, label: 'mobile-4g-cold' },
  { network: '4g', cache: 'warm', viewport: VIEWPORTS.mobile390, label: 'mobile-4g-warm' },
  { network: '3g', cache: 'cold', viewport: VIEWPORTS.mobile390, label: 'mobile-3g-cold' },
];

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const stat = (values) => {
  const clean = values.filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
  if (!clean.length) return { median: null, min: null, max: null, n: 0 };
  return {
    median: median(clean),
    min: Math.min(...clean),
    max: Math.max(...clean),
    n: clean.length,
  };
};

async function main() {
  const argRoutes = process.argv.slice(2).filter((a) => a.startsWith('/'));
  const routes = argRoutes.length ? argRoutes : PERF_PRIORITY_ROUTES;
  const browser = await chromium.launch();
  const output = { generatedAt: new Date().toISOString(), routes: {} };

  for (const route of routes) {
    const url = STAGING_WEB + route;
    output.routes[route] = {};
    console.log(`\n=== ${route} ===`);

    for (const cond of CONDITIONS) {
      const runs = [];
      for (let i = 0; i < RUNS_PER_CONDITION; i++) {
        process.stdout.write(`  [${cond.label}] run ${i + 1}/${RUNS_PER_CONDITION} ... `);
        try {
          const r = await measurePage({
            browser,
            browserTypeName: 'chromium',
            url,
            viewport: cond.viewport,
            networkProfileKey: cond.network,
            cacheMode: cond.cache,
          });
          runs.push(r);
          console.log(
            `TTFB=${r.metrics.ttfb?.toFixed(0)} FCP=${r.metrics.fcp?.toFixed(0)} LCP=${r.metrics.lcp?.toFixed(0)} CLS=${r.metrics.cls?.toFixed(3)} TBT=${r.metrics.tbtApprox?.toFixed(0)} bytes=${(r.bytes.total / 1024).toFixed(0)}KB`,
          );
        } catch (e) {
          console.log(`ERROR ${e}`);
        }
      }

      output.routes[route][cond.label] = {
        condition: cond,
        runs,
        summary: {
          ttfb: stat(runs.map((r) => r.metrics.ttfb)),
          fcp: stat(runs.map((r) => r.metrics.fcp)),
          lcp: stat(runs.map((r) => r.metrics.lcp)),
          cls: stat(runs.map((r) => r.metrics.cls)),
          tbtApprox: stat(runs.map((r) => r.metrics.tbtApprox)),
          totalBytes: stat(runs.map((r) => r.bytes.total)),
          requestCount: stat(runs.map((r) => r.requestCount)),
        },
        lcpElement: runs[0]?.metrics.lcpElement ?? null,
        lcpResourceUrl: runs[0]?.metrics.lcpResourceUrl ?? null,
        lcpTransferBytes: runs[0]?.metrics.lcpTransferBytes ?? null,
      };
    }
  }

  await browser.close();
  const outFile = path.join(EVIDENCE, `perf-results-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  fs.writeFileSync(path.join(EVIDENCE, 'perf-results-latest.json'), JSON.stringify(output, null, 2));
  console.log(`\nSaved ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
