import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LAB_PRIMARY_BANNED } from '@/lib/lab-ui/primary-ban';

const PRIMARY_FILES = [
  'apps/web/components/admin/lab/lab-nav.tsx',
  'apps/web/components/admin/lab/step-case.tsx',
  'apps/web/components/admin/lab/step-prediction.tsx',
  'apps/web/components/admin/lab/step-result.tsx',
  'apps/web/components/admin/lab/step-review.tsx',
  'apps/web/components/admin/lab/step-verdict.tsx',
  'apps/web/components/admin/lab/step-purpose.tsx',
  'apps/web/components/admin/lab/why-tree.tsx',
  'apps/web/components/admin/lab/step-experience.tsx',
  'apps/web/app/admin/lab/readiness/page.tsx',
];

describe('primary Lab UI ban list', () => {
  it('shows reviewed questions instead of zero pending', () => {
    const source = readFileSync(new URL('../../../apps/web/app/admin/lab/readiness/page.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('de 187');
    expect(source).not.toContain('Preguntas pendientes');
    expect(source).toContain('Todavía faltan revisiones antes de poder marcar la Matriz como lista.');
  });

  it('keeps banned strings out of primary screens', () => {
    for (const file of PRIMARY_FILES) {
      const source = readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8');
      const withoutTech = source.replace(/<Tech[\s\S]*?<\/Tech>/g, '');
      for (const banned of LAB_PRIMARY_BANNED) {
        expect(withoutTech, `${file} contains ${banned}`).not.toContain(`'${banned}'`);
        expect(withoutTech, `${file} contains ${banned}`).not.toContain(`"${banned}"`);
        expect(withoutTech, `${file} contains ${banned}`).not.toContain(`>${banned}<`);
      }
    }
  });
});
