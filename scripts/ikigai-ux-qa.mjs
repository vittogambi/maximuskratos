/**
 * Browser QA for the IKIGAI player. Walks the anonymous flow and writes
 * screenshots plus a console/network error report. Requires the dev stack running.
 *
 *   node scripts/ikigai-ux-qa.mjs [--viewport 390x844] [--out tmp/ikigai-qa] [--flow all]
 *
 * Flows: happy (start, 4 lenses, bank, connect, contrast, result, experiment),
 * empty (4 unclear lenses, empty connect, result without direction),
 * resume (autosave, refresh, exit, resume).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const BASE = arg('base', 'http://localhost:3000');
const OUT = arg('out', 'tmp/ikigai-qa');
const FLOW = arg('flow', 'all');
const [width, height] = arg('viewport', '390x844').split('x').map(Number);
const problems = [];

const HIDE_DEV_BADGE = `nextjs-portal { display: none !important; }`;

async function shot(page, name, { full = false } = {}) {
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage: full });
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  if (overflow > 0) problems.push(`overflow-x ${overflow}px on ${name}`);
  console.log(`  shot ${file}${overflow > 0 ? ` (overflow-x ${overflow}px)` : ''}`);
}

async function click(page, name, { exact = true, wait = 350 } = {}) {
  const target = page.getByRole('button', { name, exact }).first();
  await target.waitFor({ state: 'visible', timeout: 15_000 });
  await target.click();
  await page.waitForTimeout(wait);
}

async function addPiece(page, value) {
  const area = page.locator('#ik-item-text');
  if (!(await area.isVisible().catch(() => false))) {
    await click(page, 'Escribir una pieza');
  }
  await page.locator('#ik-item-text').fill(value);
  await click(page, 'Guardar');
}

async function startFresh(page) {
  await page.goto(`${BASE}/ikigai/empezar`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/ikigai/empezar`, { waitUntil: 'networkidle' });
  await click(page, 'Empezar');
  await page.waitForURL(/\/ikigai\/s\/[0-9a-f-]+/i, { timeout: 30_000 });
  await page.waitForTimeout(400);
}

async function happy(page, tag) {
  await startFresh(page);
  await shot(page, `${tag}-01-explorar-vacio`);

  await addPiece(page, 'enseñar cosas que ya aprendí');
  await click(page, 'Ver ideas');
  await page.getByRole('button', { name: 'Enseñar', exact: true }).click();
  await page.waitForTimeout(250);
  await shot(page, `${tag}-01b-explorar-sheet-detalle`);
  await click(page, 'Cerrar');
  await addPiece(page, 'ordenar sistemas complicados');
  await addPiece(page, 'entrenar');
  await shot(page, `${tag}-02-explorar-tres-piezas`);

  await click(page, 'Ver ideas');
  await shot(page, `${tag}-03-banco`);
  await click(page, 'Escribir');
  await shot(page, `${tag}-04-personalizar`);
  await page.locator('#ik-adopt-text').fill('escribir sobre lo que aprendo');
  await click(page, 'Añadir a mis ideas');
  await shot(page, `${tag}-05-explorar-tras-banco`);

  await click(page, 'Continuar');
  await addPiece(page, 'explicar temas difíciles de forma simple');
  await addPiece(page, 'organizar equipos pequeños');
  await click(page, 'Continuar');
  await addPiece(page, 'personas que están empezando y se sienten perdidas');
  await addPiece(page, 'equipos donde todo depende de una sola persona');
  await click(page, 'Continuar');
  await addPiece(page, 'capacitación');
  await addPiece(page, 'consultoría');
  await click(page, 'Continuar');

  await shot(page, `${tag}-06-conectar-vacio-seleccion`);
  await click(page, 'enseñar cosas que ya aprendí', { exact: false });
  await click(page, 'explicar temas difíciles de forma simple', { exact: false });
  await click(page, 'personas que están empezando y se sienten perdidas', { exact: false });
  await click(page, 'capacitación', { exact: false });
  await shot(page, `${tag}-07-conectar-con-piezas`);

  await click(page, 'Ponerlo en palabras');
  await shot(page, `${tag}-08-hipotesis`);
  await click(page, 'Necesito una guía');
  await shot(page, `${tag}-08b-guia`);
  await click(page, 'Necesito una guía');
  await page
    .locator('#hyp-text')
    .fill('Ayudar a personas que están empezando a dominar herramientas complejas mediante formación práctica.');
  await click(page, 'Guardar dirección');
  await shot(page, `${tag}-09-direccion-guardada`);

  await click(page, 'Contrastar esta dirección');
  await shot(page, `${tag}-10-contraste`);
  await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
  await page.waitForTimeout(250);
  await shot(page, `${tag}-10b-contraste-seleccionado`);
  await click(page, 'Continuar');
  for (let i = 1; i < 6; i += 1) {
    await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    await click(page, i === 5 ? 'Ver mi mapa' : 'Continuar');
  }
  await page.waitForTimeout(900);
  await shot(page, `${tag}-11-resultado-con-direccion`);
  await shot(page, `${tag}-11-resultado-con-direccion-full`, { full: true });
  await page.getByText('Cómo se ve hoy').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await shot(page, `${tag}-11b-como-se-ve-hoy`);
  const open = page.getByText('Qué aparece al mirar el conjunto');
  if (await open.isVisible().catch(() => false)) {
    await open.scrollIntoViewIfNeeded();
  }
  await page.getByText('Qué falta descubrir').scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(200);
  await shot(page, `${tag}-11c-senales`);
  await page.getByRole('button', { name: 'Ponerla a prueba' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await shot(page, `${tag}-11d-ponerla-a-prueba`);

  await click(page, 'Ponerla a prueba');
  await page.locator('#exp-focus').fill('Si realmente disfruto enseñar esto de forma sostenida');
  await page.getByRole('radio', { name: '30 días' }).click();
  await page.locator('#exp-action').fill('Dar cuatro sesiones piloto');
  await page.locator('#exp-signal').fill('Al menos tres personas quieren continuar y yo quiero repetirlo');
  await click(page, 'Guardar la prueba');
  await shot(page, `${tag}-12-experimento`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const kept = await page.locator('#exp-focus').inputValue();
  if (!kept.includes('disfruto enseñar')) problems.push('experiment did not survive reload');
}

async function empty(page, tag) {
  await startFresh(page);
  await shot(page, `${tag}-20-explorar-vacio`);
  await click(page, 'Todavía no lo tengo claro');
  await shot(page, `${tag}-20b-unclear-on`);
  await click(page, 'Continuar');
  for (let i = 1; i < 4; i += 1) {
    await click(page, 'Todavía no lo tengo claro');
    await click(page, 'Continuar');
  }
  await shot(page, `${tag}-20-conectar-vacio`);
  await click(page, 'Todavía no veo una dirección clara');
  await click(page, 'Ver mi mapa');
  await page.waitForTimeout(1000);
  await shot(page, `${tag}-21-resultado-sin-direccion`);
  await shot(page, `${tag}-21-resultado-sin-direccion-full`, { full: true });
}

async function gaps(page, tag) {
  await startFresh(page);
  await addPiece(page, 'enseñar cosas que ya aprendí');
  await addPiece(page, 'entrenar');
  await click(page, 'Continuar');
  for (let i = 0; i < 3; i += 1) {
    await click(page, 'Todavía no lo tengo claro');
    await click(page, 'Continuar');
  }
  await click(page, 'enseñar cosas que ya aprendí', { exact: false });
  await click(page, 'Ponerlo en palabras');
  await page
    .locator('#hyp-text')
    .fill('Enseñar de forma sostenida a gente que está empezando ahora.');
  await click(page, 'Guardar dirección');
  await click(page, 'Contrastar esta dirección');
  for (let i = 0; i < 6; i += 1) {
    if (i === 3) {
      await click(page, 'Prefiero no responder');
    } else {
      await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
      await page.waitForTimeout(200);
    }
    await click(page, i === 5 ? 'Ver mi mapa' : 'Continuar');
  }
  await page.waitForTimeout(800);
  await shot(page, `${tag}-40-mapa-con-huecos`);
  await page.getByText('Qué aparece al mirar el conjunto').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await shot(page, `${tag}-40b-senales-agrupadas`);
  await shot(page, `${tag}-40-mapa-con-huecos-full`, { full: true });
}

async function resume(page, tag) {
  await startFresh(page);
  await addPiece(page, 'correr al amanecer');
  await page.waitForTimeout(1400);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (!(await page.getByText('correr al amanecer').first().isVisible())) {
    problems.push('piece lost after refresh');
  }
  await click(page, 'Continuar');
  await addPiece(page, 'explicar cosas complicadas');
  await page.waitForTimeout(1400);
  await click(page, 'Salir');
  await page.getByRole('dialog').getByRole('button', { name: 'Salir' }).click();
  await page.waitForURL(/\/ikigai\/empezar/i, { timeout: 20_000 });
  await shot(page, `${tag}-30-retomar`);
  await click(page, 'Continuar donde quedé');
  await page.waitForTimeout(900);
  if (!(await page.getByText('explicar cosas complicadas').first().isVisible())) {
    problems.push('resume did not land on the saved lens');
  }
  await shot(page, `${tag}-31-retomado`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.addStyleTag({ content: HIDE_DEV_BADGE }).catch(() => undefined);
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('response', (res) => {
    if (res.status() >= 400) problems.push(`http ${res.status()} ${res.url()}`);
  });
  await context.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = 'nextjs-portal { display: none !important; }';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  });

  const tag = `${width}`;
  try {
    if (FLOW === 'all' || FLOW === 'happy') await happy(page, tag);
    if (FLOW === 'all' || FLOW === 'empty') await empty(page, tag);
    if (FLOW === 'all' || FLOW === 'gaps') await gaps(page, tag);
    if (FLOW === 'all' || FLOW === 'resume') await resume(page, tag);
  } catch (err) {
    problems.push(`flow failed: ${err.message}`);
    await shot(page, `${tag}-99-failure`);
  }

  await writeFile(`${OUT}/report-${tag}.json`, JSON.stringify({ viewport: `${width}x${height}`, problems }, null, 2));
  console.log(problems.length ? `\nproblems:\n${problems.join('\n')}` : '\nno console or network problems');
  await browser.close();
  if (problems.some((p) => p.startsWith('flow failed'))) process.exitCode = 1;
}

await main();
