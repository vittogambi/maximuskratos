import { COMPOSITE_RISK_IDS, NORM_EXCEPTIONS } from '../constants';
import { asNumber, asString } from '../slug';
import {
  LAB_INTERPRETATION_IDS,
  type MatrixDefinition,
  type ValidationIssue,
} from '../types';
import type { Row } from './read-table';

export interface RawImport {
  questionRows: Row[];
  catalogs: Record<string, Set<string>>;
}

export function validateDefinition(
  definition: MatrixDefinition,
  raw: RawImport,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const error = (code: string, message: string, ids?: string[]) => {
    issues.push({ severity: 'ERROR', code, message, ids });
  };
  const warning = (code: string, message: string, ids?: string[]) => {
    issues.push({ severity: 'WARNING', code, message, ids });
  };

  const questionIds = new Map<string, number>();
  for (const row of raw.questionRows) {
    const id = asString(row.ID_Pregunta);
    if (!id) {
      error('EMPTY_QUESTION_ID', 'ID_Pregunta vacío en una fila con datos');
      continue;
    }
    questionIds.set(id, (questionIds.get(id) ?? 0) + 1);
  }
  const duplicates = [...questionIds.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  if (duplicates.length) {
    error('DUPLICATE_QUESTION_ID', 'ID_Pregunta duplicado', duplicates);
  }

  const scaleIds = new Set(definition.scales.map((scale) => scale.id));
  const domainsCatalog = raw.catalogs.DOMINIO ?? new Set();
  const variableCatalog = raw.catalogs.VARIABLE ?? new Set();
  const severityCatalog = raw.catalogs.SEVERIDAD ?? new Set();
  const stateCatalog = raw.catalogs.ESTADO ?? new Set();

  const rawDimensionDomains = new Map<string, Set<string>>();
  for (const row of raw.questionRows) {
    const label = asString(row.Dimensión || row.Dimension);
    const domain = asString(row.Ámbito || row.Ambito);
    if (!label || !domain) continue;
    const set = rawDimensionDomains.get(label) ?? new Set();
    set.add(domain);
    rawDimensionDomains.set(label, set);
  }
  for (const [label, domains] of rawDimensionDomains) {
    if (domains.size > 1) {
      error(
        'DIMENSION_CROSSES_DOMAINS',
        `Dimensión ${label} aparece en más de un ámbito`,
        [...domains],
      );
    }
  }

  const seenQuestionIds = new Set<string>();

  for (const question of definition.questions) {
    if (seenQuestionIds.has(question.id)) continue;
    seenQuestionIds.add(question.id);

    if (question.scale_id && !scaleIds.has(question.scale_id)) {
      error(
        'MISSING_SCALE',
        `ID_Escala ${question.scale_id} no existe`,
        [question.id],
      );
    }
    if (variableCatalog.size && !variableCatalog.has(question.variable_kind)) {
      error(
        'INVALID_VARIABLE_KIND',
        `Tipo_variable fuera de catálogo: ${question.variable_kind}`,
        [question.id],
      );
    }
    if (domainsCatalog.size && !domainsCatalog.has(question.domain)) {
      error(
        'INVALID_DOMAIN',
        `Ámbito fuera de catálogo: ${question.domain}`,
        [question.id],
      );
    }
    if (question.weight < 0 || Number.isNaN(question.weight)) {
      error(
        'INVALID_WEIGHT',
        'Ponderación no numérica o negativa',
        [question.id],
      );
    }

    if (
      question.variable_kind === 'ESTADO' &&
      question.weight > 0 &&
      !question.scoreable &&
      !NORM_EXCEPTIONS.includes(question.id)
    ) {
      error(
        'UNSCOREABLE_ESTADO',
        'Ítem ESTADO con peso y escala sin mapa de puntaje, fuera de LAB-NORM-01',
        [question.id],
      );
    }
  }

  for (const row of raw.questionRows) {
    const weight = asNumber(row.Ponderación);
    if (row.Ponderación != null && row.Ponderación !== '' && weight == null) {
      error(
        'INVALID_WEIGHT',
        'Ponderación no numérica o negativa',
        [asString(row.ID_Pregunta)],
      );
    }
    if (weight != null && weight < 0) {
      error(
        'INVALID_WEIGHT',
        'Ponderación no numérica o negativa',
        [asString(row.ID_Pregunta)],
      );
    }

    const critica = asString(row.Crítica ?? row.Critica);
    if (critica === 'Sí' || critica === 'Si') {
      const missing: string[] = [];
      if (!asString(row.Severidad)) missing.push('Severidad');
      if (!asString(row.Acción_inmediata) && !asString(row['Accion_inmediata'])) {
        missing.push('Acción_inmediata');
      }
      if (
        !asString(row.Derivación_profesional) &&
        !asString(row['Derivacion_profesional'])
      ) {
        missing.push('Derivación_profesional');
      }
      if (missing.length) {
        error(
          'CRITICAL_INCOMPLETE',
          `Crítica = Sí sin ${missing.join(', ')}`,
          [asString(row.ID_Pregunta)],
        );
      }
      const severity = asString(row.Severidad);
      if (severity && severityCatalog.size && !severityCatalog.has(severity)) {
        error(
          'INVALID_SEVERITY',
          `Severidad fuera de catálogo: ${severity}`,
          [asString(row.ID_Pregunta)],
        );
      }
    }
  }

  const dimensionKeys = new Set(definition.dimensions.map((d) => d.key));
  const dimensionByKey = new Map(
    definition.dimensions.map((d) => [d.key, d]),
  );
  for (const alias of definition.alias_map) {
    if (!dimensionKeys.has(alias.to)) {
      error(
        'ALIAS_TARGET_MISSING',
        `Alias apunta a dimensión inexistente: ${alias.to}`,
        [alias.from],
      );
      continue;
    }
    const target = dimensionByKey.get(alias.to);
    const sourceDomain = ALIAS_DOMAIN_HINT[alias.from];
    if (target && sourceDomain && target.domain !== sourceDomain) {
      error(
        'ALIAS_CROSSES_DOMAINS',
        `Alias fusiona dimensiones de ámbitos distintos: ${alias.from}`,
        [alias.from],
      );
    }
  }

  const planIds = new Set(definition.plans.map((p) => p.id));
  const objectiveIds = new Set(definition.objectives.map((o) => o.id));
  const combo = new Set<string>();
  for (const plan of definition.plans) {
    if (stateCatalog.size && !stateCatalog.has(plan.state)) {
      error(
        'INVALID_PLAN_STATE',
        `Estado de plan fuera de catálogo: ${plan.state}`,
        [plan.id],
      );
    }
    const key = `${plan.domain}::${plan.state}`;
    if (combo.has(key)) {
      error(
        'DUPLICATE_PLAN_COMBO',
        'Combinación ámbito más estado duplicada',
        [plan.id],
      );
    }
    combo.add(key);
    for (const objectiveId of plan.objective_ids) {
      if (!objectiveIds.has(objectiveId)) {
        error('ORPHAN_OBJECTIVE_REF', `Plan apunta a objetivo huérfano`, [
          plan.id,
          objectiveId,
        ]);
      }
    }
  }

  for (const objective of definition.objectives) {
    if (!planIds.has(objective.plan_id)) {
      error('ORPHAN_OBJECTIVE', 'Objetivo sin plan', [objective.id]);
    }
    for (const activityId of objective.activity_ids) {
      if (!definition.activities.some((a) => a.id === activityId)) {
        error('ORPHAN_ACTIVITY_REF', 'Objetivo apunta a actividad huérfana', [
          objective.id,
          activityId,
        ]);
      }
    }
  }

  for (const activity of definition.activities) {
    if (!objectiveIds.has(activity.objective_id)) {
      error('ORPHAN_ACTIVITY', 'Actividad sin objetivo', [activity.id]);
    }
  }

  const interpretationIds = new Set(definition.interpretations.map((i) => i.id));
  for (const id of LAB_INTERPRETATION_IDS) {
    if (!interpretationIds.has(id)) {
      error(
        'MISSING_INTERPRETATION',
        `Interpretación referenciada por el motor ausente: ${id}`,
      );
    }
  }

  const weightedNonEstado = definition.questions.filter(
    (q) => q.variable_kind !== 'ESTADO' && q.weight > 0,
  );
  if (weightedNonEstado.length) {
    warning(
      'W1',
      'ítems no ESTADO con ponderación 1',
      weightedNonEstado.map((q) => q.id),
    );
  }

  const unresolved = definition.questions.filter(
    (q) => q.metric_key && !q.metric_key_resolved,
  );
  if (unresolved.length) {
    const keys = [...new Set(unresolved.map((q) => q.metric_key as string))];
    warning(
      'W2',
      `${keys.length} métricas referenciadas inexistentes, ${unresolved.length} preguntas afectadas`,
      keys,
    );
  }

  const unscoreableEstado = definition.questions.filter(
    (q) =>
      q.variable_kind === 'ESTADO' &&
      q.weight > 0 &&
      q.unscoreable_reason === 'SCALE_HAS_NO_SCORE_MAP',
  );
  if (unscoreableEstado.length) {
    warning(
      'W3',
      'ítem ESTADO sin regla de normalización',
      unscoreableEstado.map((q) => q.id),
    );
  }

  const singleItem = definition.dimensions.filter((dimension) => {
    const scoreable = definition.questions.filter(
      (q) => q.dimension === dimension.key && q.scoreable && q.active,
    );
    return scoreable.length === 1;
  });
  if (singleItem.length) {
    warning(
      'W4',
      'dimensiones con un solo ítem puntuable',
      singleItem.map((d) => d.key),
    );
  }

  const domainsWithoutPlans = definition.domains.filter((d) => !d.has_plans);
  if (domainsWithoutPlans.length) {
    warning(
      'W5',
      'ámbito sin planes en catálogo',
      domainsWithoutPlans.map((d) => d.key),
    );
  }

  const composite = definition.risks.filter(
    (risk) =>
      COMPOSITE_RISK_IDS.includes(risk.question_id) &&
      risk.qualitative_clause &&
      !risk.qualitative_structured,
  );
  if (composite.length) {
    warning(
      'W6',
      'condiciones de alerta con cláusula cualitativa',
      composite.map((r) => r.question_id),
    );
  }

  return issues;
}

const ALIAS_DOMAIN_HINT: Record<string, string> = {
  Autorregulación: 'MENTALIDAD',
  'Reciprocidad y comunidad': 'RELACIONES',
  'Inversión y valor': 'FINANZAS',
  Alimentación: 'CUERPO',
  'Seguridad y salud': 'CUERPO',
};
