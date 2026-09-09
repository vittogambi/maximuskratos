import type {
  LabCatalog,
  LabComparison,
  LabExpectation,
  LabExperience,
  LabQuestion,
  LabResult,
  LabRunSummary,
} from '@/lib/lab-api';

export function runFixture(overrides: Partial<LabRunSummary> = {}): LabRunSummary {
  return {
    id: 'run-1',
    case_id: 'case-1',
    case_label: 'R01 · Ignacio',
    case_kind: 'SYNTHETIC',
    casebook_key: 'R01',
    expert_context:
      'Ignacio respondió las preguntas cerradas y dejó casi vacías las preguntas abiertas. Revisa sus respuestas antes de registrar tu lectura.',
    test_intent: 'Perfil completo con poca señal cualitativa',
    facilitator_note: null,
    pair: null,
    pair_side: null,
    blind: true,
    status: 'COLLECTING',
    policy_id: 'FULL-v1',
    definition_ref: 'matrix-v2.0@1',
    definition_sha256: 'abc123',
    engine_semver: '2.0.0',
    skipped_expectation: false,
    served: 187,
    answered: 102,
    skipped: 0,
    unanswered: 85,
    has_expectation: false,
    has_review: false,
    has_case_verdict: false,
    has_purpose: false,
    has_projection: false,
    has_product_review: false,
    matrix_review_complete: false,
    evidence: {
      domains: [
        {
          key: 'MENTALIDAD',
          answered: 24,
          scoreable: 24,
          coverage: 1,
          classification: 'INTERPRETABLE',
          evidence_state: 'Suficiente',
        },
        {
          key: 'RELACIONES',
          answered: 24,
          scoreable: 24,
          coverage: 1,
          classification: 'INTERPRETABLE',
          evidence_state: 'Suficiente',
        },
        {
          key: 'FINANZAS',
          answered: 24,
          scoreable: 24,
          coverage: 1,
          classification: 'INTERPRETABLE',
          evidence_state: 'Suficiente',
        },
        {
          key: 'CUERPO',
          answered: 27,
          scoreable: 27,
          coverage: 1,
          classification: 'INTERPRETABLE',
          evidence_state: 'Suficiente',
        },
      ],
      purpose: { answered: 3, total: 81 },
      total: { answered: 102, served: 187 },
      bands: { insufficient_below: 0.6, provisional_below: 0.8, rule_ids: [] },
    },
    frozen_at: null,
    revealed_at: null,
    ...overrides,
  };
}

export function questionsFixture(): LabQuestion[] {
  return [
    {
      id: 'AUD-MEN-01',
      text: '¿Con qué frecuencia logras mantener el foco en lo que decidiste que importa?',
      domain: 'MENTALIDAD',
      dimension: 'FOCO_PERSONAL',
      dimension_label: 'Foco personal',
      scale_id: 'LIKERT-5',
      scale_kind: 'LIKERT',
      weight: 1,
      active: true,
      scoreable: true,
      is_risk: false,
      status: 'ANSWERED',
      raw_value: 3,
      answer_label: 'A veces',
      answer_ordinal: '3 de 5',
      answer_scale_hint: 'Escala de 5 niveles',
      qualitative_confirmed: null,
      skipped: false,
    },
    {
      id: 'AUD-CUE-01',
      text: '¿Cómo describirías tu descanso durante la última semana?',
      domain: 'CUERPO',
      dimension: 'DESCANSO',
      dimension_label: 'Descanso',
      scale_id: 'LIKERT-5',
      scale_kind: 'LIKERT',
      weight: 1,
      active: true,
      scoreable: true,
      is_risk: false,
      status: 'UNANSWERED',
      raw_value: null,
      answer_label: null,
      answer_ordinal: null,
      answer_scale_hint: null,
      qualitative_confirmed: null,
      skipped: false,
    },
  ];
}

export function catalogFixture(): LabCatalog {
  return {
    definition_ref: 'matrix-v2.0@1',
    plans: [
      {
        id: 'MEN-EST',
        name: 'Instalar estructura personal',
        domain: 'MENTALIDAD',
        state: 'ESTABILIZACIÓN',
        duration_text: '8 a 10 semanas',
        objective_ids: ['MEN-EST-O1'],
      },
      {
        id: 'CUE-CON',
        name: 'Recuperar descanso básico',
        domain: 'CUERPO',
        state: 'CONTENCIÓN',
        duration_text: '6 semanas',
        objective_ids: [],
      },
    ],
    objectives: [
      {
        id: 'MEN-EST-O1',
        plan_id: 'MEN-EST',
        text: 'Sostener una rutina semanal de revisión',
        sequence: 1,
        horizon_weeks: 4,
      },
    ],
    dimension_labels: { FOCO_PERSONAL: 'Foco personal', DESCANSO: 'Descanso' },
  };
}

function domain(key: string, overrides: Partial<LabResult['snapshot']['domains'][number]> = {}) {
  return {
    key,
    coverage_definition: 1,
    coverage_served: 1,
    classification: 'INTERPRETABLE',
    score: 50,
    score_display: 50,
    state_from_band: 'ESTABILIZACIÓN',
    state_final: 'ESTABILIZACIÓN',
    state_source: 'BAND',
    state_rule_id: 'R-STATE-02',
    distance_to_band_edge: 5,
    dimensions_used: 5,
    ...overrides,
  };
}

/** R01 shape: four tied domains, priority decided by the fixed tie break. */
export function resultFixture(): LabResult {
  return {
    snapshot: {
      definition_ref: 'matrix-v2.0@1',
      definition_sha256: 'abc123',
      engine_semver: '2.0.0',
      policy_id: 'FULL-v1',
      responses_hash: 'hash1',
      generated_at: '2026-08-31T00:00:00.000Z',
      safety: {
        alerts: [],
        not_evaluated: [],
        risk_coverage: 1,
        safety_incomplete: false,
      },
      dimensions: [
        {
          key: 'FOCO_PERSONAL',
          domain: 'MENTALIDAD',
          score: 75,
          score_display: 75,
          items_scored: 4,
          items_scoreable: 4,
          coverage: 1,
          inverse: false,
        },
      ],
      domains: [
        domain('MENTALIDAD'),
        domain('RELACIONES'),
        domain('FINANZAS'),
        domain('CUERPO'),
        domain('PROPÓSITO', { classification: 'NO_CLASIFICADO', score: null, score_display: null, state_final: null }),
      ],
      priority: {
        domain: 'MENTALIDAD',
        tier: 'STATE',
        rule_id: 'LAB-PRIORITY-01',
        reason: null,
        candidates: [
          { domain: 'MENTALIDAD', tier: 'STATE', state: 'ESTABILIZACIÓN', score_display: 50, classified: true },
          { domain: 'CUERPO', tier: 'STATE', state: 'ESTABILIZACIÓN', score_display: 50, classified: true },
        ],
        criteria_not_evaluated: [{ criterion: 'deterioro', reason: 'requiere dos mediciones' }],
        purpose_note: 'PROPÓSITO no participa en la prioridad de v0.',
      },
      maintenance: { domain: 'CUERPO', rule_id: 'LAB-PRIORITY-02' },
      recommendations: {
        primary: {
          domain: 'MENTALIDAD',
          plan_id: 'MEN-EST',
          label: 'MATRIX RECOMMENDATION',
          objectives: ['MEN-EST-O1'],
          activities: [],
          executable_recommendation: 'ALLOWED',
          blocked_reason: null,
        },
      },
      purpose: {
        stage: null,
        stage_reason: 'La matriz no produce etapa de propósito en v2.',
        dimension_scores: [{ key: 'PUR-DIRECCION', score: 72 }],
      },
      interpretations_used: ['LAB-PRIORITY-01'],
      rules_not_executed: [],
    },
    catalog: {
      plans: catalogFixture().plans,
      objectives: catalogFixture().objectives,
      dimension_labels: catalogFixture().dimension_labels,
    },
    lab_reading: {
      counterfactual_item_weighted: { MENTALIDAD: 50, CUERPO: 46 },
      tie_break_order: ['MENTALIDAD', 'CUERPO', 'FINANZAS', 'RELACIONES'],
      coverage_bands: { insufficient_below: 0.6, provisional_below: 0.8, rule_ids: ['R-MISS-01'] },
      equal_dimension_weight: true,
      decisive_rules: [
        { label: 'Igual ponderación entre dimensiones', id: 'R-SCORE-03' },
        { label: 'Desempate fijo entre ámbitos prioritarios', id: 'LAB-PRIORITY-01' },
      ],
    },
  };
}

/** R10 shape: nothing reaches the coverage floor. */
export function insufficientResultFixture(): LabResult {
  const base = resultFixture();
  return {
    ...base,
    snapshot: {
      ...base.snapshot,
      domains: base.snapshot.domains.map((item) => ({
        ...item,
        classification: 'NO_CLASIFICADO',
        score: null,
        score_display: null,
        state_from_band: null,
        state_final: null,
        coverage_definition: 0.3,
      })),
      priority: {
        ...base.snapshot.priority,
        domain: null,
        tier: null,
        reason: 'INSUFFICIENT_COVERAGE',
        candidates: [],
      },
      maintenance: { domain: null, rule_id: 'LAB-PRIORITY-02' },
      recommendations: { primary: null },
    },
  };
}

/** R11 shape: critical alert blocks any executable recommendation. */
export function blockedResultFixture(): LabResult {
  const base = resultFixture();
  return {
    ...base,
    snapshot: {
      ...base.snapshot,
      safety: {
        alerts: [
          {
            question_id: 'RSK-CUE-03',
            domain: 'CUERPO',
            severity: 'CRITICA',
            fired: true,
            condition_confirmed: 'FULL',
            condition_text: 'condición registrada',
            immediate_action: 'derivar',
            referral: 'profesional',
            override_applied: 'R-OVR-01',
          },
        ],
        not_evaluated: [],
        risk_coverage: 1,
        safety_incomplete: false,
      },
      domains: base.snapshot.domains.map((item) =>
        item.key === 'CUERPO'
          ? { ...item, state_final: 'CONTENCIÓN', state_source: 'OVERRIDE' }
          : item,
      ),
      priority: { ...base.snapshot.priority, domain: 'CUERPO', tier: 'CRITICA', candidates: [
        { domain: 'CUERPO', tier: 'CRITICA', state: 'CONTENCIÓN', score_display: 50, classified: true },
        { domain: 'MENTALIDAD', tier: 'STATE', state: 'ESTABILIZACIÓN', score_display: 50, classified: true },
      ] },
      recommendations: {
        primary: {
          domain: 'CUERPO',
          plan_id: 'CUE-CON',
          label: 'MATRIX RECOMMENDATION',
          objectives: [],
          activities: [],
          executable_recommendation: 'BLOCKED',
          blocked_reason: 'alerta CRITICA activa en CUERPO (D-CUE-05)',
        },
      },
    },
  };
}

export function expectationFixture(overrides: Partial<LabExpectation> = {}): LabExpectation {
  return {
    expectedStates: {
      MENTALIDAD: 'CONSOLIDACIÓN',
      RELACIONES: 'ESTABILIZACIÓN',
      FINANZAS: 'ESTABILIZACIÓN',
      CUERPO: 'CONTENCIÓN',
    },
    expectedPriorityDomain: 'CUERPO',
    expectedPlanId: 'CUE-CON',
    expectedPurposeStage: 'HIPOTETICO',
    confidence: 'MEDIA',
    notes: null,
    openWhatIsHappening: 'Está sosteniendo mucho sin estructura.',
    openMainConcern: 'El descanso.',
    openFirstFocus: 'Cuerpo.',
    openFirstAction: 'Dormir a la misma hora.',
    personalFirstDomain: 'CUERPO',
    ...overrides,
  };
}

export function comparisonFixture(): LabComparison {
  return {
    expectation: expectationFixture(),
    comparison: {
      first_divergence: 'states',
      rows: [
        { key: 'alerts', result: 'MATCH', possible_consequence: false },
        { key: 'classification', result: 'MATCH', possible_consequence: false },
        { key: 'states', result: 'DIVERGENCE', possible_consequence: false },
        { key: 'priority', result: 'DIVERGENCE', possible_consequence: true },
        { key: 'plan', result: 'DIVERGENCE', possible_consequence: true },
        { key: 'purpose', result: 'MATRIX_SILENT', possible_consequence: false },
      ],
    },
  };
}

export function experienceFixture(overrides: {
  blocked?: boolean;
  awaiting?: boolean;
} = {}): LabExperience {
  const blocked = overrides.blocked ?? false;
  const awaiting = overrides.awaiting ?? false;
  return {
    projection: {
      direction: {
        statement: awaiting ? null : 'Construir autonomía sin desaparecer de casa.',
        display: awaiting ? 'Todavía está en construcción.' : 'Construir autonomía sin desaparecer de casa.',
        missing: awaiting,
        source: 'RAFA_JUDGMENT',
      },
      profile: {
        domains: [
          { key: 'MENTALIDAD', score_display: 50, state: 'ESTABILIZACIÓN', classification: 'INTERPRETABLE' },
          { key: 'CUERPO', score_display: 50, state: 'ESTABILIZACIÓN', classification: 'INTERPRETABLE' },
        ],
      },
      purpose: {
        matrix_note: 'La matriz no produce etapa de propósito en v2.',
        rafa_stage: 'HIPOTETICO',
        dimension_scores_lab_only: [{ key: 'PUR-DIRECCION', score: 72 }],
      },
      focus: {
        matrix_candidate: 'MENTALIDAD',
        matrix_candidate_reason: null,
        selected_focus: awaiting ? null : 'CUERPO',
        selection_source: awaiting ? null : 'RAFA_JUDGMENT',
        selection_reason: awaiting ? null : 'El descanso condiciona todo lo demás.',
        awaiting_selection: awaiting,
        tie_break_provisional: true,
      },
      route: {
        kind: awaiting ? null : 'MATRIX_PLAN',
        matrix_plan_id: awaiting ? null : 'CUE-CON',
        product_route_id: null,
        title: awaiting ? null : 'CUE-CON',
        duration_text: null,
        source: awaiting ? null : 'CATALOG',
        needs_curation: false,
      },
      objective: {
        available: awaiting ? [] : [{ id: 'MEN-EST-O1', source: 'CATALOG' }],
        selected_id: awaiting ? null : 'MEN-EST-O1',
        source: awaiting ? null : 'USER_CHOICE',
        needs_human_curation: false,
      },
      action: {
        text: blocked ? null : 'Apagar pantallas a las once.',
        source: 'USER_CHOICE',
        executable: !blocked,
      },
      cycle: { start: '2026-08-25', end: '2026-09-24', billing_cadence: 'MONTHLY' },
      restrictions: blocked ? ['SAFETY_BLOCKED'] : [],
      safety: { blocked, reasons: blocked ? ['RSK-CUE-03 CRITICA'] : [] },
    },
    user_view: {
      direction: awaiting ? 'Todavía está en construcción.' : 'Construir autonomía sin desaparecer de casa.',
      cycle: { label: 'Ciclo 1, 25 ago 2026 a 24 sep 2026' },
      focus: awaiting
        ? 'Matrix sugiere Mentalidad como candidato. Falta tu confirmación.'
        : 'El foco de este ciclo es Cuerpo.',
      why_now: blocked
        ? 'Hay una alerta que impide una acción ejecutable. La dirección puede seguir visible.'
        : 'El descanso condiciona todo lo demás.',
      objective: 'MEN-EST-O1',
      this_week: blocked
        ? 'No hay acción ejecutable mientras la alerta crítica siga activa.'
        : 'Apagar pantallas a las once.',
      map: [
        { key: 'Mentalidad', state: 'ESTABILIZACIÓN' },
        { key: 'Cuerpo', state: 'ESTABILIZACIÓN' },
      ],
    },
  };
}

const CUE_DIMS = [
  { key: 'CUE.seguridad_y_restricciones', label: 'Seguridad y restricciones', score: 0 },
  { key: 'CUE.sueno_y_recuperacion', label: 'Sueño y recuperación', score: 52 },
  { key: 'CUE.energia_y_vitalidad', label: 'Energía y vitalidad', score: 52 },
  { key: 'CUE.autoimagen_y_relacion_corporal', label: 'Autoimagen', score: 52 },
];

export function r04WhyResultFixture(): LabResult {
  const base = resultFixture();
  return {
    ...base,
    catalog: {
      ...base.catalog,
      dimension_labels: {
        ...base.catalog.dimension_labels,
        'CUE.seguridad_y_restricciones': 'Seguridad y restricciones',
      },
    },
    snapshot: {
      ...base.snapshot,
      domains: base.snapshot.domains.map((item) =>
        item.key === 'CUERPO'
          ? {
              ...item,
              score: 39.29,
              score_display: 39,
              state_from_band: 'CONTENCIÓN',
              state_final: 'CONTENCIÓN',
              classification: 'INTERPRETABLE',
              coverage_definition: 1,
              distance_to_band_edge: 0,
            }
          : item,
      ),
      priority: {
        ...base.snapshot.priority,
        domain: 'CUERPO',
        tier: 'STATE',
        reason: 'estado y puntaje',
        candidates: [
          { domain: 'CUERPO', tier: 'STATE', state: 'CONTENCIÓN', score_display: 39, classified: true },
          { domain: 'MENTALIDAD', tier: 'STATE', state: 'CONSOLIDACIÓN', score_display: 75, classified: true },
        ],
      },
      recommendations: {
        primary: {
          domain: 'CUERPO',
          plan_id: 'CUE-CON',
          label: 'MATRIX RECOMMENDATION',
          objectives: [],
          activities: [],
          executable_recommendation: 'ALLOWED',
          blocked_reason: null,
        },
      },
    },
    lab_reading: {
      ...base.lab_reading,
      counterfactual_item_weighted: { ...base.lab_reading.counterfactual_item_weighted, CUERPO: 46.4286 },
      thresholds: { CUERPO: { score: 40, state: 'ESTABILIZACIÓN', distance: 1 } },
      state_bands: [
        { rule_id: 'R-STATE-01', min: 0, max: 39, state: 'CONTENCIÓN' },
        { rule_id: 'R-STATE-02', min: 40, max: 59, state: 'ESTABILIZACIÓN' },
        { rule_id: 'R-STATE-03', min: 60, max: 79, state: 'CONSOLIDACIÓN' },
        { rule_id: 'R-STATE-04', min: 80, max: 100, state: 'EXPANSIÓN' },
      ],
      composition: {
        CUERPO: CUE_DIMS.map((item) => ({
          key: item.key,
          label: item.label,
          score: item.score,
          items_scoreable: 6,
          items_scored: 6,
          weight: 0.25,
          contribution: item.score * 0.25,
        })),
      },
      domain_formula: {
        CUERPO: {
          dimension_scores: CUE_DIMS.map((item) => item.score),
          method: 'DIMENSION_EQUAL',
          result: 39.29,
          display: 39,
        },
      },
      item_trace: [
        {
          question_id: 'AUD-CUE-01',
          text: '¿Con qué frecuencia evitas situaciones que te exigen físicamente?',
          domain: 'CUERPO',
          dimension: 'CUE.seguridad_y_restricciones',
          dimension_label: 'Seguridad y restricciones',
          raw_value: 1,
          answer_label: 'Nunca',
          answer_ordinal: '1 de 5',
          scoreable: true,
          normalized_score: 0,
          normalize_rule_id: 'R-SCORE-01',
          excluded_reason: null,
          weight: 1,
          dimension_items_scored: 6,
          dimension_items_scoreable: 6,
          share_in_dimension: 1 / 6,
          contribution_to_dimension: 0,
          dimension_score: 0,
          dimension_weight_in_domain: 0.25,
          contribution_to_domain: 0,
          domain_score: 39.29,
          domain_score_display: 39,
          domain_state_from_band: 'CONTENCIÓN',
          domain_state_final: 'CONTENCIÓN',
          domain_state_source: 'BAND',
          is_risk: false,
          alert_fired: false,
        },
      ],
    },
  };
}

export function r11WhyResultFixture(): LabResult {
  const base = r04WhyResultFixture();
  return {
    ...base,
    snapshot: {
      ...base.snapshot,
      safety: {
        alerts: [
          {
            question_id: 'D-CUE-05',
            domain: 'CUERPO',
            severity: 'CRITICA',
            fired: true,
            condition_confirmed: 'FULL',
            condition_text: 'Respuesta Sí',
            immediate_action: 'Suspender recomendaciones',
            referral: 'Atención médica',
            override_applied: 'R-OVR-01',
          },
        ],
        not_evaluated: [],
        risk_coverage: 1,
        safety_incomplete: false,
      },
      domains: base.snapshot.domains.map((item) =>
        item.key === 'CUERPO'
          ? { ...item, score: 100, score_display: 100, state_from_band: 'EXPANSIÓN', state_final: 'CONTENCIÓN', state_source: 'OVERRIDE' }
          : item,
      ),
      recommendations: {
        primary: {
          domain: 'CUERPO',
          plan_id: 'CUE-CON',
          label: 'MATRIX RECOMMENDATION',
          objectives: [],
          activities: [],
          executable_recommendation: 'BLOCKED',
          blocked_reason: 'alerta CRITICA activa en CUERPO (D-CUE-05)',
        },
      },
    },
  };
}
