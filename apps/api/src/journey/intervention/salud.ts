import type { Indicator, Pack, SourceRead, Template } from './engine';

/** Beta product rules for Salud física. Not a medical or training prescription. */
export const VERSION = 'intervencion-salud@0.1';

const ind = (ref: string, role: Indicator['role'], question: string, kind: Indicator['kind'], extra: Partial<Indicator> = {}): Indicator => ({
  ref, role, question, kind, better: 'NONE', ...extra,
});

const care = 'Si hay dolor o una indicación médica, sigue esa indicación. Esto no la reemplaza.';

const templates: Template[] = [
  {
    id: 'SAL-A1', version: VERSION, group: 'A', goal: 'entrenar',
    title: 'Sesiones en días que eliges',
    seeks: 'Que el entrenamiento tenga un lugar en la semana, con la actividad que tú eliges.',
    action: 'Elige la actividad y hazla en los días que marcaste.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 3, minutesPerOccasion: 30 },
    minimum: { text: 'Dos sesiones de 20 minutos.', occasionsPerWeek: 2, minutesPerOccasion: 20 },
    doneWhen: 'La sesión ocurrió, completa aunque sea corta.',
    indicators: [ind('ind-sal-sesiones@0.1', 'RESULT', '¿Cuántas sesiones hiciste esta semana?', 'COUNT', { min: 0, max: 7, better: 'UP' })],
    horizonWeeks: 4,
    notes: [care, 'No dice qué ejercicio hacer ni con qué intensidad.'],
    contentTags: ['PHYSICAL_EXERTION'],
  },
  {
    id: 'SAL-B1', version: VERSION, group: 'B', goal: 'comer',
    title: 'Una comida con estructura',
    seeks: 'Que una comida del día tenga la estructura que tú defines, sin buscar una dieta perfecta.',
    action: 'Elige una comida del día y respeta la estructura que escribiste.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 5, minutesPerOccasion: 10 },
    minimum: { text: 'Esa comida, tres días de la semana.', occasionsPerWeek: 3, minutesPerOccasion: 10 },
    doneWhen: 'Esa comida siguió la estructura que definiste.',
    indicators: [ind('ind-sal-comidas@0.1', 'RESULT', '¿Cuántos días respetaste esa comida?', 'COUNT', { min: 0, max: 7, better: 'UP' })],
    horizonWeeks: 3,
    focusPrompt: '¿Qué comida y qué estructura quieres respetar?',
    notes: [care, 'No es una dieta ni una pauta nutricional.'],
  },
  {
    id: 'SAL-C1', version: VERSION, group: 'C', goal: 'dormir',
    title: 'Una hora para acostarte',
    seeks: 'Acostarte a la hora que elegiste, las noches que marques.',
    action: 'A la hora que definiste, deja la pantalla y te acuestas.',
    schedule: { kind: 'WEEKLY', occasionsPerWeek: 5, minutesPerOccasion: 10 },
    minimum: { text: 'Tres noches a la hora elegida.', occasionsPerWeek: 3, minutesPerOccasion: 5 },
    doneWhen: 'Te acostaste a esa hora, o anotaste qué lo impidió.',
    indicators: [ind('ind-sal-noches@0.1', 'RESULT', '¿Cuántas noches te acostaste a la hora que elegiste?', 'COUNT', { min: 0, max: 7, better: 'UP' })],
    horizonWeeks: 3,
    focusPrompt: '¿A qué hora quieres acostarte?',
    notes: [care, 'No es un tratamiento del sueño.'],
  },
];

function modifiers(read: SourceRead) {
  const restriction = read.choices.restriccion;
  if (!restriction?.candidate) return { suggestMinimum: null, environmentAlternative: null };
  return {
    suggestMinimum: {
      because: 'Señalaste una indicación de evitar ciertos esfuerzos. Puedes empezar con la versión mínima y no contradecir esa indicación. Decides tú.',
      sources: [restriction.source],
    },
    environmentAlternative: null,
  };
}

export const PACK: Pack = {
  territory: 'SALUD_FISICA',
  version: VERSION,
  scope: 'INTERPRETATION_SALUD_FISICA',
  scales: {
    entrenamiento: { instrument: 'E-AUD-001', row: 16, question: '¿Qué tan seguido realizas entrenamiento físico?' },
    alimentacion: { instrument: 'E-AUD-001', row: 17, question: '¿Qué tan constante has sido con la alimentación, de forma honesta?' },
    sueno: { instrument: 'E-AUD-001', row: 18, question: '¿Tu calidad de sueño está apoyando tu progreso o lo está frenando?' },
  },
  difficulties: {},
  choices: {
    restriccion: {
      instrument: 'F-RAD-001',
      row: 27,
      statement: '¿Has recibido indicaciones médicas de evitar ciertos esfuerzos o actividades?',
      candidateValues: ['Sí'],
    },
  },
  vision: null,
  readings: [
    {
      id: 'entrenamiento', group: 'A', goal: 'entrenar',
      scales: ['entrenamiento'], difficulties: [],
      interpretation: 'Puede que el entrenamiento no esté teniendo un lugar en tu semana.',
      question: '¿Te representa hoy?',
      plans: ['SAL-A1'],
    },
    {
      id: 'alimentacion', group: 'B', goal: 'comer',
      scales: ['alimentacion'], difficulties: [],
      interpretation: 'Puede que la alimentación esté más desordenada de lo que quisieras.',
      question: '¿Te representa hoy?',
      asksFocus: '¿Qué comida quieres ordenar?',
      plans: ['SAL-B1'],
    },
    {
      id: 'sueno', group: 'C', goal: 'dormir',
      scales: ['sueno'], difficulties: [],
      interpretation: 'Puede que el sueño te esté restando.',
      question: '¿Te representa hoy?',
      asksFocus: '¿A qué hora quieres acostarte?',
      plans: ['SAL-C1'],
    },
  ],
  goals: [
    { id: 'entrenar', label: 'Entrenar con más constancia' },
    { id: 'comer', label: 'Ordenar una comida del día' },
    { id: 'dormir', label: 'Cuidar la hora de dormir' },
  ],
  templates,
  modifiers,
};
