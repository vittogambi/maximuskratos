import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { mkdirSync } from 'node:fs';

const PREVIEW = process.env.E2E_PREVIEW_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';
const DATABASE_URL = process.env.DATABASE_URL ?? '';
const configured = Boolean(PREVIEW && PASSWORD && /@(localhost|127\.0\.0\.1):/.test(DATABASE_URL));

test.skip(!configured, 'Set E2E_PREVIEW_EMAIL, E2E_PASSWORD and a localhost DATABASE_URL');
mkdirSync('tmp/member-ux-despues', { recursive: true });

test('the stage shows an empty plate, then the server percent after one done task', async ({ page }) => {
  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: PREVIEW } });
    await prisma.user.update({ where: { id: user.id }, data: { onboardingStep: 'PROFILE_COMPLETE' } });
    await prisma.weekReview.deleteMany({ where: { userId: user.id } });
    await prisma.planAction.deleteMany({ where: { domain: { not: null }, plan: { userId: user.id } } });
  } finally {
    await prisma.$disconnect();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(PREVIEW);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/panel$/);
  await expect(page.locator('.mk-plate__value')).toHaveText('—');
  await expect(page.locator('.mk-home__note')).not.toContainText('servidor');
  const cardTitle = await page.locator('.mk-next__title').innerText();
  const action = await page.locator('.mk-next .mk-member-btn').innerText();
  expect(cardTitle.trim()).not.toBe(action.trim());
  await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Ruta' })).toBeVisible();
  await expect(page.locator('.mk-metric[href="/mente"]')).toBeVisible();
  await expect(page.locator('.mk-metric[href="/cuerpo"]')).toBeVisible();
  await page.screenshot({ path: 'tmp/member-ux-despues/1440-inicio.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'tmp/member-ux-despues/390-inicio.png' });
  const homeOverflow = await page.locator('.mk-app-content').evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(homeOverflow).toBeLessThanOrEqual(1);
  const tools = await page.locator('.mk-top-bar__tools').evaluate((el) => {
    const toggle = el.querySelector('.mk-more__toggle')?.getBoundingClientRect();
    const avatar = el.querySelector('.mk-top-bar__avatar')?.getBoundingClientRect();
    if (!toggle || !avatar) return 0;
    return avatar.left - toggle.right;
  });
  expect(tools).toBeGreaterThanOrEqual(8);

  await page.setViewportSize({ width: 485, height: 933 });
  await page.screenshot({ path: 'tmp/member-ux-despues/485-inicio.png' });

  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'tmp/member-ux-despues/375-inicio.png' });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'tmp/member-ux-despues/768-inicio.png' });

  await page.setViewportSize({ width: 1555, height: 636 });
  await page.screenshot({ path: 'tmp/member-ux-despues/1555-inicio.png' });

  await page.setViewportSize({ width: 320, height: 700 });
  await page.screenshot({ path: 'tmp/member-ux-despues/320-inicio.png' });
  await page.locator('.mk-member-btn').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tmp/member-ux-despues/320-inicio-accion.png' });
  await expect(page.locator('.mk-metric')).toHaveCount(3);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('.mk-metric[href="/mente"]').click();
  await page.waitForURL(/\/mente$/);
  await page.getByRole('button', { name: 'Agregar una tarea' }).click();
  await page.getByLabel('Tarea').fill('Leer una página');
  await page.getByLabel('Criterio').fill('La página quedó leída.');
  await page.getByRole('button', { name: 'Guardar tarea' }).click();
  await expect(page.getByText('Leer una página')).toBeVisible();
  await page.getByRole('button', { name: 'Hecho' }).click();
  await expect(page.getByText('Estado: Hecho')).toBeVisible();
  await page.screenshot({ path: 'tmp/member-ux-despues/1440-mente.png' });

  await page.getByRole('link', { name: 'Volver al panel' }).click();
  await expect(page.locator('.mk-plate__value')).not.toHaveText('100%');
  await expect(page.locator('.mk-metric[href="/mente"] .mk-metric__value')).not.toHaveText('100%');
  await page.screenshot({ path: 'tmp/member-ux-despues/1440-inicio-con-tarea.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'tmp/member-ux-despues/390-inicio-con-tarea.png' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/calendario');
  await expect(page.getByRole('heading', { name: 'Leer una página' })).toBeVisible();
  await expect(page.locator('.mk-task__pillar', { hasText: 'Mente' })).toBeVisible();
  const boxes = await page.locator('.mk-week__day').evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
  );
  expect(boxes).toHaveLength(7);
  expect(new Set(boxes).size).toBe(1);
  await page.locator('.mk-week__day').nth(3).click();
  const after = await page.locator('.mk-week__day').evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
  );
  expect(after).toEqual(boxes);
  const heights = await page.locator('.mk-week__day').evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
  );
  expect(new Set(heights).size).toBe(1);
  await page.screenshot({ path: 'tmp/member-ux-despues/1440-calendario.png' });

  await page.setViewportSize({ width: 320, height: 700 });
  const narrow = await page.locator('.mk-week__day').evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
  );
  expect(narrow).toHaveLength(7);
  expect(new Set(narrow).size).toBe(1);
  await page.locator('.mk-week__day').nth(1).click();
  const narrowAfter = await page.locator('.mk-week__day').evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
  );
  expect(narrowAfter).toEqual(narrow);
  const calOverflow = await page.locator('.mk-app-content').evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(calOverflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'tmp/member-ux-despues/320-calendario.png' });
});

async function enter(page: import('@playwright/test').Page) {
  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
  try {
    await prisma.user.update({ where: { email: PREVIEW }, data: { onboardingStep: 'PROFILE_COMPLETE' } });
  } finally {
    await prisma.$disconnect();
  }
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(PREVIEW);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/panel$/);
}

test('mobile keeps secondary routes and a failed save keeps the draft', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await page.getByRole('button', { name: 'Más', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Otras secciones' }).getByRole('link', { name: 'Propósito' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Otras secciones' }).getByRole('link', { name: 'Cuenta' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Otras secciones' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Más', exact: true })).toBeFocused();

  await page.goto('/mente');
  await page.getByRole('button', { name: 'Agregar una tarea' }).click();
  const title = 'Nota larga que tiene que seguir escrita si el guardado falla en el teléfono.';
  const criterion = 'El criterio también se conserva.';
  await page.getByLabel('Tarea').fill(title);
  await page.getByLabel('Criterio').fill(criterion);
  await page.route('**/journey/domains/**/actions', (route) => route.abort());
  await page.getByRole('button', { name: 'Guardar tarea' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('Tarea')).toHaveValue(title);
  await expect(page.getByLabel('Criterio')).toHaveValue(criterion);
  const overflow = await page.locator('.mk-app-content').evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('reduced motion still shows the stage and the next action', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await enter(page);
    await expect(page.locator('.mk-scene__statue')).toBeVisible();
    await expect(page.locator('.mk-plate__value')).toHaveText('—');
    await expect(page.locator('.mk-member-btn')).toBeVisible();
  } finally {
    await context.close();
  }
});
