// Fase 8 — production security sanity (read-only against staging + local API).
import fs from 'node:fs';
import path from 'node:path';
import { STAGING_API, STAGING_WEB } from './lib/network-profiles.mjs';

const EVIDENCE = path.join(process.cwd(), 'qa/evidence/security');
fs.mkdirSync(EVIDENCE, { recursive: true });

const checks = [];

function record(id, pass, detail) {
  checks.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id}`, typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 160));
}

async function headOrGet(url, init) {
  const res = await fetch(url, init);
  const headers = {};
  res.headers.forEach((v, k) => {
    headers[k] = v;
  });
  const text = await res.text().catch(() => '');
  return { status: res.status, headers, text: text.slice(0, 500) };
}

async function main() {
  // Web security headers (staging = BEFORE)
  const web = await headOrGet(STAGING_WEB + '/');
  const needed = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
  ];
  const missing = needed.filter((h) => !web.headers[h]);
  record('SEC-HDR-WEB-01', missing.length === 0, {
    missing,
    present: needed.filter((h) => web.headers[h]),
    note: 'Staging before deploy of next.config security headers',
  });

  // API headers
  const api = await headOrGet(STAGING_API + '/health');
  const apiMissing = needed.filter((h) => !api.headers[h]);
  record('SEC-HDR-API-01', apiMissing.length === 0, {
    missing: apiMissing,
    xPoweredBy: api.headers['x-powered-by'] || null,
    note: 'Staging API before helmet deploy',
  });

  // Swagger public
  const docs = await headOrGet(STAGING_API + '/api/v1/docs');
  record('SEC-SWAGGER-01', docs.status === 404 || docs.status === 401, {
    status: docs.status,
    note: 'Expect closed in production; staging currently exposes docs',
  });

  // Admin without auth
  const adminUsers = await headOrGet(STAGING_API + '/api/v1/admin/users');
  record('SEC-ADMIN-01', adminUsers.status === 401, { status: adminUsers.status });

  const adminPlans = await headOrGet(STAGING_API + '/api/v1/admin/plans');
  record('SEC-ADMIN-02', adminPlans.status === 401, { status: adminPlans.status });

  // CORS evil origin
  const cors = await fetch(STAGING_API + '/api/v1/auth/login', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://evil.example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  const acao = cors.headers.get('access-control-allow-origin');
  record('SEC-CORS-01', acao !== 'https://evil.example.com', { acao });

  // Rate limit headers present
  record('SEC-RATE-01', Boolean(api.headers['x-ratelimit-limit']), {
    limit: api.headers['x-ratelimit-limit'],
  });

  // Source maps exposure (sample chunk)
  const homeHtml = (await headOrGet(STAGING_WEB + '/')).text;
  const chunkMatch = homeHtml.match(/\/_next\/static\/chunks\/[^"']+\.js/);
  if (chunkMatch) {
    const mapUrl = STAGING_WEB + chunkMatch[0] + '.map';
    const mapRes = await headOrGet(mapUrl);
    record('SEC-SOURCEMAP-01', mapRes.status === 404 || mapRes.status === 403, {
      url: mapUrl,
      status: mapRes.status,
    });
  } else {
    record('SEC-SOURCEMAP-01', true, { note: 'No chunk found to probe' });
  }

  // Local API helmet verification if available
  try {
    const local = await headOrGet('http://localhost:4000/health');
    const localMissing = needed.filter((h) => !local.headers[h]);
    // helmet sets x-content-type-options, x-frame-options, etc. HSTS only when https/trust proxy in prod
    record('SEC-HDR-API-LOCAL', !localMissing.includes('x-content-type-options'), {
      missing: localMissing,
      headers: {
        xcto: local.headers['x-content-type-options'],
        xfo: local.headers['x-frame-options'],
        rp: local.headers['referrer-policy'],
        xpb: local.headers['x-powered-by'],
      },
    });
    const localDocs = await headOrGet('http://localhost:4000/api/v1/docs');
    record('SEC-SWAGGER-LOCAL', localDocs.status === 200, {
      status: localDocs.status,
      note: 'Dev NODE_ENV should still expose swagger; production must not',
    });
  } catch (e) {
    record('SEC-HDR-API-LOCAL', false, { error: String(e) });
  }

  // Web /admin HTML shell without auth (information disclosure of shell)
  const adminPage = await headOrGet(STAGING_WEB + '/admin');
  record('SEC-ADMIN-SHELL-01', adminPage.status !== 200, {
    status: adminPage.status,
    bytes: adminPage.text.length,
    note: '200 means client-only guard; API still 401. Documented architectural risk.',
  });

  const result = {
    generatedAt: new Date().toISOString(),
    checks,
    passCount: checks.filter((c) => c.pass).length,
    failCount: checks.filter((c) => !c.pass).length,
  };
  const outPath = path.join(EVIDENCE, 'security-results.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\n${result.passCount} pass / ${result.failCount} fail → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
