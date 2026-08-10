// Fase 7 — asset inventory against staging (BEFORE) and optional local (AFTER).
import fs from 'node:fs';
import path from 'node:path';
import { STAGING_WEB } from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/assets');
fs.mkdirSync(EVIDENCE, { recursive: true });

const ASSETS = [
  '/images/landing/statue-beam-lit-hd.png?v=11',
  '/images/landing/statue-beam-lit.webp?v=11',
  '/images/landing/statue-beam-lit.jpg?v=11',
  '/images/landing/statue-beam-dark.webp?v=11',
  '/images/landing/statue-beam-dark-sm.webp?v=11',
  '/images/landing/statue-beam-lit-sm.webp?v=11',
  '/video/statue-beam.mp4?v=11',
  '/images/backgrounds/arquitectura-sentido-columns.png',
  '/images/backgrounds/marco-central.png',
  '/images/backgrounds/about-systems.png',
  '/images/landing/dashboard-alineacion-desktop.png',
  '/images/landing/dashboard-diagnostico-desktop.png',
  '/images/ikigai/ikigai-hero.png',
  '/images/statues/hero-statue.png',
  '/fonts/bitte-bc.woff',
];

async function probe(base) {
  const out = [];
  for (const asset of ASSETS) {
    const url = base + asset;
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      out.push({
        path: asset,
        status: res.status,
        contentType: res.headers.get('content-type'),
        contentLength: Number(res.headers.get('content-length') || 0),
        cacheControl: res.headers.get('cache-control'),
        contentEncoding: res.headers.get('content-encoding'),
        acceptRanges: res.headers.get('accept-ranges'),
      });
    } catch (e) {
      out.push({ path: asset, error: String(e) });
    }
  }
  return out;
}

async function diskInventory() {
  const root = path.join(process.cwd(), 'apps/web/public');
  const heavy = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (st.size >= 300 * 1024) {
        heavy.push({
          path: '/' + path.relative(root, full).replaceAll(path.sep, '/'),
          bytes: st.size,
        });
      }
    }
  }
  walk(root);
  heavy.sort((a, b) => b.bytes - a.bytes);
  return heavy;
}

async function main() {
  const base = process.env.QA_BASE_URL || STAGING_WEB;
  console.log(`Probing assets at ${base}`);
  const remote = await probe(base);
  const disk = await diskInventory();
  const result = {
    generatedAt: new Date().toISOString(),
    base,
    remote,
    diskHeavy300kbPlus: disk,
    notes: {
      heroStatueUsage: 'HERO_STATUE only referenced in lib/assets.ts — likely dead asset',
      litWebpMissingFromPictureOnStaging:
        'statue-beam-lit.webp exists but staging <picture> omits desktop webp source',
    },
  };
  const outPath = path.join(EVIDENCE, 'assets-inventory.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log('Heavy disk assets:');
  for (const a of disk.slice(0, 15)) {
    console.log(`  ${(a.bytes / 1024 / 1024).toFixed(2)}MB  ${a.path}`);
  }
  console.log(`\nSaved ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
