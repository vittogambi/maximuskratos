import { describe, expect, it } from 'vitest';
import {
  buildResult,
  classifyEvidence,
  emptyDraft,
  hashDefinition,
  hashResult,
  loadDefinition,
  normalizeDraft,
  validateDefinition,
  validateDraft,
  validateForCompletion,
  deriveTensions,
  ENGINE_VERSION,
} from '../src/index';
import type { IkigaiDefinition, IkigaiDraft, IkigaiItem } from '../src/types';

const definition = loadDefinition();

function item(id: string, text: string, evidence: string | null, order: number): IkigaiItem {
  return { id, text, evidence, order };
}

function baseDraft(): IkigaiDraft {
  const draft = emptyDraft();
  draft.items.PASION = [
    item('p1', 'enseñar', 'SOSTENIDO', 0),
    item('p2', 'escribir', 'ATRACCION', 1),
  ];
  draft.items.CAPACIDAD = [
    item('c1', 'explicar sistemas', 'RESULTADOS', 0),
    item('c2', 'organizar', 'EXPERIENCIA', 1),
  ];
  draft.items.NECESIDAD = [
    item('n1', 'aprendizaje', 'VIVIDA', 0),
    item('n2', 'soledad', 'OBSERVADA', 1),
  ];
  draft.items.VALOR = [
    item('v1', 'consultoría', 'SOSTUVO_A_MI', 0),
    item('v2', 'formación', 'NO_PROBADO', 1),
  ];
  return draft;
}

describe('ikigai-v0.1 definition', () => {
  it('is valid without placeholders', () => {
    expect(validateDefinition(definition)).toEqual([]);
    expect(definition.status).toBe('DRAFT');
    expect(JSON.stringify(definition)).not.toMatch(/TODO_RAFA|FIXME|purpose_score/);
  });

  it('pins Matrix texts for the six criteria', () => {
    expect(definition.criteria.map((c) => c.text)).toEqual([
      'Esta hipótesis utiliza actividades que podría sostener durante años.',
      'Existe evidencia de que puede desarrollar o ejecutar las capacidades requeridas.',
      'Resuelve una necesidad concreta de personas o comunidades.',
      'Puede generar una forma ética y realista de sustento o intercambio.',
      'Es coherente con sus valores, responsabilidades y límites.',
      'Puede probarse con los recursos disponibles en los próximos noventa días.',
    ]);
  });
});

describe('classifyEvidence', () => {
  it('splits comprobado vs intuición', () => {
    expect(classifyEvidence('SOSTENIDO')).toBe('backed');
    expect(classifyEvidence('OCASIONAL')).toBe('backed');
    expect(classifyEvidence('SENALES')).toBe('backed');
    expect(classifyEvidence('ATRACCION')).toBe('intuition');
    expect(classifyEvidence('INTUICION')).toBe('intuition');
    expect(classifyEvidence('INDIRECTA')).toBe('intuition');
    expect(classifyEvidence('NO_PROBADO')).toBe('intuition');
    expect(classifyEvidence('DESCONOCIDO')).toBe('intuition');
    expect(classifyEvidence(null)).toBe('unmarked');
  });
});

describe('validateForCompletion', () => {
  it('allows a hypothesis that does not cover every field', () => {
    const draft = baseDraft();
    draft.hypotheses = [
      {
        id: 'h1',
        text: 'Una dirección que quiero explorar es enseñar con sistemas.',
        itemIds: ['p1', 'c1'],
        criteria: {
          DISFRUTE_SOSTENIBLE: 4,
          CAPACIDAD_DEMOSTRABLE: 4,
          UTILIDAD_REAL: 3,
          VALOR_ECONOMICO: 3,
          COHERENCIA_MORAL: 5,
          FACTIBILIDAD: 4,
        },
        order: 0,
      },
    ];
    expect(validateForCompletion(definition, draft)).toEqual({ ok: true });
  });

  it('allows noHypothesisYet', () => {
    const draft = baseDraft();
    draft.noHypothesisYet = true;
    expect(validateForCompletion(definition, draft)).toEqual({ ok: true });
  });

  it('allows a single item per field when the lens is answered', () => {
    const draft = baseDraft();
    draft.items.PASION = [item('p1', 'enseñar', 'SOSTENIDO', 0)];
    draft.hypotheses = [
      {
        id: 'h1',
        text: 'Una dirección que quiero explorar es enseñar con sistemas.',
        itemIds: ['p1', 'c1'],
        criteria: {
          DISFRUTE_SOSTENIBLE: 4,
          CAPACIDAD_DEMOSTRABLE: 4,
          UTILIDAD_REAL: 3,
          VALOR_ECONOMICO: 3,
          COHERENCIA_MORAL: 5,
          FACTIBILIDAD: 4,
        },
        order: 0,
      },
    ];
    expect(validateForCompletion(definition, draft)).toEqual({ ok: true });
  });

  it('allows UNCLEAR lenses without inventing items', () => {
    const draft = emptyDraft();
    draft.fieldClarity = {
      PASION: 'UNCLEAR',
      CAPACIDAD: 'UNCLEAR',
      NECESIDAD: 'UNCLEAR',
      VALOR: 'UNCLEAR',
    };
    draft.noHypothesisYet = true;
    expect(validateForCompletion(definition, draft)).toEqual({ ok: true });
  });

  it('requires fieldClarity before completion', () => {
    const draft = emptyDraft();
    const check = validateForCompletion(definition, draft);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.step).toBe('PASION');
  });

  it('only requires six criteria on the selected hypothesis', () => {
    const draft = baseDraft();
    draft.hypotheses = [
      {
        id: 'h1',
        text: 'Ayudar a personas que están empezando a dominar herramientas complejas.',
        itemIds: ['p1', 'c1', 'n1'],
        criteria: {
          DISFRUTE_SOSTENIBLE: 4,
          CAPACIDAD_DEMOSTRABLE: 4,
          UTILIDAD_REAL: 3,
          VALOR_ECONOMICO: null,
          COHERENCIA_MORAL: 5,
          FACTIBILIDAD: 4,
        },
        order: 0,
      },
      {
        id: 'h2',
        text: 'Construir un producto que ordene el trabajo de equipos chicos.',
        itemIds: ['p2', 'c2', 'v1'],
        criteria: {},
        order: 1,
      },
    ];
    draft.selectedHypothesisId = 'h1';
    expect(validateForCompletion(definition, draft)).toEqual({ ok: true });
  });

  it('rejects more than three hypotheses', () => {
    const draft = baseDraft();
    draft.hypotheses = [1, 2, 3, 4].map((n) => ({
      id: `h${n}`,
      text: 'Una dirección escrita con suficientes palabras.',
      itemIds: ['p1'],
      criteria: {},
      order: n,
    }));
    expect(validateDraft(definition, draft)).toContain('more than 3 hypotheses');
  });
});

describe('normalizeDraft', () => {
  it('infers ANSWERED from existing items and never invents UNCLEAR', () => {
    const raw = {
      items: {
        PASION: [item('p1', 'enseñar', 'SOSTENIDO', 0)],
        CAPACIDAD: [],
        NECESIDAD: [],
        VALOR: [],
      },
      hypotheses: [],
      noHypothesisYet: false,
    };
    const draft = normalizeDraft(raw);
    expect(draft.fieldClarity.PASION).toBe('ANSWERED');
    expect(draft.fieldClarity.CAPACIDAD).toBeNull();
    expect(draft.selectedHypothesisId).toBeNull();
    expect(draft.items.PASION[0].evidence).toBe('SOSTENIDO');
  });

  it('keeps an explicit UNCLEAR lens without creating a fake item', () => {
    const draft = normalizeDraft({
      items: emptyDraft().items,
      fieldClarity: { ...emptyDraft().fieldClarity, VALOR: 'UNCLEAR' },
    });
    expect(draft.fieldClarity.VALOR).toBe('UNCLEAR');
    expect(draft.items.VALOR).toEqual([]);
  });
});

describe('result presentation fields', () => {
  it('exposes selected hypothesis without an aggregate score', () => {
    const draft = baseDraft();
    draft.hypotheses = [
      {
        id: 'h1',
        text: 'Una dirección que quiero explorar es enseñar con sistemas.',
        itemIds: ['p1', 'c1'],
        criteria: {
          DISFRUTE_SOSTENIBLE: 4,
          CAPACIDAD_DEMOSTRABLE: 4,
          UTILIDAD_REAL: 3,
          VALOR_ECONOMICO: 3,
          COHERENCIA_MORAL: 5,
          FACTIBILIDAD: 4,
        },
        order: 0,
      },
    ];
    const result = buildResult(definition, draft, '2026-01-01T00:00:00.000Z');
    expect(result.selectedHypothesisId).toBe('h1');
    expect(result.fieldClarity.PASION).toBe('ANSWERED');
    expect(result).not.toHaveProperty('purpose_score');
    expect(JSON.stringify(result)).not.toMatch(/purpose_score/);
  });
});

describe('rules', () => {
  it('fires each enabled tension', () => {
    const draft = emptyDraft();
    draft.items.PASION = [item('p1', 'mismo', 'ATRACCION', 0), item('p2', 'x', 'ATRACCION', 1)];
    draft.items.CAPACIDAD = [item('c1', 'mismo', 'INTUICION', 0), item('c2', 'y', 'INTUICION', 1)];
    draft.items.NECESIDAD = [item('n1', 'mismo', 'INDIRECTA', 0), item('n2', 'z', 'INTUICION', 1)];
    draft.items.VALOR = [item('v1', 'pago', 'NO_PROBADO', 0), item('v2', 'otro', null, 1)];
    draft.hypotheses = [
      {
        id: 'h1',
        text: 'Una dirección débil sin unir campos distintos aquí.',
        itemIds: ['p1'],
        criteria: {
          DISFRUTE_SOSTENIBLE: 2,
          CAPACIDAD_DEMOSTRABLE: 1,
          UTILIDAD_REAL: null,
          VALOR_ECONOMICO: 3,
          COHERENCIA_MORAL: 1,
          FACTIBILIDAD: 4,
        },
        order: 0,
      },
    ];
    const tensions = deriveTensions(definition, draft);
    const ids = tensions.map((t) => t.ruleId);
    expect(ids).toContain('T_FIELD_THIN');
    expect(ids).toContain('T_HYP_GAP');
    expect(ids).toContain('T_ALL_UNLINKED');
    expect(ids).toContain('T_SAME_TEXT_ALL_FIELDS');
    expect(ids).toContain('T_HYP_CRITERION_LOW');
    expect(ids).toContain('T_FIELD_INTUITION_ONLY');
    expect(ids).toContain('T_HYP_WEAK_EVIDENCE');
    expect(ids).toContain('T_HYP_MORAL_CONFLICT');
    expect(ids).not.toContain('T_ENJOY_NOT_SUSTAINED');
    expect(ids).not.toContain('T_SKILL_NO_ENJOY');
    expect(ids.some((id) => id.startsWith('NX_'))).toBe(false);

    const moral = tensions.find((t) => t.ruleId === 'T_HYP_MORAL_CONFLICT');
    expect(moral?.text).toBe(
      'Marcaste que esta hipótesis no parece coherente con tus valores, responsabilidades o límites. Antes de avanzar, vale la pena entender dónde está el conflicto.',
    );
  });

  it('fires T_FIELD_EMPTY and T_NO_HYPOTHESIS', () => {
    const draft = baseDraft();
    draft.items.PASION = [];
    draft.noHypothesisYet = true;
    const ids = deriveTensions(definition, draft).map((t) => t.ruleId);
    expect(ids).toContain('T_FIELD_EMPTY');
    expect(ids).toContain('T_NO_HYPOTHESIS');
  });

  it('does not fire disabled rules even when conditions match', () => {
    const draft = baseDraft();
    draft.hypotheses = [
      {
        id: 'h1',
        text: 'Una dirección que une escribir con consultoría por ahora.',
        itemIds: ['p2', 'c1', 'v1'],
        criteria: {
          DISFRUTE_SOSTENIBLE: 1,
          CAPACIDAD_DEMOSTRABLE: 5,
          UTILIDAD_REAL: 4,
          VALOR_ECONOMICO: 4,
          COHERENCIA_MORAL: 4,
          FACTIBILIDAD: 4,
        },
        order: 0,
      },
    ];
    const ids = deriveTensions(definition, draft).map((t) => t.ruleId);
    expect(ids).not.toContain('T_ENJOY_NOT_SUSTAINED');
    expect(ids).not.toContain('T_SKILL_NO_ENJOY');
  });

  it('fires disabled rules only if the definition enables them', () => {
    const clone: IkigaiDefinition = {
      ...definition,
      rules: definition.rules.map((rule) =>
        rule.id === 'T_ENJOY_NOT_SUSTAINED' || rule.id === 'T_SKILL_NO_ENJOY'
          ? { ...rule, enabled: true }
          : rule,
      ),
    };
    const draft = baseDraft();
    draft.hypotheses = [
      {
        id: 'h1',
        text: 'Una dirección que une escribir con consultoría por ahora.',
        itemIds: ['p2', 'c1', 'v2'],
        criteria: {
          DISFRUTE_SOSTENIBLE: 1,
          CAPACIDAD_DEMOSTRABLE: 5,
          UTILIDAD_REAL: 4,
          VALOR_ECONOMICO: 4,
          COHERENCIA_MORAL: 4,
          FACTIBILIDAD: 4,
        },
        order: 0,
      },
    ];
    const ids = deriveTensions(clone, draft).map((t) => t.ruleId);
    expect(ids).toContain('T_ENJOY_NOT_SUSTAINED');
    expect(ids).toContain('T_SKILL_NO_ENJOY');
  });
});

describe('buildResult', () => {
  it('is deterministic and has no scores', () => {
    const draft = baseDraft();
    draft.hypotheses = [
      {
        id: 'h1',
        text: 'Una dirección que quiero explorar es enseñar con sistemas.',
        itemIds: ['p1', 'c1', 'n1', 'v1'],
        criteria: {
          DISFRUTE_SOSTENIBLE: 4,
          CAPACIDAD_DEMOSTRABLE: 5,
          UTILIDAD_REAL: 4,
          VALOR_ECONOMICO: 3,
          COHERENCIA_MORAL: 5,
          FACTIBILIDAD: null,
        },
        order: 0,
      },
    ];
    const a = buildResult(definition, draft, '2026-01-01T00:00:00.000Z');
    const b = buildResult(definition, draft, '2026-09-05T00:00:00.000Z');
    expect(hashResult(a)).toBe(hashResult(b));
    expect(hashResult(a)).toBe(hashResult(JSON.parse(JSON.stringify(a))));
    const dumped = JSON.stringify(a);
    expect(dumped).not.toMatch(/purpose_score/);
    expect(dumped).not.toMatch(/%/);
    expect(a).not.toHaveProperty('score');
    expect(a).not.toHaveProperty('total');
    expect(a.openQuestions.some((q) => q.includes('Factibilidad'))).toBe(true);
    expect(a.engineVersion).toBe(ENGINE_VERSION);
  });

  it('stable definition hash', () => {
    expect(hashDefinition(definition)).toBe(hashDefinition(loadDefinition()));
    expect(hashDefinition(definition)).toMatch(/^[a-f0-9]{64}$/);
  });
});
