import { describe, expect, it } from 'vitest';

/**
 * LAB-025 e2e: simulate R04, change AUD-CUE-01 to Siempre, freeze, reveal, compare.
 * Runs only when LAB_E2E=1 and the local app is available.
 */
describe('LAB-025 simulate other answers e2e', () => {
  it.skipIf(!process.env.LAB_E2E)(
    'creates a simulation from R04, changes AUD-CUE-01, and compares the original',
    async () => {
      const { chromium } = await import('playwright');
      const web = process.env.LAB_WEB_URL ?? 'http://localhost:3000';
      const api = process.env.LAB_API_URL ?? 'http://localhost:4000';
      const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@maximus-kratos.local';
      const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!';
      const browser = await chromium.launch();
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

      await page.goto(`${web}/login`);
      await page.fill('input[autocomplete=email]', email);
      await page.fill('input[autocomplete=current-password]', password);
      await page.click('button[type=submit]');
      await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 });

      const token = await page.evaluate(() => sessionStorage.getItem('mk_access_token'));
      expect(token, 'missing access token').toBeTruthy();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const casesRes = await page.request.get(`${api}/api/v1/admin/lab/cases`, { headers });
      expect(casesRes.ok()).toBe(true);
      const cases = (await casesRes.json()) as Array<{
        id: string;
        casebook_key: string | null;
        latest_run: { id: string; status: string } | null;
      }>;
      const r04 = cases.find((item) => item.casebook_key === 'R04');
      expect(r04?.latest_run?.status).toBe('REVEALED');

      const dup = await page.request.post(`${api}/api/v1/admin/lab/cases/${r04!.id}/duplicate`, {
        headers,
        data: {},
      });
      expect(dup.ok()).toBe(true);
      const created = (await dup.json()) as { run: { id: string } };

      await page.goto(`${web}/admin/lab/runs/${created.run.id}`);
      await page.waitForSelector('.lab-casehead__title', { timeout: 25000 });
      await expect(page.locator('body')).toContainText('Estás en una simulación de');

      const save = await page.request.post(`${api}/api/v1/admin/lab/runs/${created.run.id}/responses/batch`, {
        headers,
        data: {
          responses: [{ question_id: 'AUD-CUE-01', status: 'ANSWERED', raw_value: 5 }],
        },
      });
      expect(save.ok(), await save.text()).toBe(true);

      const freeze = await page.request.post(`${api}/api/v1/admin/lab/runs/${created.run.id}/freeze`, {
        headers,
      });
      expect(freeze.ok(), await freeze.text()).toBe(true);
      const reveal = await page.request.post(`${api}/api/v1/admin/lab/runs/${created.run.id}/reveal`, {
        headers,
      });
      expect(reveal.ok(), await reveal.text()).toBe(true);

      const compare = await page.request.get(
        `${api}/api/v1/admin/lab/runs/${created.run.id}/compare-parent`,
        { headers },
      );
      expect(compare.ok()).toBe(true);
      const payload = (await compare.json()) as {
        available: boolean;
        parent: { label: string };
        changed_questions: Array<{ questionId: string; b_label: string | null }>;
        domains: Record<string, unknown>;
        dimensions: Record<string, { label: string }>;
        plans: { a: string | null; b: string | null };
      };
      expect(payload.available).toBe(true);
      expect(payload.parent.label).toMatch(/R04/);
      expect(payload.changed_questions).toHaveLength(1);
      expect(payload.changed_questions[0]?.questionId).toBe('AUD-CUE-01');
      expect(payload.domains.CUERPO).toBeTruthy();
      expect(Object.values(payload.dimensions).some((row) => /seguridad/i.test(row.label))).toBe(true);
      expect(payload.plans.a).not.toBe(payload.plans.b);

      await page.goto(`${web}/admin/lab/runs/${created.run.id}`);
      await page.waitForSelector('.lab-casehead__title', { timeout: 25000 });
      await page.getByRole('button', { name: /Comparar con R04/ }).click();
      await expect(page.locator('body')).toContainText('Seguridad');
      await expect(page.locator('body')).toContainText('Cuerpo');

      await browser.close();
    },
  );
});
