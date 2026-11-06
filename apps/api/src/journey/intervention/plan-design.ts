import type { ContentTag } from '../../instrumentos/restrictions';
import { DECLARED_TAGS } from '../plan-gate';
import type { Pack, Template, TerritoryId } from './engine';

/** Shape of a plan under preparation. Catalog and own strategies produce the same contract. */
export const DESIGN_VERSION = 'diseno-plan@1';

export type ResultMode = 'RESULT' | 'EXPLORATION';
export type WorkPattern = 'HABIT' | 'STEPS' | 'DECISION' | 'CONVERSATION' | 'EXPLORE' | 'FREE';

export type DesignSchedule =
  | { kind: 'WEEKLY'; occasionsPerWeek: number; minutesPerOccasion: number }
  /** One occasion inside week `week` of the cycle. Week 1 is the activation week. */
  | { kind: 'ONCE'; week: number; minutesPerOccasion: number }
  /** Only for actions seeded by a catalog template that works by trigger. */
  | { kind: 'TRIGGER'; trigger: string; minutesPerOccasion: number };

export type DesignActionSource =
  | { kind: 'TEMPLATE'; templateId: string; usesMinimum: boolean }
  | { kind: 'PATTERN'; pattern: WorkPattern }
  | { kind: 'MEMBER' };

export type DesignAction = {
  key: string;
  title: string;
  doneWhen: string;
  cue: string | null;
  minimum: string | null;
  schedule: DesignSchedule;
  contentTags: ContentTag[];
  source: DesignActionSource;
  /** Objective revision this action was written or confirmed for. */
  basis: number;
};

export type DesignObstacle = { obstacle: string; response: string };

export type DesignStrategy =
  | { kind: 'CATALOG'; templateId: string; focusText: string | null; stageDefinition: string | null }
  | { kind: 'OWN'; pattern: WorkPattern; title: string; approach: string | null };

export type PlanDesign = {
  version: typeof DESIGN_VERSION;
  goal: string | null;
  contextReadingIds: string[];
  mode: ResultMode | null;
  objectiveRevision: number;
  strategy: DesignStrategy | null;
  actions: DesignAction[];
  obstacles: DesignObstacle[];
  resources: string | null;
  loadConfirmed: boolean;
  resultSaved: boolean;
  /** True once the member edited the action list. A strategy change then asks before replacing it. */
  actionsTouched: boolean;
};

export class DesignInputError extends Error {}

export const MAX_ACTIONS = 6;
export const MAX_OBSTACLES = 3;
export const MAX_WEEKLY_MINUTES = 1680;
export const DEMANDING_WEEKLY_MINUTES = 300;

export function weeklyLoadCapMessage(): string {
  const maxHours = MAX_WEEKLY_MINUTES / 60;
  return `El tiempo planificado supera el límite semanal permitido (${maxHours} horas). Reduce la frecuencia o duración de algunas acciones.`;
}

export const WORK_PATTERNS: { id: WorkPattern; label: string; description: string }[] = [
  { id: 'HABIT', label: 'Repetir algo cada semana', description: 'Para un hábito o una práctica. Eliges cuántas veces y una versión mínima para los días difíciles.' },
  { id: 'STEPS', label: 'Avanzar por pasos', description: 'Para un proyecto o un pendiente con varias partes. Cada paso tiene su semana y algo que lo muestra.' },
  { id: 'DECISION', label: 'Preparar una decisión', description: 'Para algo que vienes postergando. Ordenas qué falta, lo consigues y decides o fijas otra fecha.' },
  { id: 'CONVERSATION', label: 'Preparar una conversación', description: 'Para hablar algo importante con alguien. Primero lo escribes y después eliges cuándo decirlo.' },
  { id: 'EXPLORE', label: 'Explorar con pruebas pequeñas', description: 'Para cuando todavía no sabes qué resultado buscar. Pruebas algo y anotas qué aprendes.' },
  { id: 'FREE', label: 'Empezar desde cero', description: 'Escribes tus propias acciones.' },
];

/** Content marks the action editor offers in each territory. The server still runs the shared restriction rule. */
export const TERRITORY_MARKS: Record<TerritoryId, ContentTag[]> = {
  MENTALIDAD: [],
  FINANZAS: ['INVESTMENT', 'DEBT'],
  RELACIONES: ['CONFRONTATION'],
  SALUD_FISICA: ['PHYSICAL_EXERTION', 'DIET', 'SUPPLEMENT', 'MEDICATION'],
};

export const HEALTH_MARKS: ContentTag[] = ['PHYSICAL_EXERTION', 'DIET', 'SUPPLEMENT', 'MEDICATION'];

export function emptyDesign(input?: { goal?: string | null; contextReadingIds?: string[] }): PlanDesign {
  return {
    version: DESIGN_VERSION,
    goal: input?.goal ?? null,
    contextReadingIds: input?.contextReadingIds ?? [],
    mode: null,
    objectiveRevision: 1,
    strategy: null,
    actions: [],
    obstacles: [],
    resources: null,
    loadConfirmed: false,
    resultSaved: false,
    actionsTouched: false,
  };
}

export function parseDesign(raw: unknown): PlanDesign | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<PlanDesign>;
  if (row.version !== DESIGN_VERSION) return null;
  return {
    ...emptyDesign(),
    ...row,
    actions: Array.isArray(row.actions) ? row.actions : [],
    obstacles: Array.isArray(row.obstacles) ? row.obstacles : [],
    contextReadingIds: Array.isArray(row.contextReadingIds) ? row.contextReadingIds : [],
  } as PlanDesign;
}

function nextKeys(existing: DesignAction[], count: number): string[] {
  const used = existing.map((row) => Number.parseInt(row.key.replace(/^a/, ''), 10)).filter(Number.isFinite);
  let n = used.length ? Math.max(...used) : 0;
  return Array.from({ length: count }, () => `a${(n += 1)}`);
}

export function seedFromTemplate(template: Template, basis: number, existing: DesignAction[] = []): DesignAction[] {
  const [key] = nextKeys(existing, 1);
  const schedule: DesignSchedule = template.schedule.kind === 'TRIGGER'
    ? { kind: 'TRIGGER', trigger: template.schedule.trigger, minutesPerOccasion: template.schedule.minutesPerOccasion }
    : { kind: 'WEEKLY', occasionsPerWeek: template.schedule.occasionsPerWeek, minutesPerOccasion: template.schedule.minutesPerOccasion };
  return [{
    key: key!,
    title: template.action,
    doneWhen: template.doneWhen,
    cue: null,
    minimum: template.minimum.text,
    schedule,
    contentTags: [...((template.contentTags ?? []) as ContentTag[])],
    source: { kind: 'TEMPLATE', templateId: template.id, usesMinimum: false },
    basis,
  }];
}

type Seed = { title: string; doneWhen: string; schedule: DesignSchedule; contentTags?: ContentTag[] };

function patternSeeds(pattern: WorkPattern, horizonWeeks: number, territory: TerritoryId): Seed[] {
  const last = Math.max(1, horizonWeeks);
  const second = Math.min(2, last);
  if (pattern === 'HABIT') {
    return [{ title: '', doneWhen: 'Lo hice ese día, aunque fuera la versión mínima.', schedule: { kind: 'WEEKLY', occasionsPerWeek: 3, minutesPerOccasion: 15 } }];
  }
  if (pattern === 'STEPS') {
    return Array.from({ length: Math.min(3, last) }, (_, index) => ({
      title: '',
      doneWhen: 'El paso quedó terminado y hay algo que lo muestra.',
      schedule: { kind: 'ONCE', week: index + 1, minutesPerOccasion: 30 } as DesignSchedule,
    }));
  }
  if (pattern === 'DECISION') {
    return [
      { title: 'Anotar qué información me falta para decidir', doneWhen: 'Quedó escrito qué falta y dónde conseguirlo.', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 20 } },
      { title: 'Conseguir la información que falta', doneWhen: 'Tengo el dato, o sé que no se puede conseguir.', schedule: { kind: 'ONCE', week: second, minutesPerOccasion: 30 } },
      { title: 'Decidir, o fijar una nueva fecha para decidir', doneWhen: 'Decidí, o escribí por qué todavía no y cuándo vuelvo a mirarlo.', schedule: { kind: 'ONCE', week: last, minutesPerOccasion: 20 } },
    ];
  }
  if (pattern === 'CONVERSATION') {
    return [
      { title: 'Escribir qué quiero decir y qué quiero pedir', doneWhen: 'Quedó escrito en pocas líneas.', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 20 } },
      {
        title: 'Tener la conversación, o dejar fijada la fecha',
        doneWhen: 'La conversación ocurrió, o quedó una fecha acordada.',
        schedule: { kind: 'ONCE', week: second, minutesPerOccasion: 30 },
        contentTags: territory === 'RELACIONES' ? ['CONFRONTATION'] : [],
      },
    ];
  }
  if (pattern === 'EXPLORE') {
    return [
      { title: '', doneWhen: 'Hice la prueba y anoté qué observé.', schedule: { kind: 'ONCE', week: 1, minutesPerOccasion: 20 } },
      { title: 'Anotar qué aprendí y qué haría distinto', doneWhen: 'Quedó escrito qué aprendí.', schedule: { kind: 'ONCE', week: last, minutesPerOccasion: 10 } },
    ];
  }
  return [{ title: '', doneWhen: '', schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 15 } }];
}

export function seedFromPattern(
  pattern: WorkPattern,
  input: { horizonWeeks: number; territory: TerritoryId; basis: number; existing?: DesignAction[] },
): DesignAction[] {
  const seeds = patternSeeds(pattern, input.horizonWeeks, input.territory);
  const keys = nextKeys(input.existing ?? [], seeds.length);
  return seeds.map((seed, index) => ({
    key: keys[index]!,
    title: seed.title,
    doneWhen: seed.doneWhen,
    cue: null,
    minimum: null,
    schedule: seed.schedule,
    contentTags: seed.contentTags ?? [],
    source: { kind: 'PATTERN', pattern },
    basis: input.basis,
  }));
}

function text(value: unknown, max: number, label: string): string {
  if (value == null) return '';
  if (typeof value !== 'string') throw new DesignInputError(`${label} tiene que ser texto.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new DesignInputError(`${label} admite hasta ${max} caracteres.`);
  return trimmed;
}

function optionalText(value: unknown, max: number, label: string): string | null {
  return text(value, max, label) || null;
}

function integer(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new DesignInputError(`${label} tiene que ser un entero entre ${min} y ${max}.`);
  }
  return value;
}

function weeklyOccasions(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 21) {
    throw new DesignInputError('Ingresa un número entero entre 1 y 21 veces por semana.');
  }
  return value;
}

function minutesPerOccasionValue(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 600) {
    throw new DesignInputError('Ingresa una duración de 1 a 600 minutos por vez, sin decimales.');
  }
  return value;
}

function parseSchedule(raw: unknown, horizonWeeks: number, prior: DesignAction | undefined): DesignSchedule {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const minutesPerOccasion = minutesPerOccasionValue(row.minutesPerOccasion);
  if (row.kind === 'WEEKLY') {
    return { kind: 'WEEKLY', occasionsPerWeek: weeklyOccasions(row.occasionsPerWeek), minutesPerOccasion };
  }
  if (row.kind === 'ONCE') {
    return { kind: 'ONCE', week: integer(row.week, 'La semana', 1, horizonWeeks), minutesPerOccasion };
  }
  if (row.kind === 'TRIGGER' && prior?.schedule.kind === 'TRIGGER') {
    return { kind: 'TRIGGER', trigger: prior.schedule.trigger, minutesPerOccasion };
  }
  throw new DesignInputError('Elige si la acción se repite cada semana o se hace una vez.');
}

function sameContent(a: DesignAction, b: Omit<DesignAction, 'basis' | 'key' | 'source'>): boolean {
  return a.title === b.title
    && a.doneWhen === b.doneWhen
    && a.cue === b.cue
    && a.minimum === b.minimum
    && JSON.stringify(a.schedule) === JSON.stringify(b.schedule)
    && JSON.stringify([...a.contentTags].sort()) === JSON.stringify([...b.contentTags].sort());
}

/**
 * Validates the action list the member edited. Order is the order received.
 * Source and trigger come from the stored action with the same key; the client cannot forge them.
 */
export function parseDesignActions(
  raw: unknown,
  ctx: { horizonWeeks: number; basis: number; prior: DesignAction[]; acknowledge?: boolean },
): DesignAction[] {
  if (!Array.isArray(raw)) throw new DesignInputError('Las acciones tienen que ser una lista.');
  if (raw.length > MAX_ACTIONS) throw new DesignInputError(`Un plan admite hasta ${MAX_ACTIONS} acciones. Empieza con menos y suma después.`);
  const byKey = new Map(ctx.prior.map((row) => [row.key, row]));
  const seen = new Set<string>();
  const fresh = nextKeys(ctx.prior, raw.length);
  return raw.map((item, index) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const prior = typeof row.key === 'string' ? byKey.get(row.key) : undefined;
    const key = prior && !seen.has(prior.key) ? prior.key : fresh[index]!;
    seen.add(key);
    const tags = Array.isArray(row.contentTags) ? row.contentTags : [];
    for (const tag of tags) {
      if (typeof tag !== 'string' || !DECLARED_TAGS.includes(tag as ContentTag)) throw new DesignInputError('Marca de contenido desconocida.');
    }
    const usesMinimum = prior?.source.kind === 'TEMPLATE' ? row.usesMinimum === true : false;
    const content = {
      title: text(row.title, 180, 'La acción'),
      doneWhen: text(row.doneWhen, 500, 'Cuándo cuenta como hecha'),
      cue: optionalText(row.cue, 200, 'Cuándo y dónde'),
      minimum: optionalText(row.minimum, 500, 'La versión mínima'),
      schedule: parseSchedule(row.schedule, ctx.horizonWeeks, prior),
      contentTags: [...new Set(tags as ContentTag[])],
    };
    const source: DesignActionSource = prior?.source.kind === 'TEMPLATE'
      ? { ...prior.source, usesMinimum }
      : prior?.source ?? { kind: 'MEMBER' };
    const unchanged = prior ? sameContent(prior, content) : false;
    return {
      key,
      ...content,
      source,
      basis: ctx.acknowledge || !unchanged ? ctx.basis : prior!.basis,
    };
  });
}

export function parseObstacles(raw: unknown): DesignObstacle[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new DesignInputError('Los obstáculos tienen que ser una lista.');
  if (raw.length > MAX_OBSTACLES) throw new DesignInputError(`Anota hasta ${MAX_OBSTACLES} obstáculos.`);
  return raw
    .map((item) => {
      const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return { obstacle: text(row.obstacle, 300, 'El obstáculo'), response: text(row.response, 300, 'Lo que harás') };
    })
    .filter((row) => row.obstacle || row.response);
}

/** ONCE actions keep their place when the cycle gets shorter, at the last week that still exists. */
export function clampToHorizon(actions: DesignAction[], horizonWeeks: number): DesignAction[] {
  return actions.map((row) => (row.schedule.kind === 'ONCE' && row.schedule.week > horizonWeeks
    ? { ...row, schedule: { ...row.schedule, week: horizonWeeks } }
    : row));
}

export type DesignLoad = {
  byWeek: number[];
  maxWeekly: number;
  occasionsFirstWeek: number;
  demanding: boolean;
};

export function designLoad(actions: DesignAction[], horizonWeeks: number): DesignLoad {
  const weeks = Math.max(1, horizonWeeks);
  const byWeek = Array.from({ length: weeks }, (_, index) => actions.reduce((sum, row) => {
    if (row.schedule.kind === 'WEEKLY') return sum + row.schedule.occasionsPerWeek * row.schedule.minutesPerOccasion;
    if (row.schedule.kind === 'ONCE') return row.schedule.week === index + 1 ? sum + row.schedule.minutesPerOccasion : sum;
    return sum + row.schedule.minutesPerOccasion;
  }, 0));
  const occasionsFirstWeek = actions.reduce((sum, row) => {
    if (row.schedule.kind === 'WEEKLY') return sum + row.schedule.occasionsPerWeek;
    if (row.schedule.kind === 'ONCE') return row.schedule.week === 1 ? sum + 1 : sum;
    return sum;
  }, 0);
  const maxWeekly = Math.max(0, ...byWeek);
  return { byWeek, maxWeekly, occasionsFirstWeek, demanding: maxWeekly > DEMANDING_WEEKLY_MINUTES || actions.length > 3 };
}

export type DesignMissing = { step: 1 | 2 | 3 | 4; code: string; message: string; actionKey?: string };

export function designReadiness(input: {
  change: string;
  mode: ResultMode | null;
  soughtOutcome: string;
  criterion: string;
  design: PlanDesign;
  template: Template | null;
  protectNote: string | null;
  horizonWeeks: number;
}): DesignMissing[] {
  const missing: DesignMissing[] = [];
  const { design } = input;
  if (!input.change.trim()) missing.push({ step: 1, code: 'CHANGE', message: 'Escribe qué te gustaría cambiar.' });
  if (!design.resultSaved || !input.mode) {
    missing.push({ step: 2, code: 'RESULT_MODE', message: 'Elige si quieres conseguir un resultado o explorar primero.' });
  } else if (input.mode === 'RESULT') {
    if (!input.soughtOutcome.trim()) missing.push({ step: 2, code: 'RESULT', message: 'Describe qué resultado te gustaría alcanzar en este ciclo.' });
    if (!input.criterion.trim()) missing.push({ step: 2, code: 'CRITERION', message: 'Explica cómo sabrás que alcanzaste ese resultado.' });
  } else {
    if (!input.soughtOutcome.trim()) missing.push({ step: 2, code: 'EXPLORATION', message: 'Describe qué te gustaría explorar.' });
    if (!input.criterion.trim()) missing.push({ step: 2, code: 'LEARNING', message: 'Escribe qué te gustaría aprender al terminar el ciclo.' });
  }
  if (!design.strategy) {
    missing.push({ step: 3, code: 'STRATEGY', message: 'Elige una estrategia o crea la tuya.' });
  } else if (design.strategy.kind === 'CATALOG') {
    if (!input.template) missing.push({ step: 3, code: 'STRATEGY', message: 'Esta estrategia ya no está disponible. Elige otra para continuar.' });
    if (input.template?.focusPrompt && !design.strategy.focusText?.trim()) missing.push({ step: 3, code: 'FOCUS', message: input.template.focusPrompt });
    if (input.template?.stagePrompt && !design.strategy.stageDefinition?.trim()) missing.push({ step: 3, code: 'STAGE', message: input.template.stagePrompt });
  }
  if (!design.actions.length) missing.push({ step: 4, code: 'ACTIONS', message: 'Agrega al menos una acción a tu plan.' });
  for (const action of design.actions) {
    if (action.title.length < 3) missing.push({ step: 4, code: 'ACTION_TITLE', message: 'Hay una acción sin describir. Escribe qué vas a hacer.', actionKey: action.key });
    if (!action.doneWhen) {
      missing.push({ step: 4, code: 'ACTION_DONE', message: `Indica qué debe ocurrir para considerar hecha la acción «${action.title || 'la acción'}».`, actionKey: action.key });
    }
    if (action.schedule.kind === 'ONCE' && action.schedule.week > input.horizonWeeks) {
      missing.push({ step: 4, code: 'ACTION_WEEK', message: `La semana asignada a «${action.title || 'Una acción'}» está fuera de la duración del plan. Elige otra semana.`, actionKey: action.key });
    }
  }
  if (design.actions.length && designLoad(design.actions, input.horizonWeeks).maxWeekly > MAX_WEEKLY_MINUTES) {
    missing.push({ step: 4, code: 'LOAD_MAX', message: weeklyLoadCapMessage() });
  }
  if (design.actions.some((row) => row.basis < design.objectiveRevision)) {
    missing.push({ step: 4, code: 'STALE', message: 'Modificaste tu objetivo después de preparar las acciones. Revisa si todavía te sirven y confírmalo para continuar.' });
  }
  if (design.obstacles.some((row) => !row.obstacle || !row.response)) {
    missing.push({ step: 4, code: 'OBSTACLE', message: 'Describe el obstáculo y qué harás si aparece.' });
  }
  if (!input.protectNote?.trim()) missing.push({ step: 4, code: 'PROTECT', message: 'Indica qué necesitas cuidar o confirma que por ahora no hay nada que añadir.' });
  if (!design.loadConfirmed) missing.push({ step: 4, code: 'LOAD', message: 'Confirma que puedes dedicar el tiempo previsto a tu plan.' });
  return missing;
}

export function resumeStep(missing: DesignMissing[]): 1 | 2 | 3 | 4 | 5 {
  if (!missing.length) return 5;
  return Math.min(...missing.map((row) => row.step)) as 1 | 2 | 3 | 4;
}

export type Recommendation =
  | { kind: 'CATALOG'; templateId: string; reasons: string[]; priorUse: string | null }
  | { kind: 'OWN'; pattern: WorkPattern; reasons: string[]; priorUse: null };

export type Recommendations = { basis: 'PERSONAL' | 'NONE'; note: string | null; items: Recommendation[] };

/**
 * Deterministic and explainable. Each reason names the fact the person gave.
 * Order: readings the person chose to use, then the kind of change, then catalog order. Never severity.
 */
export function recommendStrategies(input: {
  pack: Pack;
  goal: string | null;
  readings: { id: string; interpretation: string; plans: string[] }[];
  mode: ResultMode | null;
  prior: { templateId: string; title: string }[];
}): Recommendations {
  const goalLabel = input.pack.goals.find((row) => row.id === input.goal)?.label ?? null;
  const scored = input.pack.templates.map((template, order) => {
    const reasons: string[] = [];
    let score = 0;
    for (const reading of input.readings) {
      if (reading.plans.includes(template.id)) {
        score += 2;
        reasons.push(`Parte de una lectura que reconociste: ${reading.interpretation}`);
      }
    }
    if (goalLabel && template.goal === input.goal) {
      score += 1;
      reasons.push(`Coincide con «${goalLabel}», el tipo de cambio que elegiste.`);
    }
    const prior = input.prior.find((row) => row.templateId === template.id);
    return { template, order, score, reasons, priorUse: prior ? `Ya la usaste en «${prior.title}».` : null };
  });
  const items: Recommendation[] = scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 3)
    .map((row) => ({ kind: 'CATALOG', templateId: row.template.id, reasons: row.reasons, priorUse: row.priorUse }));
  if (input.mode === 'EXPLORATION') {
    items.unshift({
      kind: 'OWN',
      pattern: 'EXPLORE',
      reasons: ['Elegiste explorar. Probar algo pequeño y anotar lo que observas sirve antes de fijar un resultado.'],
      priorUse: null,
    });
  }
  if (!items.length) {
    return {
      basis: 'NONE',
      note: 'Con lo que tenemos hasta ahora, no hay una estrategia que destaque. Puedes explorar el catálogo o crear la tuya.',
      items: [],
    };
  }
  return { basis: 'PERSONAL', note: null, items };
}

/** Plans built with an own strategy keep a template snapshot so review and history read the same contract. */
export function ownStrategySnapshot(input: {
  planId: string;
  packVersion: string;
  soughtOutcome: string;
  strategy: Extract<DesignStrategy, { kind: 'OWN' }>;
  actions: DesignAction[];
  horizonWeeks: number;
}): Template {
  const primary = input.actions[0]!;
  const weekly = primary.schedule.kind === 'WEEKLY' ? primary.schedule.occasionsPerWeek : 1;
  return {
    id: `OWN-${input.planId.slice(0, 8)}`,
    version: input.packVersion,
    group: 'OWN',
    goal: 'propio',
    title: input.strategy.title || 'Estrategia propia',
    seeks: input.soughtOutcome,
    action: primary.title,
    schedule: { kind: 'WEEKLY', occasionsPerWeek: weekly, minutesPerOccasion: primary.schedule.minutesPerOccasion },
    minimum: { text: primary.minimum ?? primary.title, occasionsPerWeek: 1, minutesPerOccasion: Math.min(5, primary.schedule.minutesPerOccasion) },
    doneWhen: primary.doneWhen,
    indicators: [],
    horizonWeeks: input.horizonWeeks,
    notes: input.strategy.approach ? [input.strategy.approach] : [],
  };
}

/** Compatibility load for review decisions that read the primary action. */
export function compatLoad(actions: DesignAction[], horizonWeeks: number) {
  const primary = actions[0]!;
  return {
    weeklyMinutes: designLoad(actions, horizonWeeks).maxWeekly,
    occasionsPerWeek: primary.schedule.kind === 'WEEKLY' ? primary.schedule.occasionsPerWeek : null,
    minutesPerOccasion: primary.schedule.minutesPerOccasion,
    confirmed: true,
  };
}
