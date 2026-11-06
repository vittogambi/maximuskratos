import { bindPack, type Instrument, type Pack, type SourceRead as EngineSourceRead } from './engine';

/** Beta product rules. Not the approved MK method and not reviewed by Rafa. */
export const INTERVENTION_VERSION = 'intervencion-mentalidad@0.1';

export type SourceId = {
  instrument: 'E-AUD-001' | 'E-PER-000';
  row: number;
  sourceRef: string;
  catalogVersion: string | null;
  revision: number;
};

type ScaleSpec = { row: number; question: string; labelsRepairedIn?: number };
type DifficultySpec = { row: number; code: string; statement: string };

/** 1 is the difficulty and 5 the resource in every catalog version. R8 and R19 showed generic labels before @6. */
const SCALES: Record<string, ScaleSpec> = {
  R6: { row: 6, question: '¿Mis decisiones diarias reflejan al hombre que digo que quiero llegar a ser?' },
  R7: { row: 7, question: 'Cuando siento presión o una emoción intensa, ¿puedo reconocer lo que siento y elegir una respuesta coherente con mis principios?' },
  R8: { row: 8, question: '¿Qué tan seguido uso excusas que suenan razonables, pero no lo son?', labelsRepairedIn: 6 },
  R9: { row: 9, question: '¿Confío en mí mismo para terminar lo que empiezo?' },
  R19: { row: 19, question: '¿Con qué frecuencia utilizo comida, alcohol, sexo, compras, pantallas o entretenimiento para evitar emociones, conversaciones o responsabilidades?', labelsRepairedIn: 6 },
  R20: { row: 20, question: '¿Mis hábitos me están haciendo avanzar con claridad o drenando mi energía?' },
  R26: { row: 26, question: '¿Planifico mi semana o, en su mayoría, solo reacciono a ella?' },
  R27: { row: 27, question: '¿Mi entorno está configurado para apoyar la disciplina o la comodidad?' },
  R29: { row: 29, question: 'Cuando me desvío del rumbo, ¿qué tan rápido corrijo el curso?' },
  R30: { row: 30, question: 'Si siguiera viviendo de esta manera durante un año más, ¿me sentiría orgulloso del lugar al que me lleva?' },
};

const DIFFICULTIES: Record<string, DifficultySpec> = {
  PR4: { row: 98, code: 'PR4', statement: 'Abandono los proyectos o metas justo cuando estoy a punto de consolidarlos.' },
  PR5: { row: 99, code: 'PR5', statement: 'Siempre encuentro una distracción de última hora que me aleja de mis tareas clave.' },
  ER3: { row: 109, code: 'ER3', statement: 'Prefiero explotar en silencio antes que mostrar incomodidad ante los demás.' },
  D1: { row: 133, code: 'D1', statement: 'Justifico mi falta de acción diciendo que «no tengo tiempo» debido a mis obligaciones actuales.' },
  D2: { row: 134, code: 'D2', statement: 'Pospongo decisiones importantes esperando de forma indefinida el «momento perfecto».' },
  D3: { row: 135, code: 'D3', statement: 'Lleno mi agenda de tareas operativas secundarias para no enfrentar lo que realmente importa.' },
  D4: { row: 137, code: 'D4', statement: 'Creo firmemente que necesito otra certificación, maestría o más dinero antes de empezar.' },
  D6: { row: 139, code: 'D6', statement: 'Siento que mis ideas no son lo suficientemente innovadoras y por eso no las ejecuto.' },
  IN3: { row: 148, code: 'IN3', statement: 'Reservo tiempo innegociable para mi descanso y desarrollo personal.' },
};

export type GoalCategory = 'organizar' | 'avanzar' | 'sostener' | 'habito' | 'responder' | 'rumbo';

export const GOALS: { id: GoalCategory; label: string }[] = [
  { id: 'organizar', label: 'Organizar mejor mi semana' },
  { id: 'avanzar', label: 'Avanzar algo que estoy postergando' },
  { id: 'sostener', label: 'Sostener lo que empiezo' },
  { id: 'habito', label: 'Cambiar un hábito' },
  { id: 'responder', label: 'Responder mejor bajo presión' },
  { id: 'rumbo', label: 'Acercar mis decisiones a mi visión' },
];

export type ReadingId =
  | 'planificacion'
  | 'desplazamiento'
  | 'postergacion'
  | 'sostener'
  | 'retomar'
  | 'distraccion'
  | 'evitacion'
  | 'energia'
  | 'respuesta'
  | 'contencion'
  | 'coherencia';

export type Recognition = 'REPRESENTS' | 'PARTIAL' | 'NOT';

type ReadingDef = {
  id: ReadingId;
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  goal: GoalCategory;
  scales: string[];
  difficulties: string[];
  interpretation: string;
  question: string;
  asksFocus?: string;
  plans: string[];
  requiresVision?: boolean;
};

const READINGS: ReadingDef[] = [
  { id: 'planificacion', group: 'A', goal: 'organizar', scales: ['R26'], difficulties: [], interpretation: 'Puede que planificar tu semana te cueste más de lo que quisieras.', question: '¿Te representa hoy?', plans: ['MEN-A1', 'MEN-A2'] },
  { id: 'desplazamiento', group: 'A', goal: 'organizar', scales: [], difficulties: ['D3'], interpretation: 'Puede que tareas secundarias estén ocupando el lugar de lo que más te importa.', question: '¿Te representa hoy?', plans: ['MEN-A2', 'MEN-A1'] },
  { id: 'postergacion', group: 'B', goal: 'avanzar', scales: [], difficulties: ['D2', 'D4', 'D6'], interpretation: 'Puede que haya una decisión o un proyecto que estás esperando empezar.', question: '¿Te representa hoy?', asksFocus: '¿Cuál es esa decisión o ese proyecto?', plans: ['MEN-B1', 'MEN-B2'] },
  { id: 'sostener', group: 'C', goal: 'sostener', scales: ['R9'], difficulties: ['PR4'], interpretation: 'Señalaste que a veces te cuesta sostener lo que empiezas.', question: '¿Te representa hoy?', plans: ['MEN-C1', 'MEN-C2'] },
  { id: 'retomar', group: 'C', goal: 'sostener', scales: ['R29'], difficulties: [], interpretation: 'Retomar el rumbo puede llevarte más tiempo del que quisieras.', question: '¿Te representa hoy?', plans: ['MEN-C2', 'MEN-C1'] },
  { id: 'distraccion', group: 'D', goal: 'habito', scales: [], difficulties: ['PR5'], interpretation: 'Puede que una distracción de último momento te aleje de lo importante.', question: '¿Te representa hoy?', plans: ['MEN-D1', 'MEN-A2'] },
  { id: 'evitacion', group: 'D', goal: 'habito', scales: ['R19'], difficulties: [], interpretation: 'Puede que a veces uses una actividad para no enfrentar algo.', question: '¿Te representa hoy?', asksFocus: '¿Qué hábito concreto quieres cambiar?', plans: ['MEN-D1'] },
  { id: 'energia', group: 'D', goal: 'habito', scales: ['R20'], difficulties: [], interpretation: 'Puede que algunos hábitos te estén quitando energía.', question: '¿Te representa hoy?', asksFocus: '¿Qué hábito concreto quieres cambiar?', plans: ['MEN-D1'] },
  { id: 'respuesta', group: 'E', goal: 'responder', scales: ['R7'], difficulties: [], interpretation: 'En algunas situaciones te cuesta elegir cómo responder.', question: '¿Te representa hoy?', plans: ['MEN-E1'] },
  { id: 'contencion', group: 'E', goal: 'responder', scales: [], difficulties: ['ER3'], interpretation: 'Puede que a veces guardes la incomodidad en lugar de mostrarla.', question: '¿Te representa hoy?', plans: ['MEN-E1'] },
  { id: 'coherencia', group: 'F', goal: 'rumbo', scales: ['R6', 'R30'], difficulties: [], interpretation: 'Puede que tus decisiones de hoy no siempre vayan en la dirección de tu visión.', question: '¿Esa visión sigue vigente para ti?', plans: ['MEN-F1'], requiresVision: true },
];

export type StoredRecognition = { readingId: string; outcome: Recognition; signature: string };

export type IndicatorKind = 'COUNT' | 'SCALE_1_5' | 'YES_NO' | 'CHOICE' | 'TEXT';

export type Indicator = {
  ref: string;
  role: 'RESULT' | 'PERCEPTION';
  question: string;
  kind: IndicatorKind;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  better: 'UP' | 'DOWN' | 'NONE';
  notApplicable?: string;
};

export type Template = {
  id: string;
  version: typeof INTERVENTION_VERSION;
  group: ReadingDef['group'];
  goal: GoalCategory;
  title: string;
  seeks: string;
  action: string;
  schedule: { kind: 'WEEKLY'; occasionsPerWeek: number; minutesPerOccasion: number } | { kind: 'TRIGGER'; trigger: string; minutesPerOccasion: number };
  minimum: { text: string; occasionsPerWeek: number | null; minutesPerOccasion: number; indicators?: Indicator[] };
  doneWhen: string;
  indicators: Indicator[];
  horizonWeeks: number;
  focusPrompt?: string;
  stagePrompt?: string;
  notes: string[];
};

const ind = (ref: string, role: Indicator['role'], question: string, kind: IndicatorKind, extra: Partial<Indicator> = {}): Indicator => ({
  ref,
  role,
  question,
  kind,
  better: 'NONE',
  ...extra,
});

/** Initial beta catalog. Each template also works as a general starting point without answers. */
export const TEMPLATES: Template[] = [
  {
    id: 'MEN-A1', version: INTERVENTION_VERSION, group: 'A', goal: 'organizar',
    title: 'Una semana con tus prioridades',
    seeks: 'Que al final de la semana hayan avanzado las prioridades que elegiste.',
    action: 'Una vez por semana, elige tres prioridades y ponle a cada una un momento.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 20 },
    minimum: {
      text: 'Elegir una sola prioridad, en 10 minutos.', occasionsPerWeek: 1, minutesPerOccasion: 10,
      indicators: [ind('ind-men-prioridad-unica@0.1', 'RESULT', '¿Avanzó tu prioridad de esta semana?', 'YES_NO', { better: 'UP' })],
    },
    doneWhen: 'Quedaron escritas tus prioridades, cada una con su momento.',
    indicators: [ind('ind-men-prioridades@0.1', 'RESULT', '¿Cuántas de tus tres prioridades avanzaron esta semana?', 'COUNT', { min: 0, max: 3, better: 'UP' })],
    horizonWeeks: 3, notes: [],
  },
  {
    id: 'MEN-A2', version: INTERVENTION_VERSION, group: 'A', goal: 'organizar',
    title: 'Proteger un bloque para lo importante',
    seeks: 'Tener cada semana un tiempo que no ocupe lo urgente.',
    action: 'Reserva un bloque para lo importante, sin las interrupciones que puedas evitar.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 45 },
    minimum: { text: 'Un bloque de 25 minutos.', occasionsPerWeek: 1, minutesPerOccasion: 25 },
    doneWhen: 'El bloque ocurrió y sabes en qué lo usaste.',
    indicators: [ind('ind-men-avance-bloque@0.1', 'RESULT', '¿Qué entregable, decisión o avance permitieron tus bloques esta semana?', 'TEXT')],
    horizonWeeks: 3, notes: ['Los bloques hechos muestran la ejecución. El avance se anota aparte.'],
  },
  {
    id: 'MEN-B1', version: INTERVENTION_VERSION, group: 'B', goal: 'avanzar',
    title: 'Avanzar lo que estás postergando',
    seeks: 'Que lo que nombraste pase a la etapa que definiste.',
    action: 'Avanza una versión imperfecta: un borrador, una llamada o un dato.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 2, minutesPerOccasion: 25 },
    minimum: { text: 'Escribir el siguiente paso, en 10 minutos.', occasionsPerWeek: 1, minutesPerOccasion: 10 },
    doneWhen: 'Existe algo que antes no existía: un borrador, una llamada hecha o un dato conseguido.',
    indicators: [ind('ind-men-etapa@0.1', 'RESULT', '¿Pasó a la etapa que definiste?', 'YES_NO', { better: 'UP' })],
    horizonWeeks: 2,
    focusPrompt: '¿Qué decisión o proyecto estás postergando?',
    stagePrompt: '¿Qué tendría que existir para decir que pasó a la siguiente etapa?',
    notes: [],
  },
  {
    id: 'MEN-B2', version: INTERVENTION_VERSION, group: 'B', goal: 'avanzar',
    title: 'Preparar una decisión postergada',
    seeks: 'Tener claro qué falta para decidir y acercarte a la decisión.',
    action: 'Anota qué información falta, cómo conseguirla y cuándo volver a mirarla.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 1, minutesPerOccasion: 30 },
    minimum: { text: 'Anotar solo el dato que falta, en 15 minutos.', occasionsPerWeek: 1, minutesPerOccasion: 15 },
    doneWhen: 'Quedó escrito qué falta y cómo conseguirlo.',
    indicators: [ind('ind-men-decision@0.1', 'RESULT', '¿En qué quedó la decisión esta semana?', 'CHOICE', {
      options: [
        { value: 'RESUELTA', label: 'La resolví' },
        { value: 'FALTA_INFORMACION', label: 'Todavía falta información relevante' },
        { value: 'PENDIENTE', label: 'Sigue pendiente' },
      ],
    })],
    horizonWeeks: 3,
    focusPrompt: '¿Qué decisión estás postergando?',
    stagePrompt: '¿Qué significaría para ti resolver esta decisión?',
    notes: ['No hace falta decidir si todavía falta información relevante.'],
  },
  {
    id: 'MEN-C1', version: INTERVENTION_VERSION, group: 'C', goal: 'sostener',
    title: 'Una promesa pequeña cumplida',
    seeks: 'Volver a contar contigo para terminar lo que empiezas.',
    action: 'Elige un compromiso pequeño y cúmplelo.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 5, minutesPerOccasion: 10 },
    minimum: { text: 'Tres compromisos de 5 minutos en la semana.', occasionsPerWeek: 3, minutesPerOccasion: 5 },
    doneWhen: 'Lo hiciste ese día, completo aunque sea pequeño.',
    indicators: [
      ind('ind-men-termine@0.1', 'RESULT', '¿Terminaste esta semana algo que empezaste?', 'YES_NO', { better: 'UP' }),
      ind('ind-men-confianza@0.1', 'PERCEPTION', 'Esta semana, ¿cuánto confiaste en terminar lo que empiezas?', 'SCALE_1_5', { min: 1, max: 5, better: 'UP' }),
    ],
    horizonWeeks: 4, notes: [],
  },
  {
    id: 'MEN-C2', version: INTERVENTION_VERSION, group: 'C', goal: 'sostener',
    title: 'Retomar después de una interrupción',
    seeks: 'Que una interrupción no se convierta en una semana perdida.',
    action: 'Cuando se corte tu rutina, al día siguiente haz la versión mínima.',
    schedule: { kind: 'TRIGGER', trigger: 'Cuando se interrumpe tu rutina', minutesPerOccasion: 10 },
    minimum: { text: 'Solo anotar cuándo vas a retomar.', occasionsPerWeek: null, minutesPerOccasion: 5 },
    doneWhen: 'Después de una interrupción, hiciste la versión mínima.',
    indicators: [ind('ind-men-dias-retomar@0.1', 'RESULT', 'Si esta semana hubo una interrupción, ¿cuántos días pasaron hasta retomar?', 'COUNT', {
      min: 0, max: 14, better: 'DOWN', notApplicable: 'No hubo interrupción',
    })],
    horizonWeeks: 4,
    notes: ['Si no hubo interrupción, no hay ocasión ni incumplimiento.'],
  },
  {
    id: 'MEN-D1', version: INTERVENTION_VERSION, group: 'D', goal: 'habito',
    title: 'Cambiar el entorno de un hábito',
    seeks: 'Usar menos el hábito que nombraste.',
    action: 'Haz un cambio de entorno concreto y ten preparada una alternativa.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 3, minutesPerOccasion: 5 },
    minimum: { text: 'Un cambio de entorno, revisado una vez en la semana.', occasionsPerWeek: 1, minutesPerOccasion: 5 },
    doneWhen: 'El cambio de entorno siguió puesto ese día.',
    indicators: [
      ind('ind-men-habito-veces@0.1', 'RESULT', '¿Cuántas veces usaste ese hábito esta semana?', 'COUNT', { min: 0, max: 99, better: 'DOWN' }),
      ind('ind-men-energia@0.1', 'PERCEPTION', 'Esta semana, ¿cómo estuvo tu energía?', 'SCALE_1_5', { min: 1, max: 5, better: 'UP' }),
    ],
    horizonWeeks: 3,
    focusPrompt: '¿Qué hábito concreto quieres cambiar?',
    notes: ['Tu primera respuesta es tu punto de partida.', 'La energía tiene muchas causas. No se atribuye a ese hábito.'],
  },
  {
    id: 'MEN-E1', version: INTERVENTION_VERSION, group: 'E', goal: 'responder',
    title: 'Una pausa antes de responder',
    seeks: 'Elegir cómo respondes en las situaciones que te cuestan.',
    action: 'Anota una situación difícil: qué sentiste y cómo elegiste responder. Puede ser después y en privado; no necesitas hablar con nadie.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 4, minutesPerOccasion: 5 },
    minimum: { text: 'Dos registros de 3 minutos en la semana.', occasionsPerWeek: 2, minutesPerOccasion: 3 },
    doneWhen: 'Quedó anotada una situación, lo que sentiste y tu respuesta.',
    indicators: [
      ind('ind-men-respuestas-elegidas@0.1', 'RESULT', 'Esta semana, ¿en cuántas situaciones difíciles pudiste elegir cómo responder?', 'COUNT', { min: 0, max: 30, better: 'UP' }),
      ind('ind-men-calma@0.1', 'PERCEPTION', 'Esta semana, ¿cuánta calma sentiste al responder?', 'SCALE_1_5', { min: 1, max: 5, better: 'UP' }),
    ],
    horizonWeeks: 4,
    notes: ['Si aparece un malestar intenso, busca ayuda. Esto no es una terapia.'],
  },
  {
    id: 'MEN-F1', version: INTERVENTION_VERSION, group: 'F', goal: 'rumbo',
    title: 'Una decisión hacia tu visión',
    seeks: 'Que tus decisiones de la semana se acerquen a la visión que elegiste.',
    action: 'Elige una decisión para mañana que vaya hacia tu visión y al día siguiente anota qué cambió.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 5, minutesPerOccasion: 5 },
    minimum: { text: 'Dos decisiones en la semana.', occasionsPerWeek: 2, minutesPerOccasion: 5 },
    doneWhen: 'Hiciste la decisión que elegiste; anotarla no basta.',
    indicators: [
      ind('ind-men-cambio-concreto@0.1', 'RESULT', '¿Qué cambio concreto hiciste esta semana que va hacia tu visión?', 'TEXT'),
      ind('ind-men-coherencia@0.1', 'PERCEPTION', 'Esta semana, ¿cuánto se parecieron tus decisiones a tu visión?', 'SCALE_1_5', { min: 1, max: 5, better: 'UP' }),
    ],
    horizonWeeks: 4, notes: [],
  },
];

/** Suggestions only. Nothing reduces the load or adds an action until the person confirms. */
export function modifiersFor(read: EngineSourceRead) {
  const d1 = read.difficulties.D1;
  const in3 = read.difficulties.IN3;
  const minimumSources = [d1?.level === 'YES' ? d1.source : null, in3?.level === 'NO' ? in3.source : null].filter((row): row is NonNullable<typeof row> => Boolean(row));
  const r27 = read.scales.R27;
  return {
    suggestMinimum: minimumSources.length
      ? { because: 'Señalaste que el tiempo es escaso. Puedes empezar con la versión mínima; decides tú.', sources: minimumSources }
      : null,
    environmentAlternative: r27?.band === 'CANDIDATE'
      ? { text: 'Si quieres, puedes sumar un cambio de entorno, por ejemplo dejar el teléfono fuera del lugar donde trabajas. Es opcional.', source: r27.source }
      : null,
  };
}

function tagged<T extends { row: number }>(instrument: Instrument, rows: Record<string, T>) {
  return Object.fromEntries(Object.entries(rows).map(([key, spec]) => [key, { ...spec, instrument }]));
}

export const PACK: Pack = {
  territory: 'MENTALIDAD',
  version: INTERVENTION_VERSION,
  scope: 'INTERPRETATION_MENTALIDAD',
  scales: tagged('E-AUD-001', SCALES),
  difficulties: tagged('E-PER-000', DIFFICULTIES),
  choices: {},
  vision: { instrument: 'E-PER-000', row: 33 },
  readings: READINGS,
  goals: GOALS,
  templates: TEMPLATES,
  modifiers: modifiersFor,
};

const bound = bindPack(PACK);

export const readSources = bound.readSources;
export const buildReadings = bound.buildReadings;
export const templateById = bound.templateById;

export {
  activeIndicators,
  executionFrom,
  isOriented,
  progressFrom,
  readingsForGoal,
  reviewProposal,
  validateMeasure,
} from './engine';

