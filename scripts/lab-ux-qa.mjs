/**
 * Browser QA for the Methodology Lab. Walks the session Rafa would run and writes
 * screenshots plus a console/network error report. Requires the dev stack running.
 *
 *   node scripts/lab-ux-qa.mjs [--viewport 1440x900] [--out .qa/lab-ux]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const BASE = arg('base', 'http://localhost:3000');
const OUT = arg('out', '.qa/lab-ux');
const [width, height] = arg('viewport', '1440x900').split('x').map(Number);
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@maximus-kratos.local';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!';

const problems = [];
let shot = 0;
let browserRef = null;

async function capture(page, name, options = {}) {
  shot += 1;
  const file = `${OUT}/${String(shot).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: file, fullPage: options.full ?? true });
  console.log(`  screenshot ${file}`);
}

/** Clicks a button by its visible text and waits for the UI to settle. */
async function click(page, text, options = {}) {
  const root = options.within ? page.locator(options.within) : page;
  const target = root.getByRole('button', { name: text, exact: options.exact ?? false }).first();
  await target.waitFor({ state: 'visible', timeout: options.timeout ?? 15000 });
  await target.click();
  await page.waitForTimeout(options.wait ?? 700);
}

async function openCase(page, label) {
  await page.goto(`${BASE}/admin/lab`, { waitUntil: 'networkidle' });
  const card = page.locator('.lab-case', { hasText: label }).first();
  await card.waitFor({ state: 'visible', timeout: 20000 });
  await card.getByRole('link').first().click();
  await page.waitForURL(/\/admin\/lab\/runs\//, { timeout: 20000 });
  await page.waitForSelector('.lab-stepper', { timeout: 20000 });
  await page.waitForTimeout(800);
}

/** Freeze responses, register a minimal prediction and reveal. */
async function predictAndReveal(page, { states, priority, purpose, confidence, open }) {
  const stepper = page.locator('.lab-stepper');
  if (await page.getByRole('button', { name: 'Ver todas las preguntas', exact: true }).count()) {
    await click(page, 'Ver todas las preguntas', { exact: true });
  }
  if (await page.getByRole('button', { name: /Cerrar respuestas y hacer/ }).count()) {
    await click(page, 'Cerrar respuestas y hacer mi predicción');
    await click(page, 'Cerrar respuestas', { within: '.lab-modal', exact: true, wait: 1800 });
  }
  await stepper.getByRole('button', { name: 'Tu criterio' }).click();
  await page.waitForTimeout(500);

  if (open) {
    const areas = page.locator('textarea');
    const texts = [open.happening, open.concern, open.focus, open.action];
    for (let index = 0; index < texts.length; index += 1) {
      await areas.nth(index).fill(texts[index]);
    }
  }
  for (const [domain, state] of Object.entries(states)) {
    await page.locator(`input[name="estado-${domain}"][value="${state}"]`).check();
  }
  await page.locator(`input[name="prioridad"][value="${priority}"]`).check();
  await page.locator(`input[name="proposito"][value="${purpose}"]`).check();
  await page.locator(`input[name="confianza"][value="${confidence}"]`).check();
  return stepper;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  browserRef = browser;
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    // The anonymous refresh attempt on the login page is expected.
    if (page.url().includes('/login') && message.text().includes('401')) return;
    problems.push(`console ${page.url()} :: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror ${page.url()} :: ${error.message}`));
  page.on('response', (response) => {
    // A 401 on refresh before login is the expected anonymous answer, not a defect.
    if (response.status() === 401 && response.url().includes('/auth/refresh')) return;
    if (response.status() >= 400) {
      problems.push(`http ${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  console.log(`login as ${EMAIL}`);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /Entrar/ }).click();
  await page.waitForURL(/\/(admin|app)/, { timeout: 30000 });

  console.log('lab home');
  await page.goto(`${BASE}/admin/lab`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.lab-case', { timeout: 20000 });
  await capture(page, 'home');

  console.log('R01 full session');
  await openCase(page, 'R01');
  await capture(page, 'r01-caso');

  await click(page, 'Ver todas las preguntas');
  await capture(page, 'r01-respuestas', { full: false });

  const stepper = await predictAndReveal(page, {
    states: {
      MENTALIDAD: 'CONSOLIDACIÓN',
      RELACIONES: 'ESTABILIZACIÓN',
      FINANZAS: 'ESTABILIZACIÓN',
      CUERPO: 'CONTENCIÓN',
    },
    priority: 'CUERPO',
    purpose: 'HIPOTETICO',
    confidence: 'MEDIA',
    open: {
      happening: 'Sostiene mucho sin estructura. No está en crisis, pero se le está yendo la vida en resolver.',
      concern: 'El descanso y el tiempo con su familia.',
      focus: 'Cuerpo, porque el descanso condiciona todo lo demás.',
      action: 'Fijar una hora de cierre del día y respetarla toda la semana.',
    },
  });
  await capture(page, 'r01-prediccion');

  await click(page, 'Guardar mi predicción y ver qué hizo la Matriz');
  await click(page, 'Guardar y ver el resultado', { within: '.lab-modal', wait: 3000 });
  await capture(page, 'r01-resultado');

  await page.getByRole('tab', { name: 'Por qué dio este resultado' }).click();
  await page.waitForTimeout(900);
  await capture(page, 'r01-porque');

  await stepper.getByRole('button', { name: 'Tu evaluación' }).click();
  await page.waitForTimeout(800);
  await page.locator('input[name="verdict-safety"][value="CORRECT"]').check();
  await page.locator('input[name="verdict-priority"][value="INCORRECT"]').check();
  await page.locator('input[name="verdict-interpretation"][value="PARTIAL"]').check();
  await page.locator('input[name="first-divergence"][value="PRIORITY"]').check();
  await page.waitForTimeout(400);
  await capture(page, 'r01-evaluacion');

  await click(page, 'Guardar evaluación', { wait: 1800 });
  await click(page, 'Continuar a Propósito', { wait: 1200 });
  await page.locator('input[name="purpose-stage"][value="HIPOTETICO"]').check();
  await page.locator('input[name="purpose-confidence"][value="MEDIA"]').check();
  await capture(page, 'r01-proposito');

  await click(page, 'Guardar mi lectura de Propósito', { wait: 1800 });
  await click(page, 'Ver experiencia de la persona', { wait: 1500 });
  await page.locator('input[name="focus-choice"][value="OTHER"]').check();
  await page.waitForTimeout(300);
  const otherDomain = page.locator('input[name="focus-other"][value="CUERPO"]');
  if (await otherDomain.count()) await otherDomain.check();
  const areas = page.locator('textarea');
  await areas.nth(1).fill('Construir autonomía profesional sin desaparecer de casa.');
  await areas.last().fill('Apagar pantallas a las once y dormir siete horas.');
  await click(page, 'Generar vista de la persona', { wait: 2500 });
  await capture(page, 'r01-experiencia');

  await stepper.getByRole('button', { name: 'Probar cambio' }).click();
  await page.waitForTimeout(800);
  await page.locator('input[name="change-kind"][value="INTERPRETATION"]').check();
  await page.waitForTimeout(500);
  await capture(page, 'r01-probar-cambio');

  for (const [label, states, priority] of [
    ['R04', { MENTALIDAD: 'ESTABILIZACIÓN', RELACIONES: 'ESTABILIZACIÓN', FINANZAS: 'ESTABILIZACIÓN', CUERPO: 'ESTABILIZACIÓN' }, 'CUERPO'],
    ['R10', { MENTALIDAD: 'NO_CLASIFICADO', RELACIONES: 'NO_CLASIFICADO', FINANZAS: 'NO_CLASIFICADO', CUERPO: 'NO_CLASIFICADO' }, 'NONE'],
    ['R11', { MENTALIDAD: 'ESTABILIZACIÓN', RELACIONES: 'ESTABILIZACIÓN', FINANZAS: 'ESTABILIZACIÓN', CUERPO: 'CONTENCIÓN' }, 'CUERPO'],
    ['R12', { MENTALIDAD: 'ESTABILIZACIÓN', RELACIONES: 'ESTABILIZACIÓN', FINANZAS: 'CONTENCIÓN', CUERPO: 'ESTABILIZACIÓN' }, 'FINANZAS'],
    ['R15', { MENTALIDAD: 'CONSOLIDACIÓN', RELACIONES: 'CONSOLIDACIÓN', FINANZAS: 'CONSOLIDACIÓN', CUERPO: 'CONSOLIDACIÓN' }, 'MENTALIDAD'],
  ]) {
    console.log(`${label} reveal`);
    await openCase(page, label);
    const caseStepper = await predictAndReveal(page, {
      states,
      priority,
      purpose: 'DIFUSO',
      confidence: 'BAJA',
      open: {
        happening: 'Lectura de sesión de laboratorio.',
        concern: 'Registro mínimo para revisar el resultado.',
        focus: 'Ver qué hace la Matriz con este caso.',
        action: 'Revisar el resultado y su explicación.',
      },
    });
    await click(page, 'Guardar mi predicción y ver qué hizo la Matriz');
    await click(page, 'Guardar y ver el resultado', { within: '.lab-modal', wait: 3000 });
    await capture(page, `${label.toLowerCase()}-resultado`);
    if (label === 'R15') {
      await caseStepper.getByRole('button', { name: 'Propósito' }).click();
      await page.waitForTimeout(800);
      await capture(page, 'r15-proposito');
    }
  }

  console.log('narrow desktop pass');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/admin/lab`, { waitUntil: 'networkidle' });
  await capture(page, 'home-1280');
  await openCase(page, 'R01');
  await capture(page, 'r01-1280');

  await writeFile(`${OUT}/report.txt`, problems.length ? problems.join('\n') : 'sin errores de consola ni respuestas >= 400\n');
  console.log(problems.length ? `\n${problems.length} problems:\n${problems.join('\n')}` : '\nno console or network problems');

  await browser.close();
}

main().catch(async (error) => {
  console.error(error);
  await writeFile(`${OUT}/report.txt`, [`FALLO: ${error.message}`, ...problems].join('\n')).catch(() => undefined);
  await browserRef?.close().catch(() => undefined);
  process.exitCode = 1;
});
