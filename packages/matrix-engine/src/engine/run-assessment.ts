import { PLAN_DOMAINS } from '../constants';
import type {
  DimensionResult,
  DomainResult,
  MatrixDefinition,
  PolicyDefinition,
  PurposeSnapshot,
  ResponseInput,
  ResultSnapshot,
  TraceNode,
} from '../types';
import { ENGINE_SEMVER } from '../types';
import { computeCoverage, computeDimensionCoverage, gateDomainScore } from './coverage';
import { hashResponses, verifyDefinitionHash } from './hash';
import { normalizeItem } from './normalize';
import { selectPriority } from './priority';
import { buildRecommendations } from './recommend';
import { classifyResponses } from './responses';
import { itemWeightedDomainScore, scoreDimensions } from './score';
import { applyOverrides, evaluateSafety } from './safety';
import { assignState, distanceToBandEdge, storeScore } from './state';
import { node } from './trace';

export interface RunAssessmentInput {
  definition: MatrixDefinition;
  responses: ResponseInput[];
  policy: PolicyDefinition;
  engineSemver: string;
  now: string;
}

function usedInterpretations(ids: Set<string>, id: string): void {
  ids.add(id);
}

export function runAssessment(input: RunAssessmentInput): ResultSnapshot {
  verifyDefinitionHash(input.definition);
  const definition = input.definition;
  const { classified, invalidIds } = classifyResponses(
    definition,
    input.responses,
    input.policy,
  );
  const responsesHash = hashResponses(classified);
  const used = new Set<string>([
    'LAB-ALIAS-01',
    'LAB-NORM-01',
    'LAB-SCORE-01',
    'LAB-COV-01',
    'LAB-COV-02',
    'LAB-COV-03',
    'LAB-STATE-01',
    'LAB-PRIORITY-01',
    'LAB-PRIORITY-02',
    'LAB-PURPOSE-01',
    'LAB-GLOBAL-01',
    'LAB-RECO-01',
    'LAB-SAFETY-03',
  ]);
  if (input.policy.kind === 'BRANCHING' || input.policy.id === 'AUD_PLUS_BRANCHES-v1') {
    usedInterpretations(used, 'LAB-POLICY-01');
  }
  if (input.policy.id === 'AUD_PLUS_CORE-v1') {
    usedInterpretations(used, 'LAB-POLICY-02');
  }

  const safety = evaluateSafety(definition, classified);
  if (safety.evaluations.some((item) => item.condition_confirmed != null)) {
    usedInterpretations(used, 'LAB-SAFETY-01');
  }
  if (safety.evaluations.some((item) => item.fired && item.severity !== 'MEDIA')) {
    usedInterpretations(used, 'LAB-SAFETY-02');
    usedInterpretations(used, 'LAB-OVR-01');
  }
  if (
    safety.evaluations.some(
      (item) => item.override_applies && item.severity === 'CRITICA',
    )
  ) {
    usedInterpretations(used, 'LAB-OVR-02');
  }
  if (
    safety.evaluations.some(
      (item) => item.override_applies && item.severity === 'ALTA',
    )
  ) {
    usedInterpretations(used, 'LAB-OVR-03');
  }

  const dimensionScores = scoreDimensions(definition, classified);
  const scaleById = new Map(definition.scales.map((scale) => [scale.id, scale]));
  const byId = new Map(classified.map((response) => [response.questionId, response]));

  const dimensions: DimensionResult[] = definition.dimensions
    .filter((dimension) => (PLAN_DOMAINS as readonly string[]).includes(dimension.domain))
    .map((dimension) => {
      const scored = dimensionScores.find((item) => item.key === dimension.key);
      const coverage = computeDimensionCoverage(definition, classified, dimension.key);
      const score = scored?.score ?? null;
      return {
        key: dimension.key,
        domain: dimension.domain,
        score: score == null ? null : storeScore(score),
        score_display: score == null ? null : assignState(score, definition.state_bands).scoreDisplay,
        items_scored: scored?.items_scored ?? 0,
        items_scoreable: scored?.items_scoreable ?? coverage.scoreable_active,
        coverage: storeScore(coverage.coverage),
        inverse: dimension.inverse,
      };
    });

  const domainAggregation =
    definition.interpretations.find((item) => item.id === 'LAB-SCORE-01')?.params.domain_aggregation ===
    'ITEM_WEIGHTED'
      ? 'ITEM_WEIGHTED'
      : 'DIMENSION_EQUAL';

  const domains: DomainResult[] = PLAN_DOMAINS.map((key) => {
    const coverage = computeCoverage(definition, classified, key);
    const usedDims = dimensionScores.filter(
      (item) => item.domain === key && item.score != null,
    );
    const itemWeighted = itemWeightedDomainScore(definition, classified, key);
    const rawScore =
      domainAggregation === 'ITEM_WEIGHTED'
        ? itemWeighted
        : usedDims.length === 0
          ? null
          : usedDims.reduce((sum, item) => sum + (item.score as number), 0) / usedDims.length;
    const gated = gateDomainScore(rawScore, coverage.classification);
    const band =
      gated == null
        ? null
        : assignState(gated, definition.state_bands);
    const draft = {
      key,
      coverage_definition: storeScore(coverage.coverage_definition),
      coverage_served:
        coverage.coverage_served == null
          ? null
          : storeScore(coverage.coverage_served),
      classification: coverage.classification,
      score: gated == null ? null : storeScore(gated),
      score_display: band?.scoreDisplay ?? null,
      state_from_band: band?.state ?? null,
      distance_to_band_edge:
        band == null ? null : distanceToBandEdge(band.scoreDisplay),
      dimensions_used: usedDims.length,
      band_rule_id: band?.ruleId ?? null,
    };
    const overridden = applyOverrides(draft, safety.evaluations, definition.interpretations);
    return {
      key: draft.key,
      coverage_definition: draft.coverage_definition,
      coverage_served: draft.coverage_served,
      classification: draft.classification,
      score: overridden.score == null ? null : storeScore(overridden.score),
      score_display:
        overridden.score == null
          ? null
          : assignState(overridden.score, definition.state_bands).scoreDisplay,
      state_from_band: draft.state_from_band,
      state_final: overridden.state_final,
      state_source: overridden.state_source,
      state_rule_id: overridden.state_rule_id,
      distance_to_band_edge: draft.distance_to_band_edge,
      dimensions_used: draft.dimensions_used,
    };
  });

  const { priority, maintenance } = selectPriority(
    domains,
    safety.evaluations,
    definition.interpretations,
  );
  const recommendations = buildRecommendations(
    definition,
    domains,
    safety.evaluations,
    priority.domain,
    maintenance.domain,
  );

  const purposeDimensions = definition.dimensions.filter(
    (dimension) => dimension.domain === 'PROPÓSITO' || dimension.domain === 'PROPOSITO',
  );
  const purpose: PurposeSnapshot = {
    domain_score: null,
    not_applicable_reason: 'LAB-PURPOSE-01',
    stage: null,
    stage_reason: 'R-PUR-01..04 NOT_APPLICABLE',
    dimension_scores: purposeDimensions.map((dimension) => {
      const scored = dimensionScores.find((item) => item.key === dimension.key);
      const coverage = computeDimensionCoverage(definition, classified, dimension.key);
      const score = scored?.score ?? null;
      return {
        key: dimension.key,
        score: score == null ? null : storeScore(score),
        score_display: score == null ? null : assignState(score, definition.state_bands).scoreDisplay,
        coverage: storeScore(coverage.coverage),
      };
    }),
  };

  const classifiedDomains = domains.filter(
    (domain) => domain.classification !== 'NO_CLASIFICADO' && domain.score != null,
  );
  const globalAverage =
    classifiedDomains.length === 0
      ? null
      : storeScore(
          classifiedDomains.reduce((sum, domain) => sum + (domain.score as number), 0) /
            classifiedDomains.length,
        );

  const narrativeCompletion = purposeDimensions
    .map((dimension) => {
      const items = definition.questions.filter(
        (question) =>
          question.dimension === dimension.key &&
          question.active &&
          question.variable_kind === 'NARRATIVA',
      );
      if (items.length === 0) return null;
      const answered = items.filter(
        (question) => byId.get(question.id)?.status === 'ANSWERED',
      ).length;
      return {
        module: dimension.labels[0] ?? dimension.key,
        answered,
        total: items.length,
      };
    })
    .filter((item): item is { module: string; answered: number; total: number } => item != null);

  const validationNode = node('RESPONSE_VALIDATION', 'responses', {
    output: {
      served: classified.filter((item) => item.status !== 'NOT_SERVED_BY_POLICY').length,
      answered: classified.filter((item) => item.status === 'ANSWERED').length,
      skipped: classified.filter((item) => item.status === 'SKIPPED_BY_USER').length,
      invalid: invalidIds,
    },
    rule_id: 'R-SCORE-03',
    source: invalidIds.length ? 'DATA_GAP' : 'MATRIX',
    reason:
      invalidIds.length > 0
        ? `Respuestas invalidas: ${invalidIds.join(', ')}`
        : 'Respuestas clasificadas. Valor invalido no se corrige ni se aproxima.',
  });

  const safetyChildren: TraceNode[] = safety.evaluations.map((evaluation) => {
    const source =
      evaluation.status === 'NOT_EVALUATED'
        ? 'DATA_GAP'
        : evaluation.condition_confirmed
          ? 'LAB_INTERPRETATION_v0'
          : 'MATRIX';
    const ruleId =
      evaluation.status === 'NOT_EVALUATED'
        ? 'LAB-SAFETY-03'
        : evaluation.condition_confirmed
          ? 'LAB-SAFETY-01'
          : evaluation.question_id;
    let reason = `Riesgo ${evaluation.question_id} en ${evaluation.domain}.`;
    if (evaluation.status === 'NOT_EVALUATED') {
      reason = `${evaluation.question_id} no evaluado. Ausencia de dato no es ausencia de riesgo.`;
    } else if (evaluation.status === 'SUPPRESSED_BY_INPUT') {
      reason = `${evaluation.question_id}: clausula numerica cumplida y qualitative_confirmed falso. Queda registrada. Override no aplica.`;
    } else if (evaluation.fired) {
      reason = `${evaluation.question_id} dispara (${evaluation.condition_confirmed ?? 'FULL'}). Severidad ${evaluation.severity}.`;
    } else {
      reason = `${evaluation.question_id} evaluado. Clausula numerica no cumplida.`;
    }
    return node('SAFETY_EVAL', `safety:${evaluation.question_id}`, {
      inputs: [{ kind: 'question', id: evaluation.question_id }],
      output: evaluation,
      rule_id: ruleId,
      source,
      reason,
    });
  });

  const safetyNode = node('SAFETY_EVAL', 'safety', {
    output: safety.snapshot,
    rule_id: 'LAB-SAFETY-03',
    source: 'LAB_INTERPRETATION_v0',
    reason: `Cobertura de riesgo ${safety.snapshot.risk_coverage}. Incompleto: ${safety.snapshot.safety_incomplete}.`,
    children: safetyChildren,
  });

  const normalizeChildren: TraceNode[] = definition.questions
    .filter((question) => question.scoreable || question.id === 'D-CUE-07')
    .map((question) => {
      const response = byId.get(question.id);
      const normalized = response
        ? normalizeItem(question, scaleById.get(question.scale_id), response)
        : { score: null, reason: 'SKIPPED_BY_USER' };
      const gap = question.id === 'D-CUE-07' || normalized.reason === 'INVALID';
      return node('NORMALIZE_ITEM', `normalize:${question.id}`, {
        inputs: [{ kind: 'question', id: question.id }],
        output: {
          rawValue: response?.rawValue ?? null,
          score: normalized.score,
          reason: normalized.reason ?? null,
        },
        rule_id: question.inverse ? 'R-SCORE-02' : question.id === 'D-CUE-07' ? 'LAB-NORM-01' : 'R-SCORE-01',
        source: gap
          ? 'DATA_GAP'
          : question.inverse
            ? 'MATRIX'
            : 'MATRIX',
        reason:
          question.id === 'D-CUE-07'
            ? 'D-CUE-07 no tiene mapa de escala. Fuera de numerador y denominador.'
            : normalized.score == null
              ? `Sin puntaje (${normalized.reason ?? 'sin respuesta'}).`
              : `Valor ${String(response?.rawValue)} se normaliza a ${normalized.score}.`,
      });
    });

  const dimensionNodes: TraceNode[] = dimensions.map((dimension) =>
    node('DIMENSION_SCORE', `dimension:${dimension.key}`, {
      inputs: definition.questions
        .filter((question) => question.dimension === dimension.key && question.scoreable)
        .map((question) => ({ kind: 'question', id: question.id })),
      output: dimension,
      rule_id: 'R-SCORE-03',
      source: 'MATRIX',
      reason:
        dimension.score == null
          ? `${dimension.key} sin items puntuados. El score no es cero.`
          : `${dimension.key} media ponderada de ${dimension.items_scored} items.`,
    }),
  );

  const dimensionCoverageNodes: TraceNode[] = dimensions.map((dimension) =>
    node('DIMENSION_COVERAGE', `dimension_coverage:${dimension.key}`, {
      inputs: [{ kind: 'dimension', id: dimension.key }],
      output: { coverage: dimension.coverage },
      rule_id: 'LAB-COV-02',
      source: 'LAB_INTERPRETATION_v0',
      reason: `Cobertura de dimension ${dimension.key} expuesta. No bloquea clasificacion.`,
    }),
  );

  const domainNodes: TraceNode[] = domains.flatMap((domain) => {
    const itemWeighted = itemWeightedDomainScore(definition, classified, domain.key);
    const coverageNode = node('DOMAIN_COVERAGE', `coverage:${domain.key}`, {
      inputs: [{ kind: 'domain', id: domain.key }],
      output: {
        coverage_definition: domain.coverage_definition,
        coverage_served: domain.coverage_served,
        classification: domain.classification,
      },
      rule_id: 'R-MISS-01',
      source: 'MATRIX',
      reason: `${domain.key} cobertura de definicion ${domain.coverage_definition} (${domain.classification}). Denominador independiente de la politica.`,
    });
    const scoreNode = node('DOMAIN_SCORE', `domain_score:${domain.key}`, {
      inputs: dimensions
        .filter((item) => item.domain === domain.key)
        .map((item) => ({ kind: 'node', id: `dimension:${item.key}` })),
      output: {
        score: domain.score,
        aggregation: 'DIMENSION_EQUAL',
        counterfactual_item_weighted:
          itemWeighted == null ? null : storeScore(itemWeighted),
      },
      rule_id: 'LAB-SCORE-01',
      source: 'LAB_INTERPRETATION_v0',
      reason:
        domain.score == null
          ? `${domain.key} sin score de ambito.`
          : `${domain.key} media igual por dimension. Contrafactual por item: ${itemWeighted == null ? 'nulo' : storeScore(itemWeighted)}.`,
    });
    const stateNode = node('STATE_BAND', `state:${domain.key}`, {
      inputs: [{ kind: 'node', id: `domain_score:${domain.key}` }],
      output: {
        state_from_band: domain.state_from_band,
        score_display: domain.score_display,
        distance_to_band_edge: domain.distance_to_band_edge,
      },
      rule_id: domain.state_from_band
        ? definition.state_bands.find((band) => band.state === domain.state_from_band)?.rule_id ??
          'LAB-STATE-01'
        : 'R-MISS-01',
      source: domain.state_from_band ? 'MATRIX' : 'MATRIX',
      reason: domain.state_from_band
        ? `${domain.key} banda sobre score_display ${domain.score_display}: ${domain.state_from_band}.`
        : `${domain.key} sin estado por banda (NO_CLASIFICADO).`,
    });
    const overrideNode = node('OVERRIDE', `override:${domain.key}`, {
      inputs: [
        { kind: 'node', id: `state:${domain.key}` },
        { kind: 'node', id: 'safety' },
      ],
      output: {
        state_final: domain.state_final,
        state_source: domain.state_source,
        state_rule_id: domain.state_rule_id,
      },
      rule_id:
        domain.state_source === 'CAPPED_BY_R-OVR-02' ? 'R-OVR-02' : 'R-OVR-01',
      source: 'MATRIX',
      reason:
        domain.state_source === 'FORCED_BY_R-OVR-01'
          ? `${domain.key} forzado a CONTENCIÓN por R-OVR-01.`
          : domain.state_source === 'CAPPED_BY_R-OVR-02'
            ? `${domain.key} techo ESTABILIZACIÓN por R-OVR-02.`
            : `${domain.key} sin override de safety.`,
    });
    return [coverageNode, scoreNode, stateNode, overrideNode];
  });

  const purposeNode = node('DOMAIN_SCORE', 'purpose', {
    output: purpose,
    rule_id: 'LAB-PURPOSE-01',
    source: 'LAB_INTERPRETATION_v0',
    reason:
      'PROPÓSITO no tiene score de ambito, estado ni plan. Se reportan dimensiones. No entra a prioridad.',
    children: [
      node('DOMAIN_SCORE', 'purpose:not_applicable', {
        output: { rules: ['R-PUR-01', 'R-PUR-02', 'R-PUR-03', 'R-PUR-04'] },
        rule_id: 'R-PUR-01',
        source: 'NOT_APPLICABLE',
        reason: 'R-PUR no es ejecutable. Sin umbrales ni inputs operativos.',
      }),
    ],
  });

  const priorityNode = node('PRIORITY', 'priority', {
    output: { priority, maintenance },
    rule_id: 'LAB-PRIORITY-01',
    source: 'LAB_INTERPRETATION_v0',
    reason: priority.domain
      ? `Prioridad ${priority.domain} por ${priority.tier} bajo LAB-PRIORITY-01. ${priority.purpose_note}`
      : `Sin prioridad. ${priority.reason}. ${priority.purpose_note}`,
  });

  const recommendationNode = node('RECOMMENDATION', 'recommendation', {
    output: recommendations,
    rule_id: 'LAB-RECO-01',
    source: 'LAB_INTERPRETATION_v0',
    reason: recommendations.primary?.plan_id
      ? `Plan ${recommendations.primary.plan_id} por lookup de catalogo. Etiqueta MATRIX RECOMMENDATION.`
      : 'Sin plan principal.',
    children: [
      ...(recommendations.primary
        ? [
            node('RECOMMENDATION', 'recommendation:primary', {
              output: recommendations.primary,
              rule_id: 'LAB-RECO-01',
              source: 'LAB_INTERPRETATION_v0',
              reason: recommendations.primary.executable_recommendation === 'BLOCKED'
                ? `Recomendacion ejecutable bloqueada. ${recommendations.primary.blocked_reason}`
                : `Recomendacion principal ${recommendations.primary.plan_id}.`,
            }),
          ]
        : []),
      ...(recommendations.maintenance
        ? [
            node('RECOMMENDATION', 'recommendation:maintenance', {
              output: recommendations.maintenance,
              rule_id: 'LAB-PRIORITY-02',
              source: 'LAB_INTERPRETATION_v0',
              reason: `Mantenimiento ${recommendations.maintenance.domain}.`,
            }),
          ]
        : []),
    ],
  });

  const globalNode = node('GLOBAL', 'global', {
    output: {
      average: globalAverage,
      narrative_only: true,
      label: null,
    },
    rule_id: 'LAB-GLOBAL-01',
    source: 'LAB_INTERPRETATION_v0',
    reason: 'Promedio de ambitos clasificados. Solo narrativo. Sin etiqueta global.',
    children: [
      node('GLOBAL', 'global:label', {
        output: { label: null, rule: 'R-GLOB-02' },
        rule_id: 'R-GLOB-02',
        source: 'NOT_APPLICABLE',
        reason: 'R-GLOB-02 nombra etiquetas sin formula. No se implementa.',
      }),
    ],
  });

  const criticalDimensionsNode = node('DIMENSION_COVERAGE', 'critical_dimensions', {
    output: { critical_dimensions: 'NOT_APPLICABLE' },
    rule_id: 'LAB-COV-02',
    source: 'NOT_APPLICABLE',
    reason: 'No hay marcador de dimension critica en la matriz. La cobertura por dimension no bloquea.',
  });

  const trace: TraceNode = node('ROOT', 'root', {
    output: {
      definition_ref: definition.definition_ref,
      policy_id: input.policy.id,
    },
    rule_id: 'R-LOAD-01',
    source: 'MATRIX',
    reason: 'Pipeline de evaluacion v0.',
    children: [
      validationNode,
      safetyNode,
      ...normalizeChildren,
      ...dimensionNodes,
      ...dimensionCoverageNodes,
      criticalDimensionsNode,
      ...domainNodes,
      purposeNode,
      priorityNode,
      recommendationNode,
      globalNode,
    ],
  });

  return {
    definition_ref: definition.definition_ref,
    definition_sha256: definition.definition_sha256,
    source_sha256: definition.source.sha256,
    engine_semver: input.engineSemver || ENGINE_SEMVER,
    policy_id: input.policy.id,
    responses_hash: responsesHash,
    generated_at: input.now,
    safety: safety.snapshot,
    dimensions,
    domains,
    priority,
    maintenance,
    recommendations,
    purpose,
    global: {
      average: globalAverage,
      narrative_only: true,
      label: null,
      label_reason: 'R-GLOB-02 NOT_APPLICABLE',
    },
    data_gaps: {
      unscoreable_items: definition.questions
        .filter((question) => question.unscoreable_reason)
        .map((question) => ({
          question_id: question.id,
          reason: question.unscoreable_reason as string,
        })),
      invalid_responses: invalidIds,
      unresolved_metric_keys: definition.questions.filter(
        (question) => question.metric_key && !question.metric_key_resolved,
      ).length,
    },
    narrative_completion: narrativeCompletion,
    interpretations_used: [...used].sort((left, right) =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
    rules_not_executed: definition.not_executed,
    trace,
    engine_warnings: [],
  };
}
