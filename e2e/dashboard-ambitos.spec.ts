import { expect, test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { mkdirSync } from 'node:fs';

const PREVIEW = process.env.E2E_PREVIEW_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';
const DATABASE_URL = process.env.DATABASE_URL ?? '';
const configured = Boolean(PREVIEW && PASSWORD && /@(localhost|127\.0\.0\.1):/.test(DATABASE_URL));

test.skip(!configured, 'Set E2E_PREVIEW_EMAIL, E2E_PASSWORD and a localhost DATABASE_URL');
mkdirSync('tmp/member-ux-despues', { recursive: true });

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

test('member home shows territories and week nav', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enter(page);
  await expect(page.getByRole('heading', { name: /Tu mapa|¿Cómo quieres empezar?/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ámbitos' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Semana' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Memoria' })).toBeVisible();
  await page.screenshot({ path: 'tmp/member-ux-despues/1440-inicio.png' });

  await page.getByRole('link', { name: 'Semana' }).first().click();
  await page.waitForURL(/\/semana$/);
  await page.screenshot({ path: 'tmp/member-ux-despues/1440-calendario.png' });
});

test('legacy calendario redirects to semana', async ({ page }) => {
  await enter(page);
  await page.goto('/calendario');
  await page.waitForURL(/\/semana$/);
});

test('mobile more menu exposes diseñar and cuenta', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await page.getByRole('button', { name: 'Más', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Otras secciones' }).getByRole('link', { name: 'Diseñar' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Otras secciones' }).getByRole('link', { name: 'Cuenta' })).toBeVisible();
  await page.keyboard.press('Escape');
});
