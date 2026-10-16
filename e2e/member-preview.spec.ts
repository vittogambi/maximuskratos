import { expect, test, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { mkdirSync } from 'node:fs';

/**
 * Private review access over the FASE1 prototype, end to end in the browser.
 * Needs the local API started with MEMBER_PREVIEW_USER_IDS containing the
 * preview account, and these env vars: E2E_PREVIEW_EMAIL, E2E_NORMAL_EMAIL,
 * E2E_PASSWORD, DATABASE_URL (local only: the preview diagnostic is reset).
 * Leave a minute between runs: the API allows 100 requests per route per minute
 * per IP, and `next dev` doubles effect requests.
 */

const PREVIEW = process.env.E2E_PREVIEW_EMAIL ?? '';
const NORMAL = process.env.E2E_NORMAL_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';
const DATABASE_URL = process.env.DATABASE_URL ?? '';
const API = 'http://localhost:4000/api/v1';
const SHOT_DIR = 'tmp/entrega0-qa';
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
const OPTION = '.dk-scale-option, .dk-choice-option, .dk-archetype-card';

const configured = Boolean(PREVIEW && NORMAL && PASSWORD && /@(localhost|127\.0\.0\.1):/.test(DATABASE_URL));

test.describe.configure({ mode: 'serial' });
test.skip(!configured, 'Set E2E_PREVIEW_EMAIL, E2E_NORMAL_EMAIL, E2E_PASSWORD and a localhost DATABASE_URL');

mkdirSync(SHOT_DIR, { recursive: true });

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
}

async function accessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => sessionStorage.getItem('mk_access_token'));
  if (!token) throw new Error('no access token in sessionStorage');
  return token;
}

function counter(page: Page) {
  return page.locator('.dk-rail-counter');
}

/** Answers the server holds for this account, and the percentage it reports. */
async function serverProgress(page: Page) {
  const res = await page.request.get(`${API}/diagnostic/progress`, {
    headers: { Authorization: `Bearer ${await accessToken(page)}` },
  });
  const progress = await res.json();
  const answered = progress.modules.reduce(
    (sum: number, m: { answeredQuestions: number }) => sum + m.answeredQuestions,
    0,
  );
  return { answered, pct: `${Math.round(progress.completionPct)}%` };
}

test.beforeAll(async () => {
  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: PREVIEW } });
    await prisma.diagnosticSession.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({ where: { id: user.id }, data: { onboardingStep: 'TERMS_PENDING' } });
  } finally {
    await prisma.$disconnect();
  }
});

test('a normal account enters the questionnaire', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await login(page, NORMAL);
  await expect(page.getByText('Acceso anticipado.')).toHaveCount(0);

  const token = await accessToken(page);
  for (const headers of [{}, { 'X-MK-Client': 'ios' }]) {
    const res = await page.request.post(`${API}/diagnostic/start`, {
      headers: { Authorization: `Bearer ${token}`, ...headers },
      data: {},
    });
    expect(res.status()).not.toBe(403);
  }
});

test('reviewer: starts, answers with keyboard, saves and exits, resumes after reload', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await login(page, PREVIEW);
  await expect(page).toHaveURL(/\/diagnostico\/bienvenida$/, { timeout: 30_000 });
  await expect(page.getByText('Versión privada de revisión')).toBeVisible();
  await shot(page, '390-welcome');

  await page.getByRole('button', { name: 'Comenzar diagnóstico' }).click();
  await page.getByRole('button', { name: 'Comenzar', exact: true }).click();
  await expect(page.locator('.dk-question-text')).toBeVisible();

  const continueBtn = page.getByRole('button', { name: 'Continuar', exact: true });
  await expect(continueBtn).toBeDisabled();
  await expect(page.locator('#dk-continue-hint')).toHaveText(/para continuar\.$/);
  await expect(continueBtn).toHaveAttribute('aria-describedby', 'dk-continue-hint');
  await shot(page, '390-question-disabled-hint');

  // Keyboard only: Tab to an option, select it, Tab to Continuar, submit.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const onOption = await page.evaluate(() =>
      Boolean(document.activeElement?.matches('.dk-scale-option, .dk-choice-option')),
    );
    if (onOption) break;
  }
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(page.locator('#dk-continue-hint')).toHaveCount(0);
  await shot(page, '390-question-keyboard-focus');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const onContinue = await page.evaluate(() => document.activeElement?.textContent?.includes('Continuar'));
    if (onContinue) break;
  }
  await page.keyboard.press('Enter');
  await expect(counter(page)).toHaveText(/^2 de \d+$/);

  // A valid pending selection is saved before leaving.
  await page.locator(OPTION).nth(2).click();
  await page.getByRole('button', { name: 'Guardar y salir' }).click();
  await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  await expect(page.locator('.mk-metric[href="/mente"]')).toBeVisible();
  const afterExit = await serverProgress(page);
  expect(afterExit.answered).toBe(2);
  await shot(page, '390-panel-after-save-exit');

  await page.goto('/diagnostico');
  await expect(counter(page)).toHaveText(/^3 de \d+$/, { timeout: 20_000 });
  await page.reload();
  await expect(counter(page)).toHaveText(/^3 de \d+$/, { timeout: 20_000 });
});

test('failed save keeps the selection and the screen; retry saves and exits', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await login(page, PREVIEW);
  await expect(counter(page)).toHaveText(/^3 de \d+$/, { timeout: 30_000 });

  await page.route('**/api/v1/diagnostic/response', (route) => route.abort('internetdisconnected'));
  const chosen = page.locator(OPTION).nth(1);
  await chosen.click();
  await page.getByRole('button', { name: 'Guardar y salir' }).click();

  await expect(page.locator('.dk-player-error[role="alert"]')).toContainText('No pudimos guardar tu respuesta');
  await expect(page).toHaveURL(/\/diagnostico\/modulo\/.+\/pregunta$/);
  await expect(chosen).toHaveClass(/--selected/);
  await expect(counter(page)).toHaveText(/^3 de \d+$/);
  expect((await serverProgress(page)).answered).toBe(2);
  await shot(page, '390-save-error-selection-kept');

  await page.unroute('**/api/v1/diagnostic/response');
  await page.getByRole('button', { name: 'Guardar y salir' }).click();
  await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  const afterRetry = await serverProgress(page);
  expect(afterRetry.answered).toBe(3);
  await expect(page.locator('.mk-metric[href="/mente"]')).toBeVisible();
});

test('another browser resumes at the same point, then completes and sees the served profile', async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ viewport: DESKTOP, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await login(page, PREVIEW);
  await expect(counter(page)).toHaveText(/^4 de \d+$/, { timeout: 30_000 });

  const token = await accessToken(page);
  const stateRes = await page.request.get(`${API}/diagnostic/state`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const state = await stateRes.json();
  await expect(page.locator('.dk-question-text')).toHaveText(state.nextStep.data.textEs);
  await shot(page, '1440-other-browser-resume');

  // State-driven walk: every action is bounded and the loop re-reads the screen.
  // Any retry is reported with the recent API trail and fails the test: an action
  // that did not work the first time is a defect the person would also hit.
  const done = () => /\/(diagnostico\/resultado|perfil)$/.test(new URL(page.url()).pathname);
  const question = page.locator('.dk-question-text');
  const retried: string[] = [];
  const trail: string[] = [];
  const t0 = Date.now();
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/diagnostic')) trail.push(`${Date.now() - t0}ms ${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`);
  });
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) trail.push(`${Date.now() - t0}ms nav ${new URL(f.url()).pathname}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') trail.push(`${Date.now() - t0}ms console.error ${m.text().slice(0, 140)}`);
  });
  for (let step = 0; step < 200 && !done(); step++) {
    try {
      if (page.url().includes('/diagnostico/outro/')) {
        await page.getByRole('button', { name: 'Continuar', exact: true }).click({ timeout: 10_000 });
        await page.waitForURL((u) => !u.pathname.includes('/diagnostico/outro/'), { timeout: 20_000 });
        continue;
      }
      const start = page.getByRole('button', { name: 'Comenzar', exact: true });
      if (await start.isVisible()) {
        await start.click({ timeout: 10_000 });
        // The intro unmounts after the click; wait for it instead of clicking it twice.
        await question.waitFor({ state: 'visible', timeout: 10_000 });
        continue;
      }
      if (await question.isVisible()) {
        const text = (await question.allTextContents())[0] ?? null;
        const options = page.locator(OPTION);
        if ((await options.count()) > 0) {
          await options.nth(Math.min(2, (await options.count()) - 1)).click({ timeout: 10_000 });
        } else {
          await page.locator('textarea').first().fill('Texto de revisión local.');
        }
        await page.getByRole('button', { name: 'Continuar', exact: true }).click({ timeout: 10_000 });
        await expect
          .poll(async () => done() || page.url().includes('/diagnostico/outro/') || (await question.allTextContents())[0] !== text, {
            timeout: 20_000,
          })
          .toBe(true);
        continue;
      }
    } catch (err) {
      // Screen changed under the action; read it again.
      retried.push(
        `${new URL(page.url()).pathname}: ${String(err).split('\n')[0]}\n    ${trail.slice(-10).join('\n    ')}`,
      );
    }
    await page.waitForTimeout(250);
  }
  expect(retried, retried.join('\n')).toEqual([]);
  await expect(page).toHaveURL(/\/(diagnostico\/resultado|perfil)$/, { timeout: 30_000 });

  const profileRes = await page.request.get(`${API}/diagnostic/profile`, {
    headers: { Authorization: `Bearer ${await accessToken(page)}` },
  });
  const profile = await profileRes.json();
  await expect(page.locator('.sys-header__title')).toBeVisible({ timeout: 20_000 });
  const values = page.locator('.sys-index__value');
  if (typeof profile.indices.auditTotal === 'number') {
    await expect(values.nth(0)).toHaveText(String(profile.indices.auditTotal), { timeout: 15_000 });
    await expect(page.getByText('Mente. Lectura pendiente.')).toBeVisible();
  } else {
    const general = Math.round(profile.indices.mk_global ?? 0);
    const clarity = Math.round(profile.indices.clarity ?? 0);
    await expect(values.nth(0)).toHaveText(String(general), { timeout: 15_000 });
    await expect(values.nth(1)).toHaveText(String(clarity), { timeout: 15_000 });
    await expect(page.locator('.sys-index__label').nth(0)).toHaveText('Promedio general');
    await expect(page.getByText('Todavía no son los índices de Alineación y Profundidad')).toBeVisible();
  }
  await expect(page.getByText('Versión privada de revisión')).toBeVisible();
  await shot(page, '1440-profile');

  await page.setViewportSize(MOBILE);
  await shot(page, '390-profile');
  await page.setViewportSize({ width: 768, height: 1024 });
  await shot(page, '768-profile');

  await page.setViewportSize(DESKTOP);
  await page.goto('/panel');
  await expect(page.locator('.mk-metric[href="/mente"]')).toBeVisible();
  await shot(page, '1440-panel-profile');
  await context.close();
});
