import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { loadWorkbookTables } from './load-xlsx';
import {
  ALIAS_PAIRS,
  COVERAGE_BANDS,
  DOMAIN_ORDER,
  EXECUTABLE_RULES,
  ID_COLUMN,
  NORM_EXCEPTIONS,
  NOT_EXECUTED,
  NUCLEO_DOMAINS,
  POLICY_CORE_PURPOSE_IDS,
  SHEET,
  STATE_BANDS,
} from '../constants';
import { canonicalize, definitionSha256, sha256Bytes } from '../engine/hash';
import { buildInterpretations } from '../interpretations';
import {
  asNumber,
  asString,
  dimensionKey,
  severityKey,
  yesNo,
} from '../slug';
import {
  ENGINE_SEMVER,
  IMPORTER_VERSION,
  MatrixImportError,
  type ActivityDefinition,
  type AliasMapping,
  type DomainDefinition,
  type ImportResult,
  type MatrixDefinition,
  type MetricDefinition,
  type ObjectiveDefinition,
  type PlanDefinition,
  type PurposeModule,
  type QuestionDefinition,
  type QuestionRisk,
  type RuleDefinition,
  type ScaleDefinition,
} from '../types';
import { catalogsByCategory, readSheetTable, type Row } from './read-table';
import { validateDefinition } from './validate';
import { buildImportReport } from './report';

const RESPONSE_KIND: Record<string, string> = {
  LIKERT_1_5: 'LIKERT_1_5',
  TEXTO: 'TEXT',
  SÍ_NO_DETALLE: 'YES_NO_DETAIL',
  SI_NO_DETALLE: 'YES_NO_DETAIL',
  SELECCIÓN: 'CHOICE',
  SELECCION: 'CHOICE',
  NUMÉRICO: 'NUMBER',
  NUMERICO: 'NUMBER',
  NUMÉRICO_MÚLTIPLE: 'NUMBER_MULTI',
  NUMERICO_MULTIPLE: 'NUMBER_MULTI',
  SELECCIÓN_MÚLTIPLE: 'MULTI_CHOICE',
  SELECCION_MULTIPLE: 'MULTI_CHOICE',
};

export interface ImportOptions {
  xlsxPath?: string;
  bytes?: Buffer;
  sourceFileName?: string;
  definitionId: string;
  expectSha256?: string;
}

export async function importMatrix(options: ImportOptions): Promise<ImportResult> {
  const bytes = options.bytes ?? (options.xlsxPath ? await readFile(options.xlsxPath) : null);
  if (!bytes) {
    throw new MatrixImportError('xlsx path or bytes required');
  }
  const sourceSha = sha256Bytes(bytes);
  if (options.expectSha256 && options.expectSha256 !== sourceSha) {
    throw new MatrixImportError(
      `source sha256 mismatch: expected ${options.expectSha256} got ${sourceSha}`,
    );
  }

  const workbook = loadWorkbookTables(bytes);

  const questionsTable = readSheetTable(
    workbook,
    SHEET.QUESTIONS,
    ID_COLUMN.QUESTIONS,
  );
  const scalesTable = readSheetTable(workbook, SHEET.SCALES, ID_COLUMN.SCALES);
  const rulesTable = readSheetTable(workbook, SHEET.RULES, ID_COLUMN.RULES);
  const plansTable = readSheetTable(workbook, SHEET.PLANS, ID_COLUMN.PLANS);
  const objectivesTable = readSheetTable(
    workbook,
    SHEET.OBJECTIVES,
    ID_COLUMN.OBJECTIVES,
  );
  const activitiesTable = readSheetTable(
    workbook,
    SHEET.ACTIVITIES,
    ID_COLUMN.ACTIVITIES,
  );
  const metricsTable = readSheetTable(workbook, SHEET.METRICS, ID_COLUMN.METRICS);
  const purposeTable = readSheetTable(workbook, SHEET.PURPOSE, ID_COLUMN.PURPOSE);
  const catalogsTable = readSheetTable(
    workbook,
    SHEET.CATALOGS,
    ID_COLUMN.CATALOGS,
  );

  const catalogs = catalogsByCategory(catalogsTable.rows);
  const scales = buildScales(scalesTable.rows);
  const scaleById = new Map(scales.map((scale) => [scale.id, scale]));
  const metrics = buildMetrics(metricsTable.rows);
  const metricIds = new Set(metrics.map((metric) => metric.id));

  const alias_map: AliasMapping[] = ALIAS_PAIRS.map((pair) => ({
    from: pair.from,
    to: dimensionKey(pair.domain, pair.canonical),
    interpretation: 'LAB-ALIAS-01',
  }));
  const aliasToCanonical = new Map(
    ALIAS_PAIRS.map((pair) => [`${pair.domain}::${pair.from}`, pair.canonical]),
  );

  const questions: QuestionDefinition[] = [];
  const risks: QuestionRisk[] = [];
  const dimensionLabels = new Map<string, { domain: string; labels: Set<string>; inverse: boolean }>();

  for (const row of questionsTable.rows) {
    const id = asString(row.ID_Pregunta);
    if (!id) continue;
    const domain = asString(row.Ámbito || row.Ambito);
    const rawDimension = asString(row.Dimensión || row.Dimension);
    const canonicalLabel =
      aliasToCanonical.get(`${domain}::${rawDimension}`) ?? rawDimension;
    const dimension = dimensionKey(domain, canonicalLabel);
    const bucket = dimensionLabels.get(dimension) ?? {
      domain,
      labels: new Set<string>(),
      inverse: false,
    };
    bucket.labels.add(canonicalLabel);
    if (rawDimension) bucket.labels.add(rawDimension);
    const variableKind = asString(row.Tipo_variable);
    const scaleId = asString(row.ID_Escala);
    const scale = scaleById.get(scaleId);
    const weight = asNumber(row.Ponderación) ?? 0;
    const inverse = yesNo(row.Puntaje_inverso);
    if (inverse) bucket.inverse = true;
    dimensionLabels.set(dimension, bucket);
    const scoreable = Boolean(
      variableKind === 'ESTADO' && weight > 0 && scale?.scoreable,
    );
    const unscoreableReason =
      variableKind === 'ESTADO' &&
      weight > 0 &&
      scale &&
      !scale.scoreable &&
      NORM_EXCEPTIONS.includes(id)
        ? 'SCALE_HAS_NO_SCORE_MAP'
        : null;

    let risk: QuestionRisk | null = null;
    if (variableKind === 'RIESGO') {
      risk = buildRisk(row, id, domain);
      risks.push(risk);
    }

    const metricKey = asString(row.Métrica_clave || row.Metrica_clave) || null;
    questions.push({
      id,
      row_version: asString(row.Versión || row.Version) || '1.0',
      active: yesNo(row.Activa),
      instrument: asString(row.Instrumento),
      phase: asString(row.Fase),
      domain,
      dimension,
      variable_kind: variableKind,
      response_kind: mapResponseKind(asString(row.Tipo_respuesta)),
      scale_id: scaleId,
      weight,
      inverse,
      scoreable,
      unscoreable_reason: unscoreableReason,
      risk,
      plan_selector: asString(row.Selector_de_plan) || null,
      objective_rule: asString(row.Regla_de_objetivo) || null,
      metric_key: metricKey,
      metric_key_resolved: metricKey ? metricIds.has(metricKey) : true,
      text: asString(row.Pregunta_neutral),
      mk_role: asString(row.Rol_MK_v2) || null,
      intervention_level: asString(row.Nivel_intervención || row.Nivel_intervencion) || null,
    });
  }

  const dimensions = [...dimensionLabels.entries()].map(([key, value]) => ({
    key,
    domain: value.domain,
    labels: [...value.labels],
    inverse: value.inverse,
    critical: false,
  }));
  const plans = buildPlans(plansTable.rows, objectivesTable.rows);
  const objectives = buildObjectives(objectivesTable.rows, activitiesTable.rows);
  const activities = buildActivities(activitiesTable.rows);
  const domains = buildDomains(questions, plans);
  const rules = buildRules(rulesTable.rows);
  const purpose_modules = buildPurposeModules(purposeTable.rows);

  const policyCoreQuestionIds = [
    ...questions.filter((q) => q.phase.startsWith('AUDIT')).map((q) => q.id),
    ...questions.filter((q) => q.instrument === 'D-MEN-001').map((q) => q.id),
    ...POLICY_CORE_PURPOSE_IDS.filter((id) => questions.some((q) => q.id === id)),
  ];

  const interpretations = buildInterpretations({ policyCoreQuestionIds });

  const draft: Omit<MatrixDefinition, 'definition_sha256'> = {
    definition_id: options.definitionId,
    revision: 1,
    definition_ref: `${options.definitionId}@1`,
    status: 'PUBLISHED',
    base_definition_ref: null,
    changeset_id: null,
    source: {
      file: options.sourceFileName ?? (options.xlsxPath ? basename(options.xlsxPath) : 'memory.xlsx'),
      sha256: sourceSha,
      importer_version: IMPORTER_VERSION,
    },
    domains,
    dimensions,
    alias_map,
    scales,
    questions,
    risks,
    rules,
    state_bands: STATE_BANDS,
    coverage_bands: COVERAGE_BANDS,
    plans,
    objectives,
    activities,
    metrics,
    purpose_modules,
    interpretations,
    not_executed: NOT_EXECUTED,
  };

  const hash = definitionSha256(draft);
  const definition: MatrixDefinition = {
    ...draft,
    definition_sha256: hash,
  };

  const issues = validateDefinition(definition, {
    questionRows: questionsTable.rows,
    catalogs,
  });
  const report = buildImportReport(definition, issues, ENGINE_SEMVER);

  return {
    definition,
    report,
    canonicalJson: canonicalize(definition),
  };
}

function mapResponseKind(raw: string): string {
  return RESPONSE_KIND[raw] ?? raw;
}

function buildScales(rows: Row[]): ScaleDefinition[] {
  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const id = asString(row.ID_Escala);
    if (!id) continue;
    const list = grouped.get(id) ?? [];
    list.push(row);
    grouped.set(id, list);
  }
  const scales: ScaleDefinition[] = [];
  for (const [id, group] of grouped) {
    const anchors = group.map((row) => ({
      value: parseAnchorValue(row.Valor),
      label: asString(row.Anclaje),
      score: asNumber(row.Puntaje_0_100),
    }));
    const scoreable = anchors.some((anchor) => anchor.score != null);
    scales.push({
      id,
      kind: scaleKind(id, scoreable),
      anchors,
      scoreable,
    });
  }
  return scales;
}

function parseAnchorValue(value: unknown): number | string | null {
  if (value == null || value === '') return null;
  const numeric = asNumber(value);
  if (numeric != null) return numeric;
  return asString(value);
}

function scaleKind(
  id: string,
  scoreable: boolean,
): ScaleDefinition['kind'] {
  if (id === 'L5_FREQ' || id === 'L5_AGREE') return 'SCALE_5';
  if (id === 'YN_DETAIL') return 'YES_NO';
  if (id === 'TEXT') return 'TEXT';
  if (id === 'NUMERIC' || id === 'SLEEP_HOURS') return 'NUMBER';
  if (id === 'BODY_GOAL' || id === 'BODY_PHASE' || id === 'EQUIPMENT' || id === 'EXPERIENCE') {
    return 'CHOICE';
  }
  return scoreable ? 'SCALE_5' : 'CHOICE';
}

function buildRisk(row: Row, id: string, domain: string): QuestionRisk {
  const condition = asString(row.Condición_alerta || row.Condicion_alerta);
  const { values, qualitative } = parseCondition(condition);
  const severity = severityKey(row.Severidad) ?? 'MEDIA';
  return {
    question_id: id,
    domain,
    severity,
    condition_text: condition,
    numeric_clause: { op: 'in', values },
    qualitative_clause: qualitative,
    qualitative_structured: false,
    immediate_action: asString(row.Acción_inmediata || row.Accion_inmediata),
    referral: asString(
      row.Derivación_profesional || row.Derivacion_profesional,
    ),
    interpretation: qualitative ? 'LAB-SAFETY-01' : null,
  };
}

function parseCondition(text: string): {
  values: number[];
  qualitative: string | null;
} {
  const yes = /respuesta\s+sí/i.test(text);
  if (yes) return { values: [1], qualitative: null };

  const range = text.match(/respuesta\s+(\d+)\s+o\s+(\d+)/i);
  const single = text.match(/respuesta\s+(\d+)/i);
  const values = range
    ? [Number(range[1]), Number(range[2])]
    : single
      ? [Number(single[1])]
      : [];

  const split = text.split(/\s+y\s+/i);
  const qualitative =
    split.length > 1 ? split.slice(1).join(' y ').trim() : null;
  return { values, qualitative };
}

function buildDomains(
  questions: QuestionDefinition[],
  plans: PlanDefinition[],
): DomainDefinition[] {
  const seen = new Set(questions.map((q) => q.domain));
  const planned = new Set(plans.map((p) => p.domain));
  const ordered = [
    ...DOMAIN_ORDER.filter((key) => seen.has(key)),
    ...[...seen].filter((key) => !DOMAIN_ORDER.includes(key)),
  ];
  return ordered.map((key) => ({
    key,
    role: NUCLEO_DOMAINS.has(key) ? 'NUCLEO' : 'SOPORTE',
    has_plans: planned.has(key),
  }));
}

function buildPlans(rows: Row[], objectiveRows: Row[]): PlanDefinition[] {
  return rows.map((row) => {
    const id = asString(row.ID_Plan);
    return {
      id,
      domain: asString(row.Ámbito || row.Ambito),
      state: asString(row.Estado),
      name: asString(row.Nombre),
      max_objectives: asNumber(row.Máx_objetivos ?? row['Max_objetivos']) ?? 3,
      duration_text: asString(row.Duración || row.Duracion),
      mk_role: asString(row.Rol_MK_v2) || null,
      entry_criteria_text: asString(row.Criterio_entrada),
      exit_criteria_text: asString(row.Criterio_salida),
      objective_ids: objectiveRows
        .filter((objective) => asString(objective.ID_Plan) === id)
        .map((objective) => asString(objective.ID_Objetivo)),
    };
  });
}

function buildObjectives(
  rows: Row[],
  activityRows: Row[],
): ObjectiveDefinition[] {
  return rows.map((row) => {
    const id = asString(row.ID_Objetivo);
    return {
      id,
      plan_id: asString(row.ID_Plan),
      sequence: asNumber(row.Secuencia) ?? 0,
      type: asString(row.Tipo_objetivo),
      text: asString(row.Objetivo_específico || row.Objetivo_especifico),
      metric_id: asString(row.ID_Métrica || row.ID_Metrica) || null,
      target: asString(row.Meta) || null,
      horizon_weeks: asNumber(row.Horizonte_semanas),
      activity_ids: activityRows
        .filter((activity) => asString(activity.ID_Objetivo) === id)
        .map((activity) => asString(activity.ID_Actividad)),
    };
  });
}

function buildActivities(rows: Row[]): ActivityDefinition[] {
  return rows.map((row) => ({
    id: asString(row.ID_Actividad),
    objective_id: asString(row.ID_Objetivo),
    text: asString(row.Acción_ejecutable || row.Accion_ejecutable),
    cadence: asString(row.Cadencia) || null,
    minutes: asNumber(row.Minutos_estimados),
    evidence: asString(row.Evidencia) || null,
    minimum_version: asString(row.Versión_mínima || row.Version_minima) || null,
    comb_barrier: asString(row.Barrera_COMB) || null,
  }));
}

function buildMetrics(rows: Row[]): MetricDefinition[] {
  return rows
    .filter((row) => /^[A-Z]{3}-/.test(asString(row.ID_Métrica || row.ID_Metrica)))
    .map((row) => {
      const directionRaw = asString(row.Dirección || row.Direccion);
      return {
        id: asString(row.ID_Métrica || row.ID_Metrica),
        domain: asString(row.Ámbito || row.Ambito),
        name: asString(row.Nombre),
        direction: directionRaw.includes('↓') ? 'down' : directionRaw ? 'up' : 'unknown',
      };
    });
}

function buildRules(rows: Row[]): RuleDefinition[] {
  return rows.map((row) => {
    const id = asString(row.ID_Regla);
    const executable = EXECUTABLE_RULES.has(id);
    return {
      id,
      category: asString(row.Categoría || row.Categoria),
      condition: asString(row.Condición || row.Condicion),
      result: asString(row['Resultado/Formula'] || row.Resultado),
      justification: asString(row.Justificación || row.Justificacion),
      executable,
      not_executable_reason: executable ? null : 'not executed in v0',
      params: {},
    };
  });
}

function buildPurposeModules(rows: Row[]): PurposeModule[] {
  return rows.map((row) => ({
    order: asNumber(row.Orden) ?? 0,
    key: asString(row.Módulo || row.Modulo),
    name: asString(row.Nombre),
    quality_rule: asString(row['Regla de calidad']),
  }));
}

