import { describe, expect, it } from 'vitest';

/**
 * LAB-010 e2e: 19 runs × 9 steps, fail if the unsaved-changes modal appears.
 * Runs only when LAB_E2E=1 and the local app is available.
 */
const STEPS = ['Caso', 'Tu lectura', 'Resultado'] as const;

describe('LAB-010 dirty-state e2e', () => {
  it.skipIf(!process.env.LAB_E2E)(
    'does not warn when leaving any reachable step without edits',
    async () => {
      const { chromium } = await import('playwright');
      const web = process.env.LAB_WEB_URL ?? 'http://localhost:3000';
      const api = process.env.LAB_API_URL ?? 'http://localhost:4000';
      const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@maximus-kratos.local';
      const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!';
      const browser = await chromium.launch();
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const leaks: string[] = [];

      await page.goto(`${web}/login`);
      await page.fill('input[autocomplete=email]', email);
      await page.fill('input[autocomplete=current-password]', password);
      await page.click('button[type=submit]');
      await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });

      const token = await page.evaluate(() => sessionStorage.getItem('mk_access_token'));
      expect(token, 'missing access token').toBeTruthy();
      const casesRes = await page.request.get(`${api}/api/v1/admin/lab/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(casesRes.ok(), `cases ${casesRes.status()}`).toBe(true);
      const cases = (await casesRes.json()) as Array<{ latest_run?: { id: string } | null }>;
      const runIds = cases.map((item) => item.latest_run?.id).filter(Boolean) as string[];
      expect(runIds.length).toBe(19);

      for (const runId of runIds) {
        await page.goto(`${web}/admin/lab/runs/${runId}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.lab-casehead__title', { timeout: 25000 });
        await page.waitForSelector('.lab[data-lab-dirty]', { timeout: 5000 });
        await page.waitForTimeout(400);
        for (const label of STEPS) {
          const step = page.locator('button.lab-step', { hasText: label }).first();
          if (!(await step.count())) continue;
          const state = await step.getAttribute('class');
          if (state?.includes('is-locked')) continue;
          await step.click({ timeout: 3000 }).catch(() => undefined);
          await page.waitForTimeout(400);
          const lock = page.locator('.lab-modal__title', { hasText: 'todavía no está disponible' });
          if (await lock.count()) {
            await page.locator('button', { hasText: 'Entendido' }).click().catch(() => undefined);
            continue;
          }
          const dirtyModal = page.locator('.lab-modal__title', { hasText: 'Tienes cambios sin guardar' });
          if (await dirtyModal.count()) {
            leaks.push(`${runId} ${label} on-step`);
            await page.locator('button', { hasText: 'Seguir editando' }).click().catch(() => undefined);
            continue;
          }
          const dirty = await page.locator('.lab').getAttribute('data-lab-dirty');
          if (dirty?.endsWith(':true')) {
            leaks.push(`${runId} ${label} ${dirty}`);
          }
        }
        await page.locator('button.lab-back').click();
        await page.waitForTimeout(400);
        const leaveModal = page.locator('.lab-modal__title', { hasText: 'Tienes cambios sin guardar' });
        if (await leaveModal.count()) {
          leaks.push(`${runId} leave`);
          await page.locator('button', { hasText: 'Salir sin guardar' }).click().catch(() => undefined);
        }
        await page.waitForTimeout(2500);
      }

      await browser.close();
      expect(leaks).toEqual([]);
    },
    300_000,
  );
});
