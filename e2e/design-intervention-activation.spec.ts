import { expect, test } from '@playwright/test';

const BASE = process.env.MK_BROWSER_WEB ?? 'http://127.0.0.1:3010';
const configured = /@?(127\.0\.0\.1|localhost):3010/.test(BASE);

test.skip(!configured, 'Set MK_BROWSER_WEB to the local audit web (default 127.0.0.1:3010)');

test('diseña: de un cambio sin datos previos a un plan activo con su semana', async ({ page }) => {
  const email = `nav.reg.${Date.now()}@fixtures.mk.invalid`;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('Recorrido2026');
  await page.getByRole('button', { name: /Crear cuenta de fundador/i }).click();
  await page.waitForURL(/\/panel/);

  await page.goto(`${BASE}/disenar?territorio=MENTALIDAD`, { waitUntil: 'networkidle' });
  await page.getByLabel('Quiero…').fill('Ordenar la semana');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL(/paso=2/);
  await page.getByRole('radio', { name: /Sé qué quiero conseguir/ }).check({ force: true });
  await page.getByLabel('¿Qué será distinto al final del ciclo?').fill('Llegar al viernes con lo importante avanzado');
  await page.getByLabel('¿Cómo vas a reconocer que ocurrió?').fill('El viernes hay dos cosas importantes hechas');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL(/paso=3/);
  await page.locator('article').filter({ hasText: 'Proteger un bloque para lo importante' }).getByRole('button', { name: 'Elegir esta estrategia' }).click();
  await page.getByRole('button', { name: 'Continuar con esta estrategia' }).click();
  await page.waitForURL(/paso=4/);
  await page.getByRole('checkbox', { name: 'Por ahora no hay nada que cuidar.' }).check();
  await page.getByRole('checkbox', { name: 'Esto cabe en mi semana' }).check();
  await page.getByRole('button', { name: 'Revisar el plan' }).click();
  await expect(page).toHaveURL(/paso=5/);
  await page.getByRole('checkbox', { name: 'Confirmo que quiero activar este plan.' }).check();
  await page.getByRole('button', { name: 'Activar mi plan' }).click();
  await expect(page.getByRole('heading', { name: 'El plan quedó activo' })).toBeVisible();
});
