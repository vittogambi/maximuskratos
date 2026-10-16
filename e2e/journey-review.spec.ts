import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const PREVIEW = process.env.E2E_PREVIEW_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';
const configured = Boolean(PREVIEW && PASSWORD);

test.skip(!configured, 'Set E2E_PREVIEW_EMAIL and E2E_PASSWORD');
mkdirSync('tmp/recorrido-qa', { recursive: true });

test('review account sees one next step and the closed week', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(PREVIEW);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/panel$/);
  await expect(page.locator('.mk-metric[href="/mente"]')).toBeVisible();
  await page.screenshot({ path: 'tmp/recorrido-qa/1440-inicio.png', fullPage: true });

  await page.goto('/ruta');
  await expect(page.getByText('Fichas de esta cuenta')).toBeVisible();
  await page.screenshot({ path: 'tmp/recorrido-qa/1440-ruta.png', fullPage: true });

  await page.goto('/calendario');
  await expect(page.getByText('America/Santiago')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Esta semana ya está cerrada' })).toBeDisabled();
  await page.screenshot({ path: 'tmp/recorrido-qa/1440-calendario.png', fullPage: true });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: 'tmp/recorrido-qa/768-calendario.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/panel');
  await expect(page.locator('.mk-metric[href="/mente"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ruta', exact: true })).toBeVisible();
  await page.screenshot({ path: 'tmp/recorrido-qa/390-inicio.png', fullPage: true });
});
