import type { ChangeOperation, MatrixDefinition } from '@mk/matrix-engine';

/**
 * UI metadata for the five change operations. It only describes what the Lab can already
 * do: every option below resolves its current value from the definition itself, so the
 * client never has to send a technical `from`. No methodology is added here.
 */
export type ChangeKind =
  | 'RULE_THRESHOLD'
  | 'QUESTION_WEIGHT'
  | 'QUESTION_ACTIVE'
  | 'DIMENSION_ALIAS'
  | 'INTERPRETATION';

export type ChangeValueKind =
  | 'SCORE_0_100'
  | 'RATIO_AS_PERCENT'
  | 'WEIGHT'
  | 'BOOLEAN'
  | 'DOMAIN_FIRST'
  | 'DIMENSION_KEY'
  | 'CHOICE';

export interface ChangeOption {
  kind: ChangeKind;
  target_id: string;
  label: string;
  description: string;
  value_kind: ChangeValueKind;
  current: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number | boolean; label: string; help?: string }>;
  range_note?: string;
  rule_id?: string;
  needs_copy_definition?: boolean;
}

const STATE_LABEL: Record<string, string> = {
  'CONTENCIÓN': 'Contención',
  'ESTABILIZACIÓN': 'Estabilización',
  'CONSOLIDACIÓN': 'Consolidación',
  'EXPANSIÓN': 'Expansión',
};

const DOMAIN_LABEL: Record<string, string> = {
  MENTALIDAD: 'Mentalidad',
  RELACIONES: 'Relaciones',
  FINANZAS: 'Finanzas',
  CUERPO: 'Cuerpo',
  'PROPÓSITO': 'Propósito',
};

/** Interpretation params the engine actually reads today, with documented value sets. */
const INTERPRETATION_TARGETS: Array<{
  interpretation_id: string;
  param: string;
  label: string;
  description: string;
  value_kind: ChangeValueKind;
  options?: ChangeOption['options'];
}> = [
  {
    interpretation_id: 'LAB-PRIORITY-01',
    param: 'domain_tie_break',
    label: 'Qué ámbito va primero cuando hay empate',
    description:
      'Cuando dos ámbitos empatan en alerta, estado y puntaje, el ámbito prioritario se decide por este orden fijo.',
    value_kind: 'DOMAIN_FIRST',
  },
  {
    interpretation_id: 'LAB-PRIORITY-01',
    param: 'unclassified_can_be_priority',
    label: 'Un ámbito sin clasificar puede ser el ámbito prioritario',
    description:
      'Hoy un ámbito sin cobertura suficiente queda fuera de la elección del ámbito prioritario.',
    value_kind: 'BOOLEAN',
    options: [
      { value: false, label: 'No puede ser el ámbito prioritario', help: 'Comportamiento actual.' },
      { value: true, label: 'Sí puede ser el ámbito prioritario' },
    ],
  },
  {
    interpretation_id: 'LAB-PRIORITY-02',
    param: 'must_be_classified',
    label: 'El ámbito secundario debe estar clasificado',
    description:
      'El ámbito secundario se toma del segundo candidato. Este parámetro decide si además debe tener cobertura suficiente.',
    value_kind: 'BOOLEAN',
    options: [
      { value: true, label: 'Debe estar clasificado', help: 'Comportamiento actual.' },
      { value: false, label: 'Puede estar sin clasificar' },
    ],
  },
  {
    interpretation_id: 'LAB-SCORE-01',
    param: 'domain_aggregation',
    label: 'Cambiar cómo se suma un ámbito',
    description: 'Prueba qué pasa si el ámbito se calcula sumando cada pregunta en vez de promediar dimensiones.',
    value_kind: 'CHOICE',
    options: [
      { value: 'DIMENSION_EQUAL', label: 'Promedio de dimensiones con igual peso (actual)' },
      { value: 'ITEM_WEIGHTED', label: 'Cada pregunta pesa por sí misma' },
    ],
  },
];

function dimensionLabel(definition: MatrixDefinition, key: string): string {
  const dimension = definition.dimensions.find((item) => item.key === key);
  return dimension?.labels[0] ?? key;
}

export function buildChangeOptions(definition: MatrixDefinition): ChangeOption[] {
  const options: ChangeOption[] = [];

  for (const band of definition.state_bands) {
    const state = STATE_LABEL[band.state] ?? band.state;
    options.push({
      kind: 'RULE_THRESHOLD',
      target_id: `${band.rule_id}.min`,
      rule_id: band.rule_id,
      label: `Puntaje mínimo para ${state}`,
      description: `Hoy un ámbito entra en ${state} desde ${band.min} puntos.`,
      value_kind: 'SCORE_0_100',
      current: band.min,
      min: 0,
      max: 100,
      step: 1,
      range_note: 'Los puntajes de ámbito van de 0 a 100.',
    });
    options.push({
      kind: 'RULE_THRESHOLD',
      target_id: `${band.rule_id}.max`,
      rule_id: band.rule_id,
      label: `Puntaje máximo para ${state}`,
      description: `Hoy un ámbito deja de ser ${state} por encima de ${band.max} puntos.`,
      value_kind: 'SCORE_0_100',
      current: band.max,
      min: 0,
      max: 100,
      step: 1,
      range_note: 'Los puntajes de ámbito van de 0 a 100.',
    });
  }

  const coverageRule = definition.coverage_bands.rule_ids[0] ?? 'R-MISS-01';
  options.push({
    kind: 'RULE_THRESHOLD',
    target_id: `${coverageRule}.insufficient_below`,
    rule_id: coverageRule,
    label: 'Cobertura mínima para interpretar un ámbito',
    description:
      'Por debajo de este porcentaje de preguntas respondidas, el ámbito queda sin clasificar: sin puntaje, sin estado y sin plan.',
    value_kind: 'RATIO_AS_PERCENT',
    current: definition.coverage_bands.insufficient_below,
    min: 0,
    max: 100,
    step: 1,
    range_note: 'Debe quedar por debajo del umbral de lectura provisional.',
  });
  options.push({
    kind: 'RULE_THRESHOLD',
    target_id: `${coverageRule}.provisional_below`,
    rule_id: coverageRule,
    label: 'Cobertura mínima para una lectura firme',
    description:
      'Entre este porcentaje y el mínimo anterior, el ámbito se lee como provisional.',
    value_kind: 'RATIO_AS_PERCENT',
    current: definition.coverage_bands.provisional_below,
    min: 0,
    max: 100,
    step: 1,
    range_note: 'Debe quedar por encima de la cobertura mínima para interpretar.',
  });

  for (const alias of definition.alias_map) {
    options.push({
      kind: 'DIMENSION_ALIAS',
      target_id: alias.from,
      label: alias.from,
      description: `Hoy las preguntas etiquetadas como "${alias.from}" se agrupan en ${dimensionLabel(definition, alias.to)}.`,
      value_kind: 'DIMENSION_KEY',
      current: alias.to,
      options: definition.dimensions.map((dimension) => ({
        value: dimension.key,
        label: dimensionLabel(definition, dimension.key),
        help: DOMAIN_LABEL[dimension.domain] ?? dimension.domain,
      })),
    });
  }

  for (const target of INTERPRETATION_TARGETS) {
    const interpretation = definition.interpretations.find(
      (item) => item.id === target.interpretation_id,
    );
    if (!interpretation) continue;
    if (!(target.param in interpretation.params) && target.param !== 'domain_aggregation') continue;
    options.push({
      kind: 'INTERPRETATION',
      target_id: `${target.interpretation_id}.${target.param}`,
      label: target.label,
      description: target.description,
      value_kind: target.value_kind,
      current:
        target.param === 'domain_aggregation'
          ? (interpretation.params[target.param] ?? 'DIMENSION_EQUAL')
          : interpretation.params[target.param],
      options:
        target.value_kind === 'DOMAIN_FIRST'
          ? (interpretation.params[target.param] as string[]).map((domain) => ({
              value: domain,
              label: DOMAIN_LABEL[domain] ?? domain,
            }))
          : target.options,
    });
  }

  return options;
}

/** Interpretation params stored in the definition that the engine does not read yet. */
export function inertInterpretationParams(
  definition: MatrixDefinition,
): Array<{ interpretation_id: string; param: string; value: unknown }> {
  const engineReads = new Set([
    'LAB-PRIORITY-01.exclude_domains',
    'LAB-PRIORITY-01.domain_tie_break',
    'LAB-PRIORITY-01.unclassified_can_be_priority',
    'LAB-PRIORITY-02.must_be_classified',
    'LAB-SCORE-01.domain_aggregation',
    'LAB-OVR-01.alta_as',
    'LAB-OVR-02.critica_unclassified',
    'LAB-OVR-03.alta_unclassified',
  ]);
  const rows: Array<{ interpretation_id: string; param: string; value: unknown }> = [];
  for (const interpretation of definition.interpretations) {
    for (const [param, value] of Object.entries(interpretation.params)) {
      if (engineReads.has(`${interpretation.id}.${param}`)) continue;
      rows.push({ interpretation_id: interpretation.id, param, value });
    }
  }
  return rows;
}

export class ChangeRequestError extends Error {
  reason: 'CHANGE_INVALID_TARGET' | 'CHANGE_INVALID_VALUE';
  constructor(reason: 'CHANGE_INVALID_TARGET' | 'CHANGE_INVALID_VALUE', message: string) {
    super(message);
    this.reason = reason;
  }
}

function asNumber(value: unknown, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ChangeRequestError('CHANGE_INVALID_VALUE', `${label} necesita un número.`);
  }
  return parsed;
}

/**
 * Builds the technical operation from a guided request. `from` always comes from the
 * definition, never from the client, which is what used to break materialization.
 */
export function buildChangeOperation(
  definition: MatrixDefinition,
  request: { kind: ChangeKind; target_id: string; to: unknown },
): { operation: ChangeOperation; option: ChangeOption | null; summary: string } {
  if (request.kind === 'QUESTION_WEIGHT') {
    const question = definition.questions.find((item) => item.id === request.target_id);
    if (!question) {
      throw new ChangeRequestError('CHANGE_INVALID_TARGET', 'Esa pregunta no existe en la definición.');
    }
    const to = asNumber(request.to, 'La ponderación');
    if (to < 0) {
      throw new ChangeRequestError('CHANGE_INVALID_VALUE', 'La ponderación no puede ser negativa.');
    }
    return {
      operation: { op: 'SET_QUESTION_WEIGHT', question_id: question.id, from: question.weight, to },
      option: null,
      summary: `Ponderación de ${question.id}: ${question.weight} a ${to}`,
    };
  }

  if (request.kind === 'QUESTION_ACTIVE') {
    const question = definition.questions.find((item) => item.id === request.target_id);
    if (!question) {
      throw new ChangeRequestError('CHANGE_INVALID_TARGET', 'Esa pregunta no existe en la definición.');
    }
    const to = request.to === true || request.to === 'true';
    return {
      operation: { op: 'SET_QUESTION_ACTIVE', question_id: question.id, from: question.active, to },
      option: null,
      summary: `${question.id}: ${question.active ? 'incluida' : 'excluida'} a ${to ? 'incluida' : 'excluida'}`,
    };
  }

  const catalog = buildChangeOptions(definition);
  const option = catalog.find(
    (item) => item.kind === request.kind && item.target_id === request.target_id,
  );
  if (!option) {
    throw new ChangeRequestError(
      'CHANGE_INVALID_TARGET',
      'Ese elemento no está entre los cambios que el Lab puede probar.',
    );
  }

  if (option.kind === 'DIMENSION_ALIAS') {
    const to = String(request.to);
    if (!definition.dimensions.some((item) => item.key === to)) {
      throw new ChangeRequestError('CHANGE_INVALID_VALUE', 'Esa dimensión no existe en la definición.');
    }
    return {
      operation: {
        op: 'SET_DIMENSION_ALIAS',
        label: option.target_id,
        from: option.current as string | null,
        to,
      },
      option,
      summary: `${option.target_id}: ${dimensionLabel(definition, option.current as string)} a ${dimensionLabel(definition, to)}`,
    };
  }

  if (option.kind === 'RULE_THRESHOLD') {
    const [ruleId, param] = option.target_id.split('.');
    let to = asNumber(request.to, 'El valor');
    if (option.value_kind === 'RATIO_AS_PERCENT') {
      if (to < 0 || to > 100) {
        throw new ChangeRequestError('CHANGE_INVALID_VALUE', 'La cobertura va de 0% a 100%.');
      }
      to = Math.round(to) / 100;
      const insufficient =
        param === 'insufficient_below' ? to : definition.coverage_bands.insufficient_below;
      const provisional =
        param === 'provisional_below' ? to : definition.coverage_bands.provisional_below;
      if (insufficient > provisional) {
        throw new ChangeRequestError(
          'CHANGE_INVALID_VALUE',
          'La cobertura mínima para interpretar no puede superar la de lectura firme.',
        );
      }
    } else {
      if (to < 0 || to > 100) {
        throw new ChangeRequestError('CHANGE_INVALID_VALUE', 'Los puntajes de ámbito van de 0 a 100.');
      }
      const band = definition.state_bands.find((item) => item.rule_id === ruleId);
      if (band) {
        const min = param === 'min' ? to : band.min;
        const max = param === 'max' ? to : band.max;
        if (min > max) {
          throw new ChangeRequestError(
            'CHANGE_INVALID_VALUE',
            'El mínimo de la banda no puede superar su máximo.',
          );
        }
      }
    }
    return {
      operation: {
        op: 'SET_RULE_PARAM',
        rule_id: ruleId,
        param,
        from: option.current,
        to,
      },
      option,
      summary: `${option.label}: ${formatValue(option, option.current)} a ${formatValue(option, to)}`,
    };
  }

  const [interpretationId, param] = option.target_id.split('.');
  if (option.value_kind === 'CHOICE') {
    const to = String(request.to);
    if (!option.options?.some((item) => String(item.value) === to)) {
      throw new ChangeRequestError('CHANGE_INVALID_VALUE', 'Ese valor no está entre las opciones.');
    }
    return {
      operation: {
        op: 'SET_INTERPRETATION_PARAM',
        interpretation_id: interpretationId,
        param,
        from: option.current,
        to,
      },
      option,
      summary: `${option.label}: ${String(option.current)} a ${to}`,
    };
  }
  if (option.value_kind === 'DOMAIN_FIRST') {
    const domain = String(request.to);
    const current = option.current as string[];
    if (!current.includes(domain)) {
      throw new ChangeRequestError('CHANGE_INVALID_VALUE', 'Ese ámbito no está en el orden actual.');
    }
    const to = [domain, ...current.filter((item) => item !== domain)];
    return {
      operation: {
        op: 'SET_INTERPRETATION_PARAM',
        interpretation_id: interpretationId,
        param,
        from: current,
        to,
      },
      option,
      summary: `Orden de desempate: ${(DOMAIN_LABEL[domain] ?? domain)} primero`,
    };
  }

  const to = request.to === true || request.to === 'true';
  return {
    operation: {
      op: 'SET_INTERPRETATION_PARAM',
      interpretation_id: interpretationId,
      param,
      from: option.current,
      to,
    },
    option,
    summary: `${option.label}: ${option.current === true ? 'sí' : 'no'} a ${to ? 'sí' : 'no'}`,
  };
}

function formatValue(option: ChangeOption, value: unknown): string {
  if (option.value_kind === 'RATIO_AS_PERCENT' && typeof value === 'number') {
    return `${Math.round(value * 100)}%`;
  }
  return String(value);
}
