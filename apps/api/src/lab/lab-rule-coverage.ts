import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CASEBOOK_FAMILIES } from './lab-casebook';

export type CoverageLayer =
  | 'Puntaje'
  | 'Cobertura'
  | 'Estados'
  | 'Safety'
  | 'Ámbito prioritario'
  | 'Rutas'
  | 'Contexto'
  | 'Dirección';

export type CoverageMode =
  | 'HUMAN'
  | 'QA'
  | 'FIDELITY'
  | 'DIRECTION'
  | 'FUTURE'
  | 'NOT_APPLICABLE';

export type RuleCoverageRow = {
  id: string;
  layer: CoverageLayer;
  label: string;
  kind: 'human' | 'qa';
  mode: CoverageMode;
  test_ids: string[];
  status: 'covered' | 'gap_human' | 'gap_qa';
};

const QA_ANCHORS: Record<string, string[]> = {
  SCORE_BOUNDS: ['packages/matrix-engine/test/diagnostic-invariants.test.ts'],
  MISSING_NOT_BAD: ['packages/matrix-engine/test/coverage-state.test.ts'],
  CONTEXT_NEVER_SCORES: [
    'packages/matrix-engine/test/diagnostic-contract.test.ts',
    'packages/experience-engine/test/direction-reading.test.ts',
  ],
  DETERMINISM: ['packages/matrix-engine/test/run-assessment.test.ts'],
  TIE_STABLE: ['packages/matrix-engine/test/priority-recommend.test.ts'],
  BANK_INTEGRITY: ['apps/api/test/lab-question-roles.test.ts'],
  DIRECTION_EMPTY: ['packages/experience-engine/test/direction-reading.test.ts'],
  DIRECTION_NON_DOMINANCE: ['packages/matrix-engine/test/diagnostic-invariants.test.ts'],
  DIRECTION_SEGREGATION: ['packages/matrix-engine/test/diagnostic-invariants.test.ts'],
  PRIORITY_SAFETY_CONFLICT: ['packages/matrix-engine/test/safety.test.ts'],
  SAFETY_MULTIPLE_PRECEDENCE: ['packages/matrix-engine/test/safety.test.ts'],
  ROUTE_COMPLETE: ['packages/matrix-engine/test/route-complete.test.ts'],
  FIXTURES_P0: ['packages/matrix-engine/test/fixtures.test.ts'],
  SAFETY_QA: ['packages/matrix-engine/test/safety.test.ts'],
  INTERPRETATIONS: ['packages/matrix-engine/src/interpretations.ts'],
};

type RowSpec = Omit<RuleCoverageRow, 'status'> & {
  require_keys?: string[];
  forbid_keys?: string[];
};

const ROWS: RowSpec[] = [
  { id: 'NO_CLEAR_PRIORITY', layer: 'Ámbito prioritario', label: 'Sin un ámbito prioritario claro', kind: 'human', mode: 'HUMAN', test_ids: ['baseline'] },
  { id: 'SINGLE_PRIORITY', layer: 'Ámbito prioritario', label: 'Un ámbito claramente prioritario', kind: 'human', mode: 'HUMAN', test_ids: ['one_low'] },
  {
    id: 'CLEAN_PRIORITY_FOUR_DOMAINS',
    layer: 'Ámbito prioritario',
    label: 'Cada ámbito aparece como ámbito prioritario limpio, sin safety',
    kind: 'human',
    mode: 'HUMAN',
    test_ids: ['one_low'],
    require_keys: ['R02', 'R16', 'R17', 'R03'],
    forbid_keys: ['R04'],
  },
  { id: 'TWO_LOW', layer: 'Ámbito prioritario', label: 'Dos ámbitos comprometidos', kind: 'human', mode: 'HUMAN', test_ids: ['two_low'] },
  {
    id: 'TIE_BREAK',
    layer: 'Ámbito prioritario',
    label: 'Empate entre ámbitos prioritarios',
    kind: 'human',
    mode: 'HUMAN',
    test_ids: ['tie'],
    require_keys: ['R18'],
  },
  { id: 'BAND_39_40', layer: 'Estados', label: 'Corte 39/40', kind: 'human', mode: 'HUMAN', test_ids: ['edge_39_40'] },
  { id: 'BAND_59_60', layer: 'Estados', label: 'Corte 59/60', kind: 'human', mode: 'HUMAN', test_ids: ['edge_59_60'] },
  { id: 'BAND_79_80', layer: 'Estados', label: 'Corte 79/80', kind: 'human', mode: 'HUMAN', test_ids: ['edge_79_80'] },
  { id: 'INSUFFICIENT', layer: 'Cobertura', label: 'Información insuficiente', kind: 'human', mode: 'HUMAN', test_ids: ['insufficient'] },
  {
    id: 'SAFETY_BODY_CRITICAL',
    layer: 'Safety',
    label: 'Safety crítico de Cuerpo',
    kind: 'human',
    mode: 'HUMAN',
    test_ids: ['safety_critical'],
    require_keys: ['R11', 'R11B'],
  },
  {
    id: 'SAFETY_FINANCE_PARTIAL',
    layer: 'Safety',
    label: 'Safety Finanzas con cobertura incompleta',
    kind: 'human',
    mode: 'HUMAN',
    test_ids: ['safety_high_unclassified'],
    require_keys: ['R12', 'R12B'],
  },
  { id: 'SAME_HEADLINE', layer: 'Puntaje', label: 'Igual headline, distinta composición', kind: 'human', mode: 'HUMAN', test_ids: ['same_headline'] },
  {
    id: 'AUD_VS_FULL',
    layer: 'Cobertura',
    label: 'Evaluación corta frente a completa',
    kind: 'human',
    mode: 'HUMAN',
    test_ids: ['aud_vs_full'],
    require_keys: ['R14', 'R19'],
  },
  { id: 'CONTEXT_INVARIANT', layer: 'Dirección', label: 'Misma clasificación, distinta evidencia de dirección', kind: 'human', mode: 'DIRECTION', test_ids: ['purpose_silent'] },
  { id: 'PRIORITY_SAFETY_CONFLICT', layer: 'Safety', label: 'Safety en un ámbito que no es el ámbito prioritario', kind: 'qa', mode: 'QA', test_ids: ['PRIORITY_SAFETY_CONFLICT'] },
  { id: 'SAFETY_MULTIPLE_PRECEDENCE', layer: 'Safety', label: 'Varias alertas simultáneas', kind: 'qa', mode: 'QA', test_ids: ['SAFETY_MULTIPLE_PRECEDENCE'] },
  { id: 'SCORE_BOUNDS', layer: 'Puntaje', label: 'Ningún puntaje válido sale de 0 a 100', kind: 'qa', mode: 'QA', test_ids: ['SCORE_BOUNDS'] },
  { id: 'MISSING_NOT_BAD', layer: 'Cobertura', label: 'Una respuesta faltante no equivale a una respuesta mala', kind: 'qa', mode: 'QA', test_ids: ['MISSING_NOT_BAD'] },
  { id: 'CONTEXT_NEVER_SCORES', layer: 'Dirección', label: 'Una pregunta de dirección no altera el contrato diagnóstico', kind: 'qa', mode: 'QA', test_ids: ['CONTEXT_NEVER_SCORES'] },
  { id: 'DETERMINISM', layer: 'Puntaje', label: 'El orden de las preguntas no altera el resultado', kind: 'qa', mode: 'QA', test_ids: ['DETERMINISM'] },
  { id: 'TIE_STABLE', layer: 'Ámbito prioritario', label: 'Los empates siempre se resuelven igual', kind: 'qa', mode: 'QA', test_ids: ['TIE_STABLE'] },
  { id: 'ROUTE_COMPLETE', layer: 'Rutas', label: 'Cada combinación válida ámbito y estado tiene ruta o fallback', kind: 'qa', mode: 'QA', test_ids: ['ROUTE_COMPLETE'] },
  { id: 'BANK_INTEGRITY', layer: 'Puntaje', label: 'Toda pregunta puntuable tiene dimensión y mapping válidos', kind: 'qa', mode: 'QA', test_ids: ['BANK_INTEGRITY'] },
  { id: 'DIRECTION_EMPTY', layer: 'Dirección', label: 'Propósito vacío produce NO_SIGNAL, no un estado malo', kind: 'qa', mode: 'QA', test_ids: ['DIRECTION_EMPTY'] },
  { id: 'DIRECTION_NON_DOMINANCE', layer: 'Dirección', label: 'Narrativas de propósito no mueven Cuerpo en contención', kind: 'qa', mode: 'QA', test_ids: ['DIRECTION_NON_DOMINANCE'] },
  { id: 'DIRECTION_SEGREGATION', layer: 'Dirección', label: 'Las preguntas de dirección no entran al denominador diagnóstico', kind: 'qa', mode: 'QA', test_ids: ['DIRECTION_SEGREGATION'] },
  { id: 'F01_ALL_MAX', layer: 'Puntaje', label: 'Todo máximo, sin alertas accidentales', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F02_ALL_MIN_SAFE', layer: 'Puntaje', label: 'Todo mínimo seguro, sin alertas accidentales', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F03_ALL_MID', layer: 'Puntaje', label: 'Todo medio, 50', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F09_COVERAGE_060', layer: 'Cobertura', label: 'Umbral de cobertura 0.60', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F10_COVERAGE_080', layer: 'Cobertura', label: 'Umbral de cobertura 0.80', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F14_INVERSE', layer: 'Puntaje', label: 'Ítems inversos 1↔5', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F16_UNSCOREABLE_SLEEP', layer: 'Puntaje', label: 'D-CUE-07 se guarda y no puntúa', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F17_RISK_NOT_EVALUATED', layer: 'Safety', label: 'Riesgo no evaluado si falta respuesta', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F18_SINGLE_ITEM', layer: 'Puntaje', label: 'Dimensión de un solo ítem', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F24_MULTI_ALERT', layer: 'Safety', label: 'Varias alertas simultáneas (fixture)', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'F30_QUALITATIVE_SUPPRESSED', layer: 'Safety', label: 'Condición cualitativa suprimida', kind: 'qa', mode: 'QA', test_ids: ['SAFETY_QA'] },
  { id: 'F31_QUALITATIVE_PARTIAL', layer: 'Safety', label: 'Condición cualitativa parcial', kind: 'qa', mode: 'QA', test_ids: ['SAFETY_QA'] },
  { id: 'LAB-ALIAS-01', layer: 'Puntaje', label: 'Alias de dimensiones', kind: 'qa', mode: 'QA', test_ids: ['INTERPRETATIONS'] },
  { id: 'LAB-NORM-01', layer: 'Puntaje', label: 'Horas de sueño sin mapa de puntaje', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'LAB-SCORE-01', layer: 'Puntaje', label: 'Agregación por dimensión igual', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'LAB-COV-01', layer: 'Cobertura', label: 'Denominador de definición, independiente de política', kind: 'human', mode: 'HUMAN', test_ids: ['insufficient'] },
  { id: 'LAB-COV-02', layer: 'Cobertura', label: 'Dimensiones críticas no definidas', kind: 'qa', mode: 'NOT_APPLICABLE', test_ids: ['INTERPRETATIONS'] },
  { id: 'LAB-COV-03', layer: 'Cobertura', label: 'Comparar cobertura por ratio exacto', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'LAB-STATE-01', layer: 'Estados', label: 'Bandas de estado', kind: 'human', mode: 'HUMAN', test_ids: ['edge_39_40'] },
  { id: 'LAB-OVR-01', layer: 'Safety', label: 'Alerta alta como techo de estado', kind: 'human', mode: 'HUMAN', test_ids: ['safety_high_unclassified'], require_keys: ['R12B'] },
  { id: 'LAB-OVR-02', layer: 'Safety', label: 'Crítica sin clasificar fuerza Contención', kind: 'human', mode: 'HUMAN', test_ids: ['safety_critical'], require_keys: ['R11B'] },
  { id: 'LAB-OVR-03', layer: 'Safety', label: 'Alerta alta sin clasificar, sin estado fabricado', kind: 'human', mode: 'HUMAN', test_ids: ['safety_high_unclassified'], require_keys: ['R12'] },
  { id: 'LAB-SAFETY-01', layer: 'Safety', label: 'Condición cualitativa confirmada, parcial o suprimida', kind: 'qa', mode: 'QA', test_ids: ['SAFETY_QA'] },
  { id: 'LAB-SAFETY-02', layer: 'Safety', label: 'Recomendación bloqueada con alerta activa', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'LAB-SAFETY-03', layer: 'Safety', label: 'Riesgo sin responder queda no evaluado', kind: 'qa', mode: 'QA', test_ids: ['FIXTURES_P0'] },
  { id: 'LAB-PRIORITY-01', layer: 'Ámbito prioritario', label: 'Orden de desempate, incluido soporte', kind: 'human', mode: 'HUMAN', test_ids: ['tie'], require_keys: ['R18'] },
  { id: 'LAB-PRIORITY-02', layer: 'Ámbito prioritario', label: 'Segundo de mismo orden si está clasificado', kind: 'qa', mode: 'QA', test_ids: ['TIE_STABLE'] },
  { id: 'LAB-PURPOSE-01', layer: 'Dirección', label: 'Propósito no puntúa ni entra al ámbito prioritario', kind: 'human', mode: 'DIRECTION', test_ids: ['purpose_silent'] },
  { id: 'LAB-GLOBAL-01', layer: 'Puntaje', label: 'Sin etiqueta global ejecutable', kind: 'qa', mode: 'QA', test_ids: ['SCORE_BOUNDS'] },
  { id: 'LAB-RECO-01', layer: 'Rutas', label: 'Ruta por ámbito y estado', kind: 'qa', mode: 'QA', test_ids: ['ROUTE_COMPLETE'] },
  { id: 'LAB-POLICY-01', layer: 'Cobertura', label: 'Evaluación breve frente a completa', kind: 'human', mode: 'HUMAN', test_ids: ['aud_vs_full'] },
  { id: 'LAB-POLICY-02', layer: 'Cobertura', label: 'Instrumentos extra de política', kind: 'qa', mode: 'FUTURE', test_ids: ['INTERPRETATIONS'] },
];

function fileExists(rel: string): boolean {
  return [
    join(process.cwd(), rel),
    join(process.cwd(), '../../', rel),
    join(__dirname, '../../../../', rel),
  ].some((path) => existsSync(path));
}

function qaAnchored(id: string): boolean {
  const files = QA_ANCHORS[id] ?? [];
  if (!files.length) return false;
  return files.every((file) => fileExists(file));
}

function familySatisfies(row: RowSpec): boolean {
  const family = row.test_ids.map((id) => CASEBOOK_FAMILIES.find((item) => item.id === id)).find(Boolean);
  if (!family || family.keys.length === 0) return false;
  if (row.require_keys?.some((key) => !family.keys.includes(key))) return false;
  if (row.forbid_keys?.some((key) => family.keys.includes(key))) return false;
  return true;
}

export function buildRuleCoverage() {
  const rows: RuleCoverageRow[] = ROWS.map((row) => {
    let status: RuleCoverageRow['status'];
    if (row.mode === 'FUTURE' || row.mode === 'NOT_APPLICABLE') {
      status = 'covered';
    } else if (row.kind === 'human' || row.mode === 'HUMAN' || row.mode === 'DIRECTION') {
      status = familySatisfies(row) ? 'covered' : 'gap_human';
    } else {
      status = row.test_ids.length > 0 && row.test_ids.every((id) => qaAnchored(id)) ? 'covered' : 'gap_qa';
    }
    return {
      id: row.id,
      layer: row.layer,
      label: row.label,
      kind: row.kind,
      mode: row.mode,
      test_ids: row.test_ids,
      status,
    };
  });
  const layers: CoverageLayer[] = [
    'Puntaje',
    'Cobertura',
    'Estados',
    'Safety',
    'Ámbito prioritario',
    'Rutas',
    'Contexto',
    'Dirección',
  ];
  const summary = layers.map((layer) => {
    const items = rows.filter((item) => item.layer === layer);
    return {
      layer,
      covered: items.filter((item) => item.status === 'covered').length,
      total: items.length,
    };
  });
  const byMode = (['HUMAN', 'QA', 'FIDELITY', 'DIRECTION', 'FUTURE', 'NOT_APPLICABLE'] as CoverageMode[]).map(
    (mode) => ({
      mode,
      covered: rows.filter((item) => item.mode === mode && item.status === 'covered').length,
      total: rows.filter((item) => item.mode === mode).length,
    }),
  );
  return {
    rows,
    summary,
    by_mode: byMode,
    gaps: rows.filter((item) => item.status !== 'covered'),
  };
}
