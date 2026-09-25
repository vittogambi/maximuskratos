import type {
  FieldClarity,
  FieldClarityMap,
  IkigaiCriterionKey,
  IkigaiDefinition,
  IkigaiDraft,
  IkigaiFieldKey,
  IkigaiHypothesis,
  IkigaiItem,
  IkigaiResult,
} from '@/lib/ikigai-api';
import { EMPTY_AREAS_LEAD, THIN_AREAS_LEAD } from '@/lib/ikigai-ui/copy';

export function newItemId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `i-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const COVERAGE_LABELS = {
  PASION: 'Lo que amas',
  CAPACIDAD: 'En lo que eres bueno',
  NECESIDAD: 'Lo que el mundo necesita',
  VALOR: 'Por lo que te pueden pagar',
} as const;

/** Chrome only. Same four marks as the public /ikigai page. */
export const LENS_ICONS = {
  PASION: 'heart',
  CAPACIDAD: 'medal',
  NECESIDAD: 'world',
  VALOR: 'coins',
} as const;

export function fieldTitle(definition: IkigaiDefinition | null | undefined, key: IkigaiFieldKey): string {
  return definition?.fields.find((row) => row.key === key)?.title ?? COVERAGE_LABELS[key];
}

export const FIELD_STEPS = ['PASION', 'CAPACIDAD', 'NECESIDAD', 'VALOR'] as const;
export const CRITERION_KEYS = [
  'DISFRUTE_SOSTENIBLE',
  'CAPACIDAD_DEMOSTRABLE',
  'UTILIDAD_REAL',
  'VALOR_ECONOMICO',
  'COHERENCIA_MORAL',
  'FACTIBILIDAD',
] as const;

export function emptyFieldClarity(): FieldClarityMap {
  return {
    PASION: null,
    CAPACIDAD: null,
    NECESIDAD: null,
    VALOR: null,
  };
}

export function emptyUiDraft(): IkigaiDraft {
  return {
    items: {
      PASION: [],
      CAPACIDAD: [],
      NECESIDAD: [],
      VALOR: [],
    },
    patternNote: null,
    hypotheses: [],
    noHypothesisYet: false,
    nextExperiment: null,
    fieldClarity: emptyFieldClarity(),
    selectedHypothesisId: null,
  };
}

export function filledItems(items: IkigaiItem[]) {
  return items.filter((item) => item.text.trim().length >= 3);
}

export function filledCount(items: IkigaiItem[]) {
  return filledItems(items).length;
}

export function compactItems(items: IkigaiItem[]) {
  return filledItems(items)
    .slice(0, 5)
    .map((item, order) => ({ ...item, text: item.text.trim(), order }));
}

function isClarity(value: unknown): value is Exclude<FieldClarity, null> {
  return value === 'ANSWERED' || value === 'UNCLEAR';
}

export function inferFieldClarity(draft: IkigaiDraft): FieldClarityMap {
  const next = emptyFieldClarity();
  for (const key of FIELD_STEPS) {
    const hasItems = filledCount(draft.items[key] ?? []) > 0;
    const raw = draft.fieldClarity?.[key];
    if (hasItems) next[key] = 'ANSWERED';
    else if (isClarity(raw)) next[key] = raw;
    else next[key] = null;
  }
  return next;
}

export function compactDraft(draft: IkigaiDraft): IkigaiDraft {
  const items = {
    PASION: compactItems(draft.items.PASION ?? []),
    CAPACIDAD: compactItems(draft.items.CAPACIDAD ?? []),
    NECESIDAD: compactItems(draft.items.NECESIDAD ?? []),
    VALOR: compactItems(draft.items.VALOR ?? []),
  };
  const hypotheses = draft.hypotheses ?? [];
  const selected = draft.selectedHypothesisId ?? null;
  return {
    ...emptyUiDraft(),
    ...draft,
    items,
    hypotheses,
    fieldClarity: inferFieldClarity({ ...draft, items }),
    selectedHypothesisId: selected,
  };
}

export const HYPOTHESIS_MAX = 400;

export function validHypotheses(draft: IkigaiDraft) {
  return draft.hypotheses.filter(
    (h) => h.text.trim().length >= 12 && h.text.length <= HYPOTHESIS_MAX && h.itemIds.length >= 1,
  );
}

export function hypothesesReady(draft: IkigaiDraft) {
  if (draft.noHypothesisYet) return true;
  return validHypotheses(draft).length >= 1;
}

export function resolveSelectedHypothesisId(draft: IkigaiDraft): string | null {
  const id = draft.selectedHypothesisId;
  return id && draft.hypotheses.some((hypothesis) => hypothesis.id === id) ? id : null;
}

export function contrastReady(draft: IkigaiDraft) {
  if (draft.noHypothesisYet) return draft.hypotheses.length === 0;
  const selectedId = resolveSelectedHypothesisId(draft);
  const selected = draft.hypotheses.find((h) => h.id === selectedId);
  if (!selected) return false;
  return CRITERION_KEYS.every((key) => Object.prototype.hasOwnProperty.call(selected.criteria, key));
}

export function coverageOf(
  hyp: Pick<IkigaiHypothesis, 'itemIds'>,
  draft: IkigaiDraft,
): Record<IkigaiFieldKey, boolean> {
  const map = new Map<string, IkigaiFieldKey>();
  for (const key of Object.keys(draft.items) as IkigaiFieldKey[]) {
    for (const item of filledItems(draft.items[key])) map.set(item.id, key);
  }
  const out: Record<IkigaiFieldKey, boolean> = {
    PASION: false,
    CAPACIDAD: false,
    NECESIDAD: false,
    VALOR: false,
  };
  for (const id of hyp.itemIds) {
    const field = map.get(id);
    if (field) out[field] = true;
  }
  return out;
}

export type ContrastScreen = {
  hypId: string;
  hypIndex: number;
  hypCount: number;
  hypText: string;
  criterionKey: IkigaiCriterionKey;
  criterionIndex: number;
};

export function contrastScreens(draft: IkigaiDraft): ContrastScreen[] {
  const selectedId = resolveSelectedHypothesisId(draft);
  const hyp = draft.hypotheses.find((h) => h.id === selectedId);
  if (!hyp) return [];
  return CRITERION_KEYS.map((criterionKey, criterionIndex) => ({
    hypId: hyp.id,
    hypIndex: 0,
    hypCount: 1,
    hypText: hyp.text,
    criterionKey,
    criterionIndex,
  }));
}

export function selectableByField(draft: IkigaiDraft) {
  return {
    PASION: filledItems(draft.items.PASION ?? []),
    CAPACIDAD: filledItems(draft.items.CAPACIDAD ?? []),
    NECESIDAD: filledItems(draft.items.NECESIDAD ?? []),
    VALOR: filledItems(draft.items.VALOR ?? []),
  };
}

export function missingLensCopy(
  covered: Record<IkigaiFieldKey, boolean>,
  definition?: IkigaiDefinition | null,
): string | null {
  const present = FIELD_STEPS.filter((key) => covered[key]).map((key) =>
    fieldTitle(definition, key).toLowerCase(),
  );
  const missing = FIELD_STEPS.filter((key) => !covered[key]);
  if (present.length === 0 || missing.length === 0) return null;
  const joined =
    present.length === 1
      ? present[0]
      : `${present.slice(0, -1).join(', ')} y ${present[present.length - 1]}`;
  const last = missing[missing.length - 1];
  const open =
    last === 'VALOR'
      ? 'por lo que te pueden pagar'
      : last === 'PASION'
        ? 'lo que amas'
        : last === 'CAPACIDAD'
          ? 'en lo que eres bueno'
          : 'lo que el mundo necesita';
  if (missing.length === 1) {
    return `Esta dirección ya conecta ${joined}. Todavía no está claro ${open}.`;
  }
  return `Esta dirección ya conecta ${joined}. Todavía no están claros algunos círculos.`;
}

export type CriterionBand = 'solid' | 'uncertain' | 'needs' | 'unknown';

export function criterionBand(value: 1 | 2 | 3 | 4 | 5 | null | undefined): CriterionBand {
  if (value === 4 || value === 5) return 'solid';
  if (value === 3) return 'uncertain';
  if (value === 1 || value === 2) return 'needs';
  return 'unknown';
}

export const BAND_LABELS: Record<CriterionBand, string> = {
  solid: 'Parece sólido por ahora',
  uncertain: 'Todavía es incierto',
  needs: 'Necesita contraste',
  unknown: 'No lo sabemos todavía',
};

/** Display-only. Canonical copy stays in the definition. */
export function speakOfDirection(text: string): string {
  return text
    .replace(/en la hipótesis \d+/gi, (chunk) =>
      chunk.startsWith('E') ? 'En esta dirección' : 'en esta dirección',
    )
    .replace(/la hipótesis \d+/gi, (chunk) =>
      chunk.startsWith('L') ? 'Esta dirección' : 'esta dirección',
    )
    .replace(/Esta hipótesis/g, 'Esta dirección')
    .replace(/esta hipótesis/g, 'esta dirección')
    .replace(/ninguna hipótesis/g, 'ninguna dirección');
}

export function discoveryNotes(result: IkigaiResult): string[] {
  const selected =
    result.hypotheses.find((hyp) => hyp.id === result.selectedHypothesisId) ?? result.hypotheses[0];
  if (!selected) return [];
  const notes: string[] = [];
  for (const criterion of selected.criteria) {
    if (criterion.value === null || criterion.value === undefined) {
      if (criterion.key === 'FACTIBILIDAD') {
        notes.push('No respondiste si podrías probarla con tus recursos actuales.');
      } else {
        notes.push(`No respondiste ${criterion.label.toLowerCase()}.`);
      }
    }
  }
  return notes;
}

export type SignalBlock =
  | { kind: 'areas'; lead: string; titles: string[] }
  | { kind: 'note'; key: string; text: string };

/** Presentation only. Groups repeated engine gaps; leaves distinct signals intact. */
export function clusterSignals(
  tensions: IkigaiResult['tensions'],
  definition: IkigaiDefinition,
): SignalBlock[] {
  const empty: IkigaiResult['tensions'] = [];
  const thin: typeof empty = [];
  const rest: typeof empty = [];
  for (const tension of tensions) {
    if (tension.ruleId === 'T_FIELD_EMPTY') empty.push(tension);
    else if (tension.ruleId === 'T_FIELD_THIN') thin.push(tension);
    else rest.push(tension);
  }

  const blocks: SignalBlock[] = [];

  function pushGroup(rows: IkigaiResult['tensions'], lead: string) {
    if (rows.length === 0) return;
    if (rows.length > 1 && rows.every((row) => row.fieldKey)) {
      blocks.push({
        kind: 'areas',
        lead,
        titles: rows.map((row) => fieldTitle(definition, row.fieldKey!)),
      });
      return;
    }
    for (const row of rows) {
      blocks.push({
        kind: 'note',
        key: `${row.ruleId}-${row.fieldKey ?? ''}-${row.hypothesisId ?? ''}`,
        text: speakOfDirection(row.text),
      });
    }
  }

  pushGroup(empty, EMPTY_AREAS_LEAD);
  pushGroup(thin, THIN_AREAS_LEAD);
  for (const row of rest) {
    blocks.push({
      kind: 'note',
      key: `${row.ruleId}-${row.fieldKey ?? ''}-${row.hypothesisId ?? ''}`,
      text: speakOfDirection(row.text),
    });
  }
  return blocks;
}
