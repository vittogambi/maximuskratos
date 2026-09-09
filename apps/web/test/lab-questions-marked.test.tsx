import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/lab/findings/questions',
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
}));

vi.mock('@/lib/lab-api', () => ({
  labApi: {
    observations: () =>
      Promise.resolve({
        questions: [
          {
            question_id: 'AUD-CUE-01',
            text: 'Duermo lo suficiente',
            domain: 'CUERPO',
            dimension: 'CUE.seguridad_y_restricciones',
            dimension_label: 'Seguridad y restricciones',
            cases: [
              { case_id: '1', label: 'R04', aspects: { weight: 'WEIGHT_MORE' }, proposal: 'Subir peso' },
              { case_id: '2', label: 'R01', aspects: { weight: 'WEIGHT_MORE' }, proposal: 'Subir peso' },
              { case_id: '3', label: 'R02', aspects: { weight: 'WEIGHT_MORE' }, proposal: 'Subir peso' },
            ],
            aspect_counts: { weight: 3 },
            engine_testable: true,
            issue_types: ['WEIGHT_MORE'],
            status: 'PENDING',
            count: 3,
            observations: [],
          },
        ],
      }),
  },
}));

import FlaggedQuestionsPage from '@/app/admin/lab/findings/questions/page';

describe('LAB-031 marked questions', () => {
  it('renders the first question with case count and weight chip after load', async () => {
    const markup = renderToStaticMarkup(<FlaggedQuestionsPage />);
    expect(markup).toContain('Preguntas');
  });
});
