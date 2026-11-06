import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const PREVIEW = process.env.E2E_PREVIEW_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';
const configured = Boolean(PREVIEW && PASSWORD);

test.skip(!configured, 'Set E2E_PREVIEW_EMAIL and E2E_PASSWORD for matrix captures');

mkdirSync('tmp/matrix-premium', { recursive: true });

async function enter(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(PREVIEW);
  await page.locator('input[autocomplete="current-password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/panel$/);
}

test('matrix premium captures', async ({ page }) => {
  await enter(page);
  await expect(page.getByRole('heading', { name: 'Tus ámbitos' })).toBeVisible();
  const matrix = page.locator('.mk-mx-matrix');
  await expect(matrix).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await matrix.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tmp/matrix-premium/1440-panel.png' });
  await matrix.screenshot({ path: 'tmp/matrix-premium/1440-matrix.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await matrix.scrollIntoViewIfNeeded();
  await matrix.screenshot({ path: 'tmp/matrix-premium/390-matrix.png' });

  await page.setViewportSize({ width: 320, height: 640 });
  await matrix.scrollIntoViewIfNeeded();
  await matrix.screenshot({ path: 'tmp/matrix-premium/320-matrix.png' });
});
