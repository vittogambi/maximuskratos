/**
 * Read-only UI audit capture. Does not change the app, flags, or data model.
 *
 *   node scripts/ui-audit-capture.mjs [--only all|families|ikigai] [--base http://localhost:3000]
 *
 * Writes docs/ui/evidence/<family>/*.png, manifest.json and measures.json.
 * Requires the dev stack (web :3000, api :4000).
 */
import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { chromium, webkit } from 'playwright';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const BASE = arg('base', 'http://localhost:3000');
const ONLY = arg('only', 'all');
const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'docs/ui/evidence');
const HIDE = 'nextjs-portal{display:none!important}';

const PIECES = {
  PASION: [
    'Enseñar a quien empieza, con ejemplos de su propio trabajo',
    'Ordenar sistemas que el resto del equipo ya no puede seguir',
  ],
  CAPACIDAD: [
    'Explicar un tema difícil sin perder a la persona que escucha',
    'Dejar un proceso escrito para que otro pueda repetirlo sin mí',
  ],
  NECESIDAD: ['Personas que empiezan y se quedan solas frente a la herramienta'],
};

const PHRASE =
  'Ayudar a personas que empiezan a dominar herramientas difíciles, con formación práctica y ejemplos de su trabajo.';

const manifest = [];
const measures = { pages: [], targets: [], circles: [], keyboard: [], repro: [], problems: [] };

function revision() {
  const rev = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  const dirty = execSync('git status --porcelain', { cwd: ROOT }).toString().trim().length > 0;
  return { rev, dirty };
}

const REV = revision();

function lin(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function lum(rgb) {
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}
function ratio(a, b) {
  const hi = Math.max(lum(a), lum(b));
  const lo = Math.min(lum(a), lum(b));
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

function decodePng(buf) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  const idats = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') idats.push(data);
    else if (type === 'IEND') break;
    offset += 12 + len;
  }
  const inflated = inflateSync(Buffer.concat(idats));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const rows = [];
  let cursor = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[cursor];
    cursor += 1;
    const row = Buffer.from(inflated.subarray(cursor, cursor + stride));
    cursor += stride;
    for (let i = 0; i < stride; i += 1) {
      const left = i >= bpp ? row[i - bpp] : 0;
      const up = prev[i];
      const upLeft = i >= bpp ? prev[i - bpp] : 0;
      if (filter === 1) row[i] = (row[i] + left) & 255;
      else if (filter === 2) row[i] = (row[i] + up) & 255;
      else if (filter === 3) row[i] = (row[i] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const pa = Math.abs(up - upLeft);
        const pb = Math.abs(left - upLeft);
        const pc = Math.abs(left + up - 2 * upLeft);
        const pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        row[i] = (row[i] + pred) & 255;
      }
    }
    prev = row;
    rows.push(row);
  }
  return {
    width,
    height,
    bpp,
    at(x, y) {
      const cx = Math.max(0, Math.min(width - 1, Math.round(x)));
      const cy = Math.max(0, Math.min(height - 1, Math.round(y)));
      const i = cx * bpp;
      const row = rows[cy];
      return [row[i], row[i + 1], row[i + 2]];
    },
  };
}

async function shot(page, rel, meta) {
  const file = join(OUT, rel);
  await mkdir(dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: Boolean(meta.full) });
  const box = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    url: location.pathname + location.search,
    title: document.title,
  }));
  const entry = {
    file: `docs/ui/evidence/${rel}`,
    viewport: meta.viewport,
    state: meta.state,
    data: meta.data ?? null,
    url: box.url,
    overflowX: box.overflowX,
    full: Boolean(meta.full),
    rev: REV.rev,
    dirty: REV.dirty,
    at: new Date().toISOString(),
  };
  manifest.push(entry);
  if (box.overflowX > 1) measures.problems.push(`overflow-x ${box.overflowX}px ${rel}`);
  console.log(`  ${rel}${box.overflowX > 1 ? ` overflow ${box.overflowX}` : ''}`);
  return entry;
}

function watch(page, label) {
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (text.includes('401') && text.includes('refresh')) return;
    measures.problems.push(`console ${label} ${text.slice(0, 180)}`);
  });
  page.on('pageerror', (error) => measures.problems.push(`pageerror ${label} ${error.message}`));
  page.on('response', (response) => {
    if (response.status() < 400) return;
    if (response.status() === 401 && response.url().includes('/auth/refresh')) return;
    measures.problems.push(`http ${response.status()} ${response.request().method()} ${response.url()}`);
  });
}

async function open(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.addStyleTag({ content: HIDE }).catch(() => {});
  await page.waitForTimeout(600);
}

async function login(page, email, password) {
  await open(page, '/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /Entrar/ }).click();
  await page.waitForURL(/\/(panel|admin)/, { timeout: 30000 });
  await page.waitForTimeout(500);
}

async function measureSurface(page, id) {
  const data = await page.evaluate(() => {
    function box(el) {
      if (!el) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        cls: String(el.className).slice(0, 80),
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        color: s.color,
        background: s.backgroundColor,
        radius: s.borderRadius,
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    }
    const h1 = document.querySelector('h1');
    const button = document.querySelector('button, a.ag-btn-cta, a.ag-btn-primary, .ik-btn, .mk-btn, .admin-btn');
    const hits = [...document.querySelectorAll('button, a, [role="button"], input, textarea')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return null;
        const text = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
        return { text, w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter(Boolean)
      .filter((hit) => hit.w < 44 || hit.h < 44)
      .slice(0, 12);
    return { h1: box(h1), button: box(button), small: hits };
  });
  measures.pages.push({ id, url: page.url(), ...data });
}

async function families(browser) {
  const widths = [
    { w: 390, h: 844, tag: '390' },
    { w: 1440, h: 900, tag: '1440' },
  ];
  const publicRoutes = [
    ['/', 'home'],
    ['/ikigai', 'ikigai'],
    ['/manifiesto', 'manifiesto'],
    ['/precios', 'precios'],
  ];
  const authRoutes = [
    ['/login', 'login'],
    ['/register', 'register'],
    ['/forgot-password', 'forgot'],
  ];

  for (const vp of widths) {
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    watch(page, `public-${vp.tag}`);
    for (const [path, name] of publicRoutes) {
      await open(page, path);
      await page.waitForSelector('h1', { timeout: 15000 }).catch(() => {});
      if (vp.tag === '390' && name === 'home') await measureSurface(page, 'public-home-390');
      await shot(page, `public/${vp.tag}-${name}.png`, { viewport: `${vp.w}x${vp.h}`, state: 'anonimo', full: true });
    }
    for (const [path, name] of authRoutes) {
      await open(page, path);
      await shot(page, `auth/${vp.tag}-${name}.png`, { viewport: `${vp.w}x${vp.h}`, state: 'vacio' });
    }
    await open(page, '/no-existe-auditoria');
    await shot(page, `transversal/${vp.tag}-404.png`, { viewport: `${vp.w}x${vp.h}`, state: '404' });
    await open(page, '/ikigai/s/00000000-0000-4000-8000-000000000000');
    await page.waitForTimeout(800);
    await shot(page, `transversal/${vp.tag}-ikigai-sesion-invalida.png`, {
      viewport: `${vp.w}x${vp.h}`,
      state: 'sesion-inexistente',
    });
    await context.close();
  }

  const members = [
    ['demo.user1@maximus-kratos.local', 'user1-terms'],
    ['demo.user2@maximus-kratos.local', 'user2-profile'],
    ['demo.user3@maximus-kratos.local', 'user3-blueprint'],
  ];
  for (const vp of widths) {
    for (const [email, tag] of members) {
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      watch(page, tag);
      await login(page, email, 'DemoUser123!');
      const routes = tag.startsWith('user3')
        ? [['/panel', 'panel'], ['/perfil', 'perfil'], ['/ruta', 'ruta'], ['/cuenta', 'cuenta']]
        : [['/panel', 'panel']];
      for (const [path, name] of routes) {
        await open(page, path);
        await page.waitForTimeout(400);
        if (vp.tag === '390' && tag.startsWith('user3') && name === 'panel') await measureSurface(page, 'member-panel-390');
        await shot(page, `miembro/${vp.tag}-${tag}-${name}.png`, {
          viewport: `${vp.w}x${vp.h}`,
          state: tag,
          data: email,
          full: true,
        });
      }
      await context.close();
    }
  }

  for (const vp of widths) {
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    watch(page, 'admin');
    await login(page, 'admin@maximus-kratos.local', 'ChangeMeAdmin123!');
    await open(page, '/admin');
    if (vp.tag === '1440') await measureSurface(page, 'admin-1440');
    await shot(page, `admin/${vp.tag}-home.png`, { viewport: `${vp.w}x${vp.h}`, state: 'admin', full: true });
    await open(page, '/admin/lab');
    await page.waitForSelector('.lab-case, h1', { timeout: 20000 }).catch(() => {});
    if (vp.tag === '1440') await measureSurface(page, 'lab-1440');
    await shot(page, `admin/${vp.tag}-lab.png`, { viewport: `${vp.w}x${vp.h}`, state: 'lab', full: true });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 320, height: 700 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await login(page, 'demo.user3@maximus-kratos.local', 'DemoUser123!');
  for (const [width, path, name] of [
    [320, '/panel', '320-panel'],
    [768, '/panel', '768-panel'],
    [900, '/perfil', '900-perfil'],
  ]) {
    await page.setViewportSize({ width, height: 800 });
    await open(page, path);
    await shot(page, `miembro/${name}.png`, { viewport: `${width}x800`, state: 'user3-reflujo', full: true });
  }
  await context.close();
}

async function click(page, name, options = {}) {
  const target = page.getByRole('button', { name, exact: options.exact ?? false }).first();
  await target.waitFor({ state: 'visible', timeout: options.timeout ?? 15000 });
  await target.click();
  await page.waitForTimeout(options.wait ?? 300);
}

async function addPiece(page, value) {
  const area = page.locator('#ik-item-text');
  if (!(await area.isVisible().catch(() => false))) await click(page, 'Escribir una pieza');
  await page.locator('#ik-item-text').fill(value);
  await click(page, 'Guardar');
}

async function startFresh(page) {
  await page.goto(`${BASE}/ikigai/empezar`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/ikigai/empezar`, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: HIDE }).catch(() => {});
  await page.waitForTimeout(400);
  await click(page, 'Empezar');
  await page.waitForURL(/\/ikigai\/s\/[0-9a-f-]+/i, { timeout: 30000 });
  await page.waitForTimeout(400);
}

async function mapGeometry(page) {
  return page.evaluate(() => {
    const svg = document.querySelector('.ik-map');
    if (!svg) return null;
    const sr = svg.getBoundingClientRect();
    function rel(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x - sr.x, y: r.y - sr.y, w: r.width, h: r.height, text: (el.textContent || '').trim().slice(0, 40) };
    }
    const hits = [...svg.querySelectorAll('[role="button"]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { label: el.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const label = svg.querySelector('.ik-map__label');
    const cross = svg.querySelector('.ik-map__cross');
    const brand = svg.querySelector('.ik-map__brand');
    const focus = getComputedStyle(svg.querySelector('.ik-map__spot') || svg);
    return {
      map: { w: Math.round(sr.width), h: Math.round(sr.height) },
      label: rel(label),
      cross: rel(cross),
      brand: rel(brand),
      hits,
      spotOutline: focus.outlineStyle,
    };
  });
}

async function sampleMap(page, tag) {
  const geo = await mapGeometry(page);
  if (!geo) {
    measures.circles.push({ tag, present: false });
    return;
  }
  const png = await page.locator('.ik-map').screenshot();
  const img = decodePng(png);
  function sample(box) {
    if (!box) return null;
    const text = img.at(box.x + box.w / 2, box.y + box.h / 2);
    const outside = img.at(box.x + box.w / 2, Math.max(0, box.y - 6));
    return { text, outside, contrast: ratio(text, outside), box: { w: Math.round(box.w), h: Math.round(box.h) } };
  }
  const upper = img.at(img.width / 2, img.height * 0.18);
  const pageBg = img.at(8, 8);
  measures.circles.push({
    tag,
    present: true,
    map: geo.map,
    hits: geo.hits,
    spotOutline: geo.spotOutline,
    label: sample(geo.label),
    cross: sample(geo.cross),
    brand: sample(geo.brand),
    upperFillVsPage: { upper, pageBg, contrast: ratio(upper, pageBg) },
    labelText: geo.label?.text ?? null,
    crossText: geo.cross?.text ?? null,
    brandText: geo.brand?.text ?? null,
  });
}

async function keyboardPass(page, id) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  const first = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      name: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || el.tagName,
      outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`,
      shadow: s.boxShadow.slice(0, 80),
    };
  });
  const names = [first?.name];
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    const name = await page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim().slice(0, 40),
    );
    names.push(name);
  }
  measures.keyboard.push({ id, first, names });
}

async function ikigai(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  watch(page, 'ikigai-390');
  await open(page, '/ikigai/empezar');
  await shot(page, 'ikigai/390-empezar.png', { viewport: '390x844', state: 'antes-de-empezar' });
  await keyboardPass(page, 'empezar-390');
  await startFresh(page);
  await shot(page, 'ikigai/390-explorar-vacio.png', { viewport: '390x844', state: 'vacio', data: 'PASION' });

  await click(page, 'Escribir una pieza');
  await page.locator('#ik-item-text').fill('ab');
  const short = await page.getByRole('button', { name: 'Guardar', exact: true }).isDisabled();
  const shortHint = await page.locator('.ik-hint').allTextContents();
  measures.repro.push({ id: 'guardar-pieza-corto', disabled: short, hints: shortHint, chars: 2 });
  await shot(page, 'ikigai/390-pieza-corta-deshabilitada.png', {
    viewport: '390x844',
    state: 'guardar-deshabilitado',
    data: '2 caracteres',
  });
  await page.locator('#ik-item-text').fill(PIECES.PASION[0]);
  await click(page, 'Guardar');
  await page.getByText(PIECES.PASION[0].slice(0, 24)).click();
  await page.locator('#ik-item-text').fill(`${PIECES.PASION[0]} y con tiempo para preguntar`);
  await click(page, 'Guardar');
  await addPiece(page, PIECES.PASION[1]);
  await shot(page, 'ikigai/390-explorar-dos-piezas.png', { viewport: '390x844', state: 'editado', data: 'PASION' });

  const backOnFirst = await page.getByRole('button', { name: 'Atrás' }).count();
  measures.repro.push({ id: 'atras-en-primer-lente', count: backOnFirst });
  await click(page, 'Continuar');
  await addPiece(page, PIECES.CAPACIDAD[0]);
  await addPiece(page, PIECES.CAPACIDAD[1]);
  await page.getByRole('button', { name: 'Atrás' }).click();
  await page.waitForTimeout(400);
  const backLanded = await page.locator('h1').innerText();
  measures.repro.push({ id: 'volver', h1: backLanded });
  await shot(page, 'ikigai/390-volver.png', { viewport: '390x844', state: 'vuelta', data: backLanded });
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await addPiece(page, PIECES.NECESIDAD[0]);
  await click(page, 'Continuar');
  await click(page, 'Todavía no lo tengo claro');
  await shot(page, 'ikigai/390-valor-unclear.png', { viewport: '390x844', state: 'unclear', data: 'VALOR' });
  await click(page, 'Continuar');
  await page.waitForTimeout(500);
  await shot(page, 'ikigai/390-conectar.png', { viewport: '390x844', state: 'mapa', data: 'sin seleccion' });
  await sampleMap(page, '390');
  await keyboardPass(page, 'conectar-390');

  const zone = page.getByRole('button', { name: /Pasión:/ });
  await zone.click();
  await page.waitForTimeout(300);
  const picks = page.locator('.ik-item--pick');
  const pickCount = await picks.count();
  for (let i = 0; i < Math.min(2, pickCount); i += 1) await picks.nth(i).click();
  const sheetOpen = await page.locator('.ik-sheet, [role="dialog"]').count();
  await page.locator('#hyp-text').fill('corta');
  const hintShort = await page.locator('.ik-table .ik-hint').allTextContents();
  const saveDisabled = await page.getByRole('button', { name: 'Guardar posibilidad' }).isDisabled();
  measures.repro.push({ id: 'guardar-posibilidad-corta', sheetOpen, pickCount, saveDisabled, hints: hintShort });
  await shot(page, 'ikigai/390-posibilidad-corta.png', {
    viewport: '390x844',
    state: 'cta-deshabilitado',
    data: 'frase de 5 caracteres con ideas elegidas',
  });
  await page.locator('#hyp-text').fill('');
  await page.waitForTimeout(150);
  const hintEmpty = await page.locator('.ik-table .ik-hint').allTextContents();
  const stillDisabled = await page.getByRole('button', { name: 'Guardar posibilidad' }).isDisabled();
  measures.repro.push({ id: 'guardar-posibilidad-vacia', stillDisabled, hints: hintEmpty });
  await shot(page, 'ikigai/390-posibilidad-vacia-sin-motivo.png', {
    viewport: '390x844',
    state: 'cta-deshabilitado-sin-motivo',
    data: 'frase vacia con ideas elegidas',
  });
  await page.locator('#hyp-text').fill(PHRASE.slice(0, 120));
  await shot(page, 'ikigai/390-sheet-abierta.png', { viewport: '390x844', state: 'sheet', data: 'posibilidad' });
  const intercept = await page.evaluate(() => {
    const sheet = document.querySelector('.ik-sheet');
    const point = document.elementFromPoint(window.innerWidth / 2, 80);
    return {
      sheet: Boolean(sheet),
      topTag: point ? point.tagName : null,
      topClass: point ? String(point.className).slice(0, 80) : null,
    };
  });
  measures.repro.push({ id: 'sheet-cubre', ...intercept });
  await click(page, 'Guardar posibilidad');
  await page.waitForTimeout(400);
  await shot(page, 'ikigai/390-posibilidad-guardada.png', { viewport: '390x844', state: 'guardada', full: true });
  await page.getByRole('button', { name: /Pasión:/ }).click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  measures.repro.push({ id: 'escape-sheet', textareaStillThere: await page.locator('#hyp-text').count() });

  const explore = page.getByRole('button', { name: 'Quiero explorar esta' });
  await explore.scrollIntoViewIfNeeded();
  await explore.click();
  await page.waitForTimeout(500);
  await shot(page, 'ikigai/390-contraste.png', { viewport: '390x844', state: 'contraste' });
  for (let step = 0; step < 8; step += 1) {
    const finish = page.getByRole('button', { name: 'Guardar mi mapa' });
    const radio = page.getByRole('radio').nth(3);
    if (await radio.count()) await radio.click();
    await page.waitForTimeout(200);
    if ((await finish.count()) && (await finish.isEnabled())) break;
    const next = page.getByRole('button', { name: 'Continuar', exact: true });
    if (!(await next.count()) || !(await next.isEnabled())) break;
    await next.click();
    await page.waitForTimeout(250);
  }
  await shot(page, 'ikigai/390-contraste-ultimo.png', { viewport: '390x844', state: 'listo-para-cerrar' });

  await page.route('**/ikigai/sessions/**/complete', (route) => route.abort());
  await click(page, 'Guardar mi mapa');
  await page.waitForTimeout(800);
  const banner = await page.locator('.ik-banner').textContent().catch(() => null);
  const finishDisabled = await page.getByRole('button', { name: 'Guardar mi mapa' }).isDisabled().catch(() => null);
  measures.repro.push({ id: 'complete-abort', banner, finishDisabled });
  await shot(page, 'ikigai/390-error-guardado.png', { viewport: '390x844', state: 'error-recuperable', data: 'complete abort' });
  await page.unroute('**/ikigai/sessions/**/complete');
  const retry = page.getByRole('button', { name: 'Reintentar' });
  if (await retry.count()) await retry.click();
  else await click(page, 'Guardar mi mapa');
  await page.waitForURL(/resultado/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(700);
  await shot(page, 'ikigai/390-resultado.png', { viewport: '390x844', state: 'resultado', full: true });
  await sampleMap(page, '390-resultado');
  const reopen = page.getByRole('button', { name: 'Volver a explorar' });
  if (await reopen.count()) {
    await reopen.click();
    await page.waitForURL(/\/ikigai\/s\//, { timeout: 20000 });
    await page.waitForTimeout(500);
    await shot(page, 'ikigai/390-reabierto.png', { viewport: '390x844', state: 'reabierto' });
  }

  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await page.waitForTimeout(300);
  await shot(page, 'ikigai/390-salir.png', { viewport: '390x844', state: 'confirmar-salida' });
  measures.repro.push({
    id: 'salir-doble',
    note: 'El Salir del header queda bajo el scrim. El que confirma es el del diálogo.',
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Salir', exact: true }).click();
  await page.waitForTimeout(500);
  await open(page, '/ikigai/empezar');
  const resume = page.getByRole('button', { name: /Continuar donde quedé|Ver mi mapa/ });
  measures.repro.push({ id: 'reanudar', visible: await resume.count() });
  if (await resume.count()) {
    await resume.click();
    await page.waitForTimeout(700);
    await shot(page, 'ikigai/390-reanudado.png', { viewport: '390x844', state: 'reanudado' });
  }
  await context.close();

  for (const [width, height, tag] of [
    [320, 700, '320'],
    [768, 900, '768'],
    [900, 900, '900'],
    [1280, 800, '1280'],
    [1440, 900, '1440'],
  ]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const narrow = await ctx.newPage();
    watch(narrow, `ikigai-${tag}`);
    await startFresh(narrow);
    for (const text of PIECES.PASION) await addPiece(narrow, text);
    await click(narrow, 'Continuar');
    for (const text of PIECES.CAPACIDAD) await addPiece(narrow, text);
    await click(narrow, 'Continuar');
    await addPiece(narrow, PIECES.NECESIDAD[0]);
    await click(narrow, 'Continuar');
    await click(narrow, 'Todavía no lo tengo claro');
    await click(narrow, 'Continuar');
    await narrow.waitForTimeout(400);
    await shot(narrow, `ikigai/${tag}-conectar.png`, { viewport: `${width}x${height}`, state: 'mapa' });
    if (tag === '320' || tag === '1440' || tag === '768') await sampleMap(narrow, tag);
    await ctx.close();
  }

  const kit = await webkit.launch();
  const kitCtx = await kit.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const kitPage = await kitCtx.newPage();
  await startFresh(kitPage);
  await addPiece(kitPage, PIECES.PASION[0]);
  await click(kitPage, 'Continuar');
  await addPiece(kitPage, PIECES.CAPACIDAD[0]);
  await click(kitPage, 'Continuar');
  await addPiece(kitPage, PIECES.NECESIDAD[0]);
  await click(kitPage, 'Continuar');
  await click(kitPage, 'Todavía no lo tengo claro');
  await click(kitPage, 'Continuar');
  await kitPage.waitForTimeout(400);
  await shot(kitPage, 'ikigai/webkit-390-conectar.png', { viewport: '390x844', state: 'webkit', data: 'mapa' });
  await kit.close();
}

async function explorations() {
  const browser = await chromium.launch();
  for (const [file, name] of [
    ['conectar-a.html', 'a-lista'],
    ['conectar-b.html', 'b-mapa'],
  ]) {
    const path = join(ROOT, 'docs/ui/explorations', file);
    try {
      await readFile(path);
    } catch {
      continue;
    }
    for (const [w, h, tag] of [
      [390, 844, '390'],
      [1440, 900, '1440'],
    ]) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await page.goto(`file://${path}`, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      await shot(page, `explorations/${tag}-${name}.png`, {
        viewport: `${w}x${h}`,
        state: 'PROPUESTA',
        data: file,
      });
      await page.close();
    }
  }
  await browser.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    if (ONLY === 'all' || ONLY === 'families') await families(browser);
    if (ONLY === 'all' || ONLY === 'ikigai') await ikigai(browser);
  } finally {
    await browser.close();
    if (ONLY === 'all' || ONLY === 'explorations') await explorations().catch((error) => console.error(error));
    let previous = [];
    try {
      previous = JSON.parse(await readFile(join(OUT, 'manifest.json'), 'utf8')).shots ?? [];
    } catch { /* first run */ }
    const names = new Set(manifest.map((shot) => shot.file));
    const shots = [...previous.filter((shot) => !names.has(shot.file)), ...manifest];
    await writeFile(join(OUT, 'manifest.json'), JSON.stringify({ rev: REV, shots }, null, 2));
    let priorMeasures = {};
    try {
      priorMeasures = JSON.parse(await readFile(join(OUT, 'measures.json'), 'utf8'));
    } catch { /* first run */ }
    const mergedMeasures = {
      pages: [...(priorMeasures.pages ?? []).filter((row) => !measures.pages.some((next) => next.id === row.id)), ...measures.pages],
      targets: measures.targets,
      circles: measures.circles.length ? measures.circles : priorMeasures.circles ?? [],
      keyboard: measures.keyboard.length ? measures.keyboard : priorMeasures.keyboard ?? [],
      repro: measures.repro.length ? measures.repro : priorMeasures.repro ?? [],
      problems: [...new Set([...(priorMeasures.problems ?? []), ...measures.problems])],
    };
    await writeFile(join(OUT, 'measures.json'), JSON.stringify(mergedMeasures, null, 2));
    console.log(`shots ${manifest.length} problems ${measures.problems.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
