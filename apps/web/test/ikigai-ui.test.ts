import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  contrastReady,
  contrastScreens,
  COVERAGE_LABELS,
  emptyUiDraft,
  filledCount,
  hypothesesReady,
} from '@/lib/ikigai-ui/format';
import { FIELD_UI, HYPOTHESIS_PLACEHOLDER, REVIEW_LABEL } from '@/lib/ikigai-ui/copy';
import {
  IDEA_BANK,
  IDEA_CATEGORIES,
  ideasForField,
  libraryForField,
} from '@/lib/ikigai-ui/idea-bank';
import type { IkigaiDraft } from '@/lib/ikigai-api';

const empty: IkigaiDraft = {
  ...emptyUiDraft(),
  items: {
    PASION: [
      { id: '1', text: 'abc', evidence: null, order: 0 },
      { id: '2', text: 'def', evidence: null, order: 1 },
    ],
    CAPACIDAD: [],
    NECESIDAD: [],
    VALOR: [],
  },
};

describe('ikigai ui helpers', () => {
  it('counts filled items and hypothesis readiness', () => {
    expect(filledCount(empty.items.PASION)).toBe(2);
    expect(hypothesesReady(empty)).toBe(false);
    expect(hypothesesReady({ ...empty, noHypothesisYet: true })).toBe(true);
    expect(
      hypothesesReady({
        ...empty,
        hypotheses: [
          {
            id: 'h',
            text: 'Una dirección que quiero explorar ahora.',
            itemIds: ['1'],
            criteria: {},
            order: 0,
          },
        ],
      }),
    ).toBe(true);
  });

  it('only requires six criteria on the selected hypothesis', () => {
    const draft: IkigaiDraft = {
      ...empty,
      selectedHypothesisId: 'h',
      hypotheses: [
        {
          id: 'h',
          text: 'Una dirección que quiero explorar ahora.',
          itemIds: ['1'],
          criteria: {
            DISFRUTE_SOSTENIBLE: 4,
            CAPACIDAD_DEMOSTRABLE: 4,
            UTILIDAD_REAL: 4,
            VALOR_ECONOMICO: 4,
            COHERENCIA_MORAL: 4,
          },
          order: 0,
        },
        {
          id: 'h2',
          text: 'Otra dirección escrita con suficientes palabras.',
          itemIds: ['2'],
          criteria: {},
          order: 1,
        },
      ],
    };
    expect(contrastReady(draft)).toBe(false);
    draft.hypotheses[0].criteria.FACTIBILIDAD = null;
    expect(contrastReady(draft)).toBe(true);
  });
});

describe('public copy sources', () => {
  const definitionPath = resolve(process.cwd(), '../../packages/ikigai-engine/definitions/ikigai-v0.1.json');
  const definition = JSON.parse(readFileSync(definitionPath, 'utf8')) as {
    fields: Array<{ key: keyof typeof FIELD_UI; title: string; prompt: string; help: string; placeholder: string }>;
    criteria: Array<{ key: string; text: string; matrixId: string }>;
  };

  it('does not expose the legacy purpose formula', async () => {
    const format = await import('@/lib/ikigai-ui/format');
    expect(format).not.toHaveProperty('purposeFormula');
    expect(HYPOTHESIS_PLACEHOLDER).toBe('Una dirección que quiero explorar es…');
    expect(HYPOTHESIS_PLACEHOLDER).not.toMatch(/Mi propósito/);
    const scanned = [
      'lib/ikigai-ui/copy.ts',
      'lib/ikigai-ui/format.ts',
      'components/ikigai/relate-step.tsx',
      'components/ikigai/field-step.tsx',
      'components/ikigai/result-view.tsx',
      'components/pages/ikigai-content.tsx',
    ].map((file) => readFileSync(resolve(process.cwd(), file), 'utf8'));
    for (const source of scanned) {
      expect(source).not.toMatch(/Mi propósito es/);
      expect(source).not.toMatch(/purposeFormula/);
    }
  });

  it('keeps FIELD_UI as chrome and matches definition titles', () => {
    for (const field of definition.fields) {
      expect(Object.keys(FIELD_UI[field.key]).sort()).toEqual(['adoptQuestion', 'editorLabel', 'writeEmpty']);
      const chrome = Object.values(FIELD_UI[field.key]).join(' ');
      expect(chrome).not.toContain(field.prompt);
      expect(chrome).not.toContain(field.help);
      expect(COVERAGE_LABELS[field.key]).toBe(field.title);
    }
  });

  it('keeps the six criteria without a global score', () => {
    expect(definition.criteria.map((row) => row.matrixId)).toEqual([
      'P-PRO-071',
      'P-PRO-072',
      'P-PRO-073',
      'P-PRO-074',
      'P-PRO-075',
      'P-PRO-076',
    ]);
    const draft: IkigaiDraft = {
      ...empty,
      selectedHypothesisId: 'h',
      hypotheses: [
        {
          id: 'h',
          text: 'Una dirección que quiero explorar ahora.',
          itemIds: ['1'],
          criteria: {
            DISFRUTE_SOSTENIBLE: 4,
            CAPACIDAD_DEMOSTRABLE: 4,
            UTILIDAD_REAL: 4,
            VALOR_ECONOMICO: 4,
            COHERENCIA_MORAL: 4,
            FACTIBILIDAD: 4,
          },
          order: 0,
        },
      ],
    };
    expect(contrastScreens(draft)).toHaveLength(6);
    expect(JSON.stringify(draft)).not.toMatch(/purpose_score/);
  });

  it('tracks player routes needed for staging', () => {
    expect(existsSync(resolve(process.cwd(), 'app/ikigai/empezar/page.tsx'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'app/ikigai/s/[sessionId]/page.tsx'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'app/ikigai/s/[sessionId]/resultado/page.tsx'))).toBe(true);
    expect(existsSync(resolve(process.cwd(), 'app/ikigai/layout.tsx'))).toBe(true);
  });

  it('does not promise Perfil Maestro or a depth index on the IKIGAI landing', () => {
    const landing = readFileSync(resolve(process.cwd(), 'components/pages/ikigai-content.tsx'), 'utf8');
    const seo = readFileSync(resolve(process.cwd(), 'app/(public)/ikigai/page.tsx'), 'utf8');
    expect(landing).not.toMatch(/Perfil Maestro/);
    expect(landing).not.toMatch(/[Íí]ndice de profundidad/);
    expect(seo).not.toMatch(/Perfil Maestro/);
    expect(landing).toContain('Versión en revisión');
    expect(REVIEW_LABEL).toBe('Versión en revisión');
    for (const field of definition.fields) {
      expect(landing).toContain(field.title);
      expect(landing).toContain(field.prompt);
    }
  });
});

describe('ikigai idea library', () => {
  it('recatalogs Excel ideas onto Matrix fields without old column names', () => {
    const labels = IDEA_BANK.map((row) => row.label).join(' ');
    expect(labels).not.toMatch(/Vocación|Misión|Profesión|Project Management|purpose_score/i);
    expect(ideasForField('PASION').some((row) => row.id === 'ensenar')).toBe(true);
    expect(ideasForField('CAPACIDAD').some((row) => row.id === 'ensenar')).toBe(true);
    expect(ideasForField('VALOR').some((row) => row.id === 'ensenar')).toBe(true);
    expect(ideasForField('CAPACIDAD').some((row) => row.id === 'crear-comunidad')).toBe(false);
    expect(ideasForField('NECESIDAD').some((row) => row.id === 'crear-comunidad')).toBe(true);
    expect(libraryForField('PASION').map((g) => g.label)).toContain('Conexión y servicio');
    expect(libraryForField('PASION', 'ensenar').some((g) => g.ideas.some((row) => row.id === 'ensenar'))).toBe(
      true,
    );
  });

  it('keeps every placement on a known category', () => {
    for (const row of IDEA_BANK) {
      expect(row.placements.length).toBeGreaterThan(0);
      for (const placement of row.placements) {
        expect(IDEA_CATEGORIES[placement.field].some((c) => c.id === placement.categoryId)).toBe(true);
      }
    }
  });
});
