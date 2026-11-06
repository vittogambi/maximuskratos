import type { HdrpFacts } from './hdrp-contract';
import { readSynthesis } from './purpose-synthesis';

export const EXPLORATION_DRAFT_VERSION = 1 as const;

export type ExplorationStep =
  | 'intro'
  | 'sources'
  | 'experience'
  | 'important'
  | 'contribution'
  | 'connection'
  | 'synthesis'
  | 'trial'
  | 'done';

export type SourceConfirmation = 'yes' | 'edit' | 'skip';

export type AltEntryKind = 'keep' | 'miss' | 'improve';

export type DirectionExplorationDraft = {
  version: typeof EXPLORATION_DRAFT_VERSION;
  updatedAt: string;
  step: ExplorationStep;
  altEntry?: AltEntryKind | null;
  experience?: string;
  whyImportant?: string;
  contribution?: string;
  connection?: string;
  connectionSuggested?: string;
  connectionRejected?: boolean;
  /** How the person answered the pair of answers MK put side by side. Absent means not answered yet. */
  recognition?: 'represents' | 'partial' | 'reword' | 'unseen' | null;
  partialNote?: string;
  /** True once the person's phrase was saved as a direction from this exploration. */
  directionPublished?: boolean;
  mattersOnItsOwn?: boolean;
  openDoubt?: string;
  questionSuggested?: string | null;
  questionAccepted?: string | null;
  trialSuggested?: string | null;
  trialAccepted?: string | null;
  observeSuggested?: string | null;
  observeAccepted?: string | null;
  returnWhen?: string;
  trialChoice?: 'accepted' | 'skipped' | null;
  trialFollowup?: 'tried' | 'not_tried' | 'adapted' | null;
  trialHappened?: string;
  trialKeep?: string;
  provisionalDirection?: string;
  synthesisEdit?: string;
  synthesisChoice?: 'accept' | 'edit' | 'continue' | null;
  trialWhat?: string;
  trialDiscover?: string;
  trialObserve?: string;
  sourceConfirmations?: Partial<Record<ConfirmableSourceId, SourceConfirmation>>;
  sourceEdits?: Partial<Record<ConfirmableSourceId, string>>;
};

export type ConfirmableSourceId = 'vision' | 'values' | 'ikigai' | 'heritage' | 'seal';

export type ConfirmableSource = {
  id: ConfirmableSourceId;
  label: string;
  origin: string;
  text: string;
};

/** One thing the person wrote or confirmed, shown as written. */
export type SharedItem = {
  id: string;
  label: string;
  text: string;
  origin: 'exploration' | 'source';
};

/** Two of the person's own answers placed side by side. MK does not claim they are related. */
export type ExplorationPair = {
  from: SharedItem;
  to: SharedItem;
  rule: string;
};

export type ExplorationSynthesis = {
  shared: SharedItem[];
  pair: ExplorationPair | null;
  ownConnection: string | null;
  insufficient: boolean;
  reason: 'NO_ANSWERS' | 'TOO_LITTLE' | 'REJECTED' | null;
};

const SOURCE_ORIGINS: Record<ConfirmableSourceId, string> = {
  vision: 'Tu respuesta sobre visión',
  values: 'Valores que compartiste',
  ikigai: 'Frase del cruce IKIGAI. No es un propósito confirmado.',
  heritage: 'Tu relato de origen',
  seal: 'Tu huella',
};

function trim(value: string | null | undefined): string {
  return (value ?? '').trim();
}

const PLACEHOLDER_WORDS = new Set([
  'asdf', 'asd', 'qwerty', 'qwer', 'zxcv', 'lorem', 'ipsum', 'test', 'testing', 'prueba', 'probando',
  'hola', 'ok', 'nada', 'algo', 'bla', 'blabla', 'xd', 'jaja', 'jajaja', 'aaa', 'xxx', 'na', 'no', 'si', 'sí',
]);

/**
 * Text that reads as filler or keyboard noise: no letters, one repeated character, keyboard runs,
 * words like «test» or «asdf», or letters with almost no vowels.
 * It only stops MK from putting the answer in a pair. The person can still write and save it.
 */
export function looksLikePlaceholder(text: string | null | undefined): boolean {
  const t = (text ?? '').trim().toLowerCase();
  if (!t) return true;
  const letters = t.replace(/[^a-záéíóúüñ]/g, '');
  if (letters.length < 2) return true;
  if (/^(.)\1+$/.test(letters)) return true;
  const words = t.split(/[^a-záéíóúüñ]+/).filter(Boolean);
  if (words.length && words.every((word) => PLACEHOLDER_WORDS.has(word) || /^(.)\1+$/.test(word))) return true;
  if (/^(asdf|qwer|zxcv|hjkl|sdfg|dfgh|fghj|ghjk|jklñ|wert|erty|rtyu|tyui|yuio|uiop)/.test(letters)) return true;
  const vowels = letters.replace(/[^aeiouáéíóúü]/g, '').length;
  if (letters.length >= 5 && vowels / letters.length < 0.2) return true;
  return false;
}

export function buildConfirmableSources(
  facts: HdrpFacts | null,
  purposeContent: unknown,
): ConfirmableSource[] {
  const synthesis = readSynthesis(purposeContent);
  const ikigaiEdited = trim(synthesis.purpose.edited);
  const ikigaiGenerated = trim(synthesis.purpose.generated);
  const rows: ConfirmableSource[] = [];
  const vision = trim(facts?.vision);
  if (vision) {
    rows.push({ id: 'vision', label: 'Visión', origin: SOURCE_ORIGINS.vision, text: vision });
  }
  const values = (facts?.values ?? []).map((v) => trim(v)).filter(Boolean);
  if (values.length > 0) {
    rows.push({
      id: 'values',
      label: 'Valores',
      origin: SOURCE_ORIGINS.values,
      text: values.slice(0, 5).join(', '),
    });
  }
  if (ikigaiEdited && !looksLikePlaceholder(ikigaiEdited)) {
    rows.push({ id: 'ikigai', label: 'Cruce IKIGAI', origin: 'Frase que escribiste al cruzar tus actividades', text: ikigaiEdited });
  } else if (ikigaiGenerated && !looksLikePlaceholder(ikigaiGenerated)) {
    rows.push({ id: 'ikigai', label: 'Cruce IKIGAI', origin: SOURCE_ORIGINS.ikigai, text: ikigaiGenerated });
  }
  const heritage = trim(facts?.heritage);
  if (heritage) {
    rows.push({ id: 'heritage', label: 'Origen', origin: SOURCE_ORIGINS.heritage, text: heritage });
  }
  const seal = trim(facts?.seal);
  if (seal) {
    rows.push({ id: 'seal', label: 'Huella', origin: SOURCE_ORIGINS.seal, text: seal });
  }
  return rows;
}

export function readExplorationDraft(content: unknown): DirectionExplorationDraft | null {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null;
  const raw = (content as Record<string, unknown>).directionExplorationDraft;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const draft = raw as Record<string, unknown>;
  if (draft.version !== EXPLORATION_DRAFT_VERSION) return null;
  const step = draft.step;
  if (
    step !== 'intro'
    && step !== 'sources'
    && step !== 'experience'
    && step !== 'important'
    && step !== 'contribution'
    && step !== 'connection'
    && step !== 'synthesis'
    && step !== 'trial'
    && step !== 'done'
  ) {
    return null;
  }
  return draft as DirectionExplorationDraft;
}

export function defaultExplorationDraft(): DirectionExplorationDraft {
  return {
    version: EXPLORATION_DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
    step: 'intro',
  };
}

export function mergeExplorationDraft(
  previous: DirectionExplorationDraft | null,
  patch: Partial<DirectionExplorationDraft>,
): DirectionExplorationDraft {
  const base = previous ?? defaultExplorationDraft();
  return {
    ...base,
    ...patch,
    version: EXPLORATION_DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

export function nextStepAfterSources(sources: ConfirmableSource[]): ExplorationStep {
  return sources.length > 0 ? 'sources' : 'experience';
}

const EXPERIENCE_LABEL: Record<AltEntryKind | 'moment', string> = {
  moment: 'Un momento que valió la pena',
  keep: 'Algo que quieres conservar',
  miss: 'Algo que echas de menos',
  improve: 'Algo que quieres mejorar',
};

/** What the person wrote in the exploration and the earlier answers they kept, in their own words. */
export function sharedItems(draft: DirectionExplorationDraft, sources: ConfirmableSource[] = []): SharedItem[] {
  const rows: SharedItem[] = [];
  const experience = trim(draft.experience);
  const important = trim(draft.whyImportant);
  const contribution = trim(draft.contribution);
  const connection = trim(draft.connection);
  if (experience) rows.push({ id: 'experience', label: EXPERIENCE_LABEL[draft.altEntry ?? 'moment'], text: experience, origin: 'exploration' });
  if (important) rows.push({ id: 'important', label: 'Lo que te importó', text: important, origin: 'exploration' });
  if (contribution) rows.push({ id: 'contribution', label: 'Lo que te gustaría aportar o cuidar', text: contribution, origin: 'exploration' });
  if (connection) rows.push({ id: 'connection', label: 'La relación que viste', text: connection, origin: 'exploration' });
  for (const source of sources) {
    const text = resolvedSourceText(source, draft);
    if (text) rows.push({ id: `source:${source.id}`, label: source.origin, text, origin: 'source' });
  }
  return rows;
}

/**
 * The only connection MK proposes: one answer about what mattered (or what was lived) next to the answer
 * about what the person wants to contribute. Both must have real content. MK does not say they are related.
 */
export function explorationPair(draft: DirectionExplorationDraft): ExplorationPair | null {
  const shared = sharedItems(draft);
  const contribution = shared.find((row) => row.id === 'contribution');
  if (!contribution || looksLikePlaceholder(contribution.text)) return null;
  const important = shared.find((row) => row.id === 'important');
  if (important && !looksLikePlaceholder(important.text)) {
    return {
      from: important,
      to: contribution,
      rule: 'Una respuesta dice qué te importó y la otra qué te gustaría aportar. Las ponemos juntas para que mires si tienen que ver. No sabemos si se relacionan.',
    };
  }
  const experience = shared.find((row) => row.id === 'experience');
  if (experience && !looksLikePlaceholder(experience.text)) {
    return {
      from: experience,
      to: contribution,
      rule: 'Una respuesta cuenta algo que viviste y la otra qué te gustaría aportar. Las ponemos juntas para que mires si tienen que ver. No sabemos si se relacionan.',
    };
  }
  return null;
}

export function buildExplorationSynthesis(
  draft: DirectionExplorationDraft,
  sources: ConfirmableSource[] = [],
): ExplorationSynthesis {
  const shared = sharedItems(draft, sources);
  const ownConnection = trim(draft.connection) || null;
  const pair = explorationPair(draft);
  if (ownConnection) {
    return { shared, pair, ownConnection, insufficient: false, reason: null };
  }
  if (draft.connectionRejected) {
    return { shared, pair, ownConnection: null, insufficient: true, reason: 'REJECTED' };
  }
  if (pair) {
    return { shared, pair, ownConnection: null, insufficient: false, reason: null };
  }
  const answered = shared.some((row) => row.origin === 'exploration');
  return { shared, pair: null, ownConnection: null, insufficient: true, reason: answered ? 'TOO_LITTLE' : 'NO_ANSWERS' };
}

export function resolvedSourceText(
  source: ConfirmableSource,
  draft: DirectionExplorationDraft,
): string | null {
  const choice = draft.sourceConfirmations?.[source.id];
  if (choice === 'skip') return null;
  if (choice === 'edit') {
    const edited = trim(draft.sourceEdits?.[source.id]);
    return edited || source.text;
  }
  if (choice === 'yes' || !choice) return source.text;
  return null;
}

export function sourcesPendingReview(sources: ConfirmableSource[], draft: DirectionExplorationDraft): boolean {
  return sources.some((row) => {
    const choice = draft.sourceConfirmations?.[row.id];
    return choice !== 'yes' && choice !== 'edit' && choice !== 'skip';
  });
}

export type LearningProposal = {
  recognized: string | null;
  lines: string[];
  question: string | null;
  contextual: string | null;
  trial: string | null;
  observe: string | null;
};

function isThin(text: string): boolean {
  const t = text.trim();
  if (t.length < 12) return true;
  return /^(asdf+|algo|no se|no sé|nada|test|x+)$/i.test(t);
}

export function storyLines(draft: DirectionExplorationDraft): string[] {
  const why = trim(draft.whyImportant);
  const experience = trim(draft.experience);
  const lines: string[] = [];
  if (why && !isThin(why)) lines.push(why);
  if (experience && !isThin(experience) && experience.toLowerCase() !== why.toLowerCase()) lines.push(experience);
  return lines.slice(0, 2);
}

/** The direction phrase the person wrote. Never a phrase MK composed. */
export function recognizedLine(draft: DirectionExplorationDraft): string | null {
  if (!draft.recognition) return null;
  const own = trim(draft.provisionalDirection) || trim(draft.synthesisEdit);
  return isThin(own) ? null : own;
}

/** Earlier answers and exploration lines a saved direction came from, frozen with that revision. */
export function directionSourcesFromDraft(
  draft: DirectionExplorationDraft,
  sources: ConfirmableSource[],
): { id: string; label: string; text: string }[] {
  return sharedItems(draft, sources).map(({ id, label, text }) => ({ id, label, text }));
}

export function suggestQuestion(recognized: string): string | null {
  const r = recognized.trim();
  if (isThin(r) || looksLikePlaceholder(r)) return null;
  if (/presente|sin apuro/i.test(r)) return '¿Qué me ayuda a estar presente, sin apuro?';
  if (/cuid|bienestar|obligaci|sin convertirlo|plan enorme/i.test(r)) {
    return '¿Qué forma pequeña de cuidarme me gustaría conservar?';
  }
  return null;
}

export function suggestTrial(recognized: string, experience: string): { trial: string; observe: string } | null {
  if (isThin(recognized) || looksLikePlaceholder(recognized)) return null;
  if (/presente|sin apuro/i.test(recognized)) {
    return {
      trial: 'Elegir un momento compartido y probar dejar el teléfono aparte, si te encaja.',
      observe: '¿Hubo algún momento en que te sentiste presente? ¿Qué ayudó o dificultó estar así?',
    };
  }
  if (/cuid|bienestar|obligaci|sin convertirlo|plan enorme/i.test(recognized)) {
    const choseWalk = /camin/i.test(recognized);
    return {
      trial: choseWalk
        ? 'Elegir una caminata corta que marques tú, si te encaja y no choca con un límite que ya tengas.'
        : 'Elegir una forma pequeña de cuidarte que ya te quepa, y probarla una vez. Tú decides cuál.',
      observe: '¿Cómo te sentiste y cómo encajó en tu día? ¿Querrías repetirlo o cambiar algo?',
    };
  }
  if (/camin/i.test(experience) && /cuid|bienestar/i.test(recognized)) {
    return {
      trial: 'Elegir una forma pequeña de cuidarte que ya te quepa, y probarla una vez. Tú decides cuál.',
      observe: '¿Cómo te sentiste y cómo encajó en tu día? ¿Querrías repetirlo o cambiar algo?',
    };
  }
  return null;
}

export function proposeLearning(draft: DirectionExplorationDraft): LearningProposal {
  const recognized = recognizedLine(draft);
  const doubt = trim(draft.openDoubt);
  const lines = storyLines(draft);
  if (draft.recognition === 'unseen' || !draft.recognition) {
    return {
      recognized: null,
      lines,
      question: null,
      contextual: null,
      trial: null,
      observe: null,
    };
  }
  if (!recognized && !doubt) {
    return {
      recognized: null,
      lines,
      question: null,
      contextual: '¿Qué parte de lo que contaste quieres comprender?',
      trial: null,
      observe: null,
    };
  }
  const basis = recognized;
  const question = doubt ? null : (basis ? suggestQuestion(basis) : null);
  const accepted = trim(draft.questionAccepted);
  const pack = accepted && !isThin(accepted) ? suggestTrial(basis || accepted, trim(draft.experience)) : null;
  const contextual = !doubt && !question ? '¿Qué parte de lo que contaste quieres comprender?' : null;
  return {
    recognized,
    lines,
    question,
    contextual,
    trial: pack?.trial ?? null,
    observe: pack?.observe ?? null,
  };
}

export function explorationProgressStep(step: ExplorationStep): number {
  const order: ExplorationStep[] = [
    'intro',
    'sources',
    'experience',
    'important',
    'contribution',
    'connection',
    'synthesis',
    'trial',
    'done',
  ];
  return order.indexOf(step) + 1;
}

export function explorationProgressTotal(hasSources: boolean): number {
  return hasSources ? 8 : 7;
}
