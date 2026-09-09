import type { MatrixDefinition } from '../types';
import { firstScoreableIds, likertForK } from './materialize';
import type { FixtureFamily } from './types';

function mentalidadK(
  definition: MatrixDefinition,
  k: number,
): Record<string, number> {
  const items = definition.questions.filter(
    (question) => question.domain === 'MENTALIDAD' && question.active && question.scoreable,
  );
  const values = likertForK(items.length, k);
  const bag: Record<string, number> = {};
  items.forEach((question, index) => {
    bag[question.id] = values[index] ?? 1;
  });
  return bag;
}

function customAnswered(
  definition: MatrixDefinition,
  domains: Record<string, number>,
  extra: string[] = [],
): { ids: string[]; values: Record<string, number> } {
  const values: Record<string, number> = {};
  const ids: string[] = [...extra];
  for (const [domain, count] of Object.entries(domains)) {
    for (const id of firstScoreableIds(definition, domain, count)) {
      values[id] = 4;
      ids.push(id);
    }
  }
  return { ids: [...new Set(ids)], values };
}

export function fixtureCatalog(definition: MatrixDefinition): FixtureFamily[] {
  const menK37 = mentalidadK(definition, 37);
  const menK38 = mentalidadK(definition, 38);
  const menK57 = mentalidadK(definition, 57);
  const menK58 = mentalidadK(definition, 58);
  const menK76 = mentalidadK(definition, 76);
  const menK77 = mentalidadK(definition, 77);

  const cover59 = customAnswered(definition, { MENTALIDAD: 14 }, [
    'D-CUE-01', 'D-CUE-02', 'D-CUE-03', 'D-CUE-04', 'D-CUE-05',
    'D-REL-15', 'D-FIN-09', 'D-CUE-25',
  ]);
  const cover60 = customAnswered(definition, { MENTALIDAD: 15 }, [
    'D-CUE-01', 'D-CUE-02', 'D-CUE-03', 'D-CUE-04', 'D-CUE-05',
    'D-REL-15', 'D-FIN-09', 'D-CUE-25',
  ]);
  const cover79 = customAnswered(definition, { MENTALIDAD: 19 }, [
    'D-CUE-01', 'D-CUE-02', 'D-CUE-03', 'D-CUE-04', 'D-CUE-05',
    'D-REL-15', 'D-FIN-09', 'D-CUE-25',
  ]);
  const cover80 = customAnswered(definition, { MENTALIDAD: 20 }, [
    'D-CUE-01', 'D-CUE-02', 'D-CUE-03', 'D-CUE-04', 'D-CUE-05',
    'D-REL-15', 'D-FIN-09', 'D-CUE-25',
  ]);

  const lowAll = customAnswered(
    definition,
    { MENTALIDAD: 12, RELACIONES: 11, FINANZAS: 11, CUERPO: 10 },
    ['D-CUE-01', 'D-CUE-02', 'D-CUE-03', 'D-CUE-04', 'D-CUE-05', 'D-REL-15', 'D-FIN-09', 'D-CUE-25'],
  );

  const cue30 = customAnswered(definition, { CUERPO: 6 }, ['D-CUE-05']);
  const fin40 = customAnswered(definition, { FINANZAS: 9 }, ['D-FIN-09']);
  const cue40 = customAnswered(definition, { CUERPO: 8 }, ['D-CUE-03']);

  const focoIds = definition.questions
    .filter((question) => question.dimension === 'MEN.foco_y_ejecucion' && question.scoreable)
    .map((question) => question.id);

  return [
    {
      key: 'F01_ALL_MAX',
      purpose: 'techo: todo 100, EXPANSIÓN en los cuatro, sin alertas',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'all max safe',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 5 },
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: ['INV-02', 'INV-20', 'INV-33'],
        golden: true,
      }],
    },
    {
      key: 'F02_ALL_MIN_SAFE',
      purpose: 'piso: todo 0, CONTENCIÓN en los cuatro, sin alertas',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'all min safe',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 1 },
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: ['INV-02', 'INV-20'],
        golden: true,
      }],
    },
    {
      key: 'F03_ALL_MID',
      purpose: '3 en todo, 50, ESTABILIZACIÓN',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'all mid',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 3 },
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: ['INV-20'],
        golden: true,
      }],
    },
    {
      key: 'F04_CRITICAL_HIGH_SCORE',
      purpose: 'D-CUE-05 en Sí con todo lo demás en 5',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'critical not diluted',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 5 },
        risk_answers: 'SAFE',
        overrides: { 'D-CUE-05': 1 },
        narrative: 'EMPTY',
        expected_invariants: ['INV-03', 'INV-32', 'INV-30'],
        golden: true,
      }],
    },
    {
      key: 'F05_HIGH_ALERT_CAP',
      purpose: 'D-FIN-09 en 1 con FINANZAS alto: techo ESTABILIZACIÓN',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'alta cap',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 5 },
        risk_answers: {
          'D-CUE-01': 0,
          'D-CUE-02': 0,
          'D-CUE-03': 0,
          'D-CUE-04': 0,
          'D-CUE-05': 0,
          'D-REL-15': { value: 5, qualitativeConfirmed: false },
          'D-FIN-09': { value: 1, qualitativeConfirmed: true },
          'D-CUE-25': { value: 5, qualitativeConfirmed: false },
        },
        narrative: 'EMPTY',
        expected_invariants: ['INV-18'],
        golden: true,
      }],
    },
    {
      key: 'F06_MEDIA_NO_OVERRIDE',
      purpose: 'D-CUE-03 en Sí: alerta registrada, sin override',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'media no override',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 5 },
        risk_answers: 'SAFE',
        overrides: { 'D-CUE-03': 1 },
        narrative: 'EMPTY',
        expected_invariants: ['INV-19'],
        golden: true,
      }],
    },
    {
      key: 'F07_ALERT_UNCLASSIFIED',
      purpose: 'CRÍTICA con cobertura ~30%: estado forzado, score nulo',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'critical unclassified',
        policy_id: 'CUSTOM',
        custom_ids: cue30.ids,
        answers: { pattern: 'EXPLICIT', values: { ...cue30.values, 'D-CUE-05': 1 } },
        risk_answers: { 'D-CUE-05': 1 },
        narrative: 'EMPTY',
        expected_invariants: ['INV-08'],
        golden: true,
      }],
    },
    {
      key: 'F08_LOW_COVERAGE',
      purpose: '50% en los cuatro: NO_CLASIFICADO, sin prioridad',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'low coverage',
        policy_id: 'CUSTOM',
        custom_ids: lowAll.ids,
        answers: { pattern: 'EXPLICIT', values: lowAll.values },
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: ['INV-08'],
        golden: true,
      }],
    },
    {
      key: 'F09_COVERAGE_59_VS_60',
      purpose: 'par en el borde del 60%',
      golden: true,
      cases: [
        {
          id: 'below',
          purpose: '14/24 no clasifica',
          policy_id: 'CUSTOM',
          custom_ids: cover59.ids,
          answers: { pattern: 'EXPLICIT', values: cover59.values },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-08'],
          golden: true,
        },
        {
          id: 'at',
          purpose: '15/24 provisional',
          policy_id: 'CUSTOM',
          custom_ids: cover60.ids,
          answers: { pattern: 'EXPLICIT', values: cover60.values },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: true,
        },
      ],
    },
    {
      key: 'F10_COVERAGE_79_VS_80',
      purpose: 'par en el borde del 80%',
      golden: true,
      cases: [
        {
          id: 'provisional',
          purpose: '19/24 provisional',
          policy_id: 'CUSTOM',
          custom_ids: cover79.ids,
          answers: { pattern: 'EXPLICIT', values: cover79.values },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: true,
        },
        {
          id: 'interpretable',
          purpose: '20/24 interpretable',
          policy_id: 'CUSTOM',
          custom_ids: cover80.ids,
          answers: { pattern: 'EXPLICIT', values: cover80.values },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: true,
        },
      ],
    },
    {
      key: 'F11_BOUNDARY_39_40',
      purpose: 'MENTALIDAD K=37 y K=38',
      golden: true,
      cases: [
        {
          id: 'k37',
          purpose: 'K 37 → 39 CONTENCIÓN',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 5 },
          overrides: menK37,
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-20'],
          golden: true,
        },
        {
          id: 'k38',
          purpose: 'K 38 → 40 ESTABILIZACIÓN',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 5 },
          overrides: menK38,
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-20'],
          golden: true,
        },
      ],
    },
    {
      key: 'F12_BOUNDARY_59_60',
      purpose: 'MENTALIDAD K=57 y K=58',
      golden: true,
      cases: [
        {
          id: 'k57',
          purpose: 'K 57 → 59',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 5 },
          overrides: menK57,
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: true,
        },
        {
          id: 'k58',
          purpose: 'K 58 → 60',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 5 },
          overrides: menK58,
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: true,
        },
      ],
    },
    {
      key: 'F13_BOUNDARY_79_80',
      purpose: 'MENTALIDAD K=76 y K=77',
      golden: true,
      cases: [
        {
          id: 'k76',
          purpose: 'K 76 → 79',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 5 },
          overrides: menK76,
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: true,
        },
        {
          id: 'k77',
          purpose: 'K 77 → 80',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 5 },
          overrides: menK77,
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: true,
        },
      ],
    },
    {
      key: 'F14_INVERSE',
      purpose: 'INTERFERENCIA 1 vs 5 no contamina INTEGRACIÓN',
      golden: true,
      cases: [
        {
          id: 'low',
          purpose: 'interferencia 1',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 3 },
          overrides: {
            'P-PRO-026': 1, 'P-PRO-027': 1, 'P-PRO-028': 1, 'P-PRO-029': 1, 'P-PRO-030': 1,
          },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-06', 'INV-20'],
          golden: true,
        },
        {
          id: 'high',
          purpose: 'interferencia 5',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 3 },
          overrides: {
            'P-PRO-026': 5, 'P-PRO-027': 5, 'P-PRO-028': 5, 'P-PRO-029': 5, 'P-PRO-030': 5,
          },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-06', 'INV-20'],
          golden: true,
        },
      ],
    },
    {
      key: 'F15_MISSING_NOT_ZERO',
      purpose: '3 de 6 altas: score alto, no penalizado',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'missing not zero',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 5 },
        overrides: Object.fromEntries(
          focoIds.slice(3).map((id) => [id, null]),
        ),
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: ['INV-04'],
        golden: true,
      }],
    },
    {
      key: 'F16_UNSCOREABLE_SLEEP',
      purpose: 'D-CUE-07 respondida: fuera de score y cobertura',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'sleep hours',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 4 },
        overrides: { 'D-CUE-07': 7.5 },
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: ['INV-05'],
        golden: true,
      }],
    },
    {
      key: 'F17_RISK_NOT_EVALUATED',
      purpose: 'riesgos sin responder: safety_incomplete',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'risks unanswered',
        policy_id: 'CUSTOM',
        custom_ids: firstScoreableIds(definition, 'MENTALIDAD', 24),
        answers: { pattern: 'BY_DOMAIN', values: { MENTALIDAD: 4 } },
        risk_answers: {},
        narrative: 'EMPTY',
        expected_invariants: ['INV-14'],
        golden: true,
      }],
    },
    {
      key: 'F18_SINGLE_ITEM_DIMENSION',
      purpose: 'AUD-CUE-01=1 y resto CUERPO=4',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'single item dim',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 4 },
        overrides: { 'AUD-CUE-01': 1 },
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: ['INV-20'],
        golden: true,
      }],
    },
    {
      key: 'F19_SAME_SCORE_DIFFERENT_CAUSE',
      purpose: 'mismo score de ámbito, dimensiones opuestas',
      golden: false,
      cases: [
        {
          id: 'concentrated',
          purpose: 'una dimensión en 1, resto en 5',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 5 },
          overrides: Object.fromEntries(
            definition.questions
              .filter((q) => q.dimension === 'MEN.direccion_e_identidad' && q.scoreable)
              .map((q) => [q.id, 1]),
          ),
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-20'],
          golden: false,
        },
        {
          id: 'even',
          purpose: 'todas las dimensiones iguales al score del otro',
          policy_id: 'FULL-v1',
          answers: { pattern: 'BY_DOMAIN', values: { MENTALIDAD: 4, RELACIONES: 5, FINANZAS: 5, CUERPO: 5 } },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-20'],
          golden: false,
        },
      ],
    },
    {
      key: 'F20_SAME_PRIORITY_DIFFERENT_CONTEXT',
      purpose: 'misma prioridad, perfiles distintos',
      golden: false,
      cases: [
        {
          id: 'a',
          purpose: 'MEN bajo, resto alto',
          policy_id: 'FULL-v1',
          answers: { pattern: 'BY_DOMAIN', values: { MENTALIDAD: 2, RELACIONES: 4, FINANZAS: 4, CUERPO: 4 } },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: false,
        },
        {
          id: 'b',
          purpose: 'MEN bajo, resto medio',
          policy_id: 'FULL-v1',
          answers: { pattern: 'BY_DOMAIN', values: { MENTALIDAD: 2, RELACIONES: 3, FINANZAS: 3, CUERPO: 3 } },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: [],
          golden: false,
        },
      ],
    },
    {
      key: 'F21_MIND_HIGH_BODY_LOW',
      purpose: 'Andrés: MENTALIDAD alta, CUERPO bajo',
      golden: false,
      cases: [{
        id: 'main',
        purpose: 'andres-like',
        policy_id: 'FULL-v1',
        answers: { pattern: 'BY_DOMAIN', values: { MENTALIDAD: 4, RELACIONES: 4, FINANZAS: 3, CUERPO: 2 } },
        risk_answers: 'SAFE',
        narrative: 'FILLED',
        expected_invariants: ['INV-20'],
        golden: false,
      }],
    },
    {
      key: 'F22_FINANCE_ONLY_LOW',
      purpose: 'Hernán: FINANZAS bajo con alerta de deuda',
      golden: false,
      cases: [{
        id: 'main',
        purpose: 'hernan-like',
        policy_id: 'FULL-v1',
        answers: { pattern: 'BY_DOMAIN', values: { MENTALIDAD: 4, RELACIONES: 4, FINANZAS: 2, CUERPO: 4 } },
        risk_answers: { 'D-FIN-09': { value: 1, qualitativeConfirmed: true } },
        narrative: 'EMPTY',
        expected_invariants: [],
        golden: false,
      }],
    },
    {
      key: 'F23_PURPOSE_EMPTY',
      purpose: 'Mateo: narrativa vacía, ejecución alta, propósito sin estado',
      golden: false,
      cases: [{
        id: 'main',
        purpose: 'mateo-like',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 4 },
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: ['INV-20'],
        golden: false,
      }],
    },
    {
      key: 'F24_MULTI_ALERT',
      purpose: 'CRÍTICA REL + ALTA FIN + ALTA CUE',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'multi alert',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 4 },
        risk_answers: {
          'D-REL-15': { value: 1, qualitativeConfirmed: true },
          'D-FIN-09': { value: 1, qualitativeConfirmed: true },
          'D-CUE-01': 1,
        },
        narrative: 'EMPTY',
        expected_invariants: ['INV-03'],
        golden: true,
      }],
    },
    {
      key: 'F25_FULL_VS_BRANCH',
      purpose: 'mismas respuestas FULL vs AUD_PLUS_BRANCHES',
      golden: false,
      cases: [
        {
          id: 'full',
          purpose: 'full',
          policy_id: 'FULL-v1',
          answers: { pattern: 'ALL', value: 2 },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-15'],
          golden: false,
        },
        {
          id: 'branch',
          purpose: 'branches',
          policy_id: 'AUD_PLUS_BRANCHES-v1',
          answers: { pattern: 'ALL', value: 2 },
          risk_answers: 'SAFE',
          narrative: 'EMPTY',
          expected_invariants: ['INV-15'],
          golden: false,
        },
      ],
    },
    {
      key: 'F26_AUD_ONLY_NO_CLASSIFY',
      purpose: 'AUD_ONLY: cuatro sin clasificar, sin prioridad',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'aud only',
        policy_id: 'AUD_ONLY-v1',
        answers: { pattern: 'ALL', value: 3 },
        risk_answers: {},
        narrative: 'EMPTY',
        expected_invariants: ['INV-08', 'INV-14'],
        golden: true,
      }],
    },
    {
      key: 'F27_CONTRADICTORY',
      purpose: 'auditoría alta y profundo bajo en MENTALIDAD',
      golden: false,
      cases: [{
        id: 'main',
        purpose: 'audit vs deep',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 2 },
        overrides: {
          'AUD-MEN-01': 5, 'AUD-MEN-02': 5, 'AUD-MEN-03': 5, 'AUD-MEN-04': 5,
        },
        risk_answers: 'SAFE',
        narrative: 'EMPTY',
        expected_invariants: [],
        golden: false,
      }],
    },
    {
      key: 'F28_HIGH_ALERT_UNCLASSIFIED',
      purpose: 'D-FIN-09=1 con FINANZAS ~40%: state null, prioridad ALTA, plan null',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'alta unclassified',
        policy_id: 'CUSTOM',
        custom_ids: fin40.ids,
        answers: { pattern: 'EXPLICIT', values: { ...fin40.values, 'D-FIN-09': 1 } },
        risk_answers: { 'D-FIN-09': { value: 1, qualitativeConfirmed: true } },
        narrative: 'EMPTY',
        expected_invariants: ['INV-28'],
        golden: true,
      }],
    },
    {
      key: 'F29_MEDIA_UNCLASSIFIED',
      purpose: 'D-CUE-03=Sí con CUERPO ~40%: sin override',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'media unclassified',
        policy_id: 'CUSTOM',
        custom_ids: cue40.ids,
        answers: { pattern: 'EXPLICIT', values: { ...cue40.values, 'D-CUE-03': 1 } },
        risk_answers: { 'D-CUE-03': 1 },
        narrative: 'EMPTY',
        expected_invariants: ['INV-19'],
        golden: true,
      }],
    },
    {
      key: 'F30_QUALITATIVE_SUPPRESSED',
      purpose: 'D-REL-15=1 qualitative false',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'suppressed',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 4 },
        risk_answers: { 'D-REL-15': { value: 1, qualitativeConfirmed: false } },
        narrative: 'EMPTY',
        expected_invariants: ['INV-29'],
        golden: true,
      }],
    },
    {
      key: 'F31_QUALITATIVE_PARTIAL',
      purpose: 'D-REL-15=1 qualitative null: PARTIAL + override',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'partial',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 4 },
        risk_answers: { 'D-REL-15': { value: 1, qualitativeConfirmed: null } },
        narrative: 'EMPTY',
        expected_invariants: [],
        golden: true,
      }],
    },
    {
      key: 'F32_BLOCKED_EXECUTION',
      purpose: 'CRÍTICA en ámbito prioritario: catálogo presente, ejecución BLOCKED',
      golden: true,
      cases: [{
        id: 'main',
        purpose: 'blocked',
        policy_id: 'FULL-v1',
        answers: { pattern: 'ALL', value: 4 },
        risk_answers: 'SAFE',
        overrides: { 'D-CUE-05': 1 },
        narrative: 'EMPTY',
        expected_invariants: ['INV-30'],
        golden: true,
      }],
    },
  ];
}

export const FIXTURE_KEYS = [
  'F01_ALL_MAX',
  'F02_ALL_MIN_SAFE',
  'F03_ALL_MID',
  'F04_CRITICAL_HIGH_SCORE',
  'F05_HIGH_ALERT_CAP',
  'F06_MEDIA_NO_OVERRIDE',
  'F07_ALERT_UNCLASSIFIED',
  'F08_LOW_COVERAGE',
  'F09_COVERAGE_59_VS_60',
  'F10_COVERAGE_79_VS_80',
  'F11_BOUNDARY_39_40',
  'F12_BOUNDARY_59_60',
  'F13_BOUNDARY_79_80',
  'F14_INVERSE',
  'F15_MISSING_NOT_ZERO',
  'F16_UNSCOREABLE_SLEEP',
  'F17_RISK_NOT_EVALUATED',
  'F18_SINGLE_ITEM_DIMENSION',
  'F19_SAME_SCORE_DIFFERENT_CAUSE',
  'F20_SAME_PRIORITY_DIFFERENT_CONTEXT',
  'F21_MIND_HIGH_BODY_LOW',
  'F22_FINANCE_ONLY_LOW',
  'F23_PURPOSE_EMPTY',
  'F24_MULTI_ALERT',
  'F25_FULL_VS_BRANCH',
  'F26_AUD_ONLY_NO_CLASSIFY',
  'F27_CONTRADICTORY',
  'F28_HIGH_ALERT_UNCLASSIFIED',
  'F29_MEDIA_UNCLASSIFIED',
  'F30_QUALITATIVE_SUPPRESSED',
  'F31_QUALITATIVE_PARTIAL',
  'F32_BLOCKED_EXECUTION',
] as const;
