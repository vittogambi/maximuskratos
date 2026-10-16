import type { Territory } from '../../instrumentos/glossary';
import type { GoalKind } from './vocab';

/** Traceable reading after the questionnaire. It does not score and it does not create an obligation. */
export const DEVOLUTION_VERSION = 'devolucion@0.1';

export type HelpPreference = 'GUIADA' | 'PUNTUAL' | 'PROPIO';
export type SourceStatus = 'POR_RECONOCER' | 'RECONOCIDO' | 'RECHAZADO' | 'INCIERTO' | 'AUSENTE';

export type AccountSources = {
  direction: 'EXPLORANDO' | 'PROVISIONAL' | 'CONFIRMADO_POR_USUARIO' | null;
  visionDay: string | null;
  visionPhrase: string | null;
  valueDefended: string | null;
  weeklyStandard: string | null;
  /** R134. SI is a candidate, not a diagnosis. */
  postpone: 'SI' | 'PARCIAL' | 'NO' | 'UNKNOWN' | null;
  ikigaiActivity: string | null;
  goalText: string | null;
  goalKind: GoalKind | null;
};

export type Observation = {
  id: string;
  sourceRef: string | null;
  declared: string | null;
  hypothesis: string;
  status: SourceStatus;
  effect: string;
};

export type PathOffer = {
  id: 'EXPLORAR' | 'PREPARAR' | 'SEGUIR';
  personalized: boolean;
  title: string;
  evidence: { text: string; refs: string[] }[];
  firstStep: string;
};

export type Devolution = {
  version: typeof DEVOLUTION_VERSION;
  recognized: Observation[];
  resources: Observation[];
  tensions: Observation[];
  pending: Observation[];
  paths: PathOffer[];
};

function clip(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= 160 ? clean : `${clean.slice(0, 159).trim()}…`;
}

function present(text: string | null | undefined): string | null {
  const clean = text?.trim() ?? '';
  return clean ? clip(clean) : null;
}

export function devolutionOf(input: AccountSources): Devolution {
  const recognized: Observation[] = [];
  const resources: Observation[] = [];
  const tensions: Observation[] = [];
  const pending: Observation[] = [];
  const vision = present(input.visionPhrase) ?? present(input.visionDay);
  const value = present(input.valueDefended);
  const standard = present(input.weeklyStandard);
  const activity = present(input.ikigaiActivity);

  if (input.direction) {
    recognized.push({
      id: 'direccion',
      sourceRef: null,
      declared: input.direction,
      hypothesis: 'La dirección vigente es la última que la persona confirmó. Una respuesta anterior no la pisa.',
      status: 'RECONOCIDO',
      effect: 'Elige el recorrido. No obliga a rehacer el propósito.',
    });
  }
  if (vision) {
    resources.push({
      id: 'vision',
      sourceRef: input.visionPhrase ? 'formulario-v1:E-PER-000!R33' : 'formulario-v1:E-PER-000!R30',
      declared: vision,
      hypothesis: 'Puede orientar un resultado que se parece a esa vida. No prueba que sea viable.',
      status: 'POR_RECONOCER',
      effect: 'Puede ser una opción al explorar. No impone la meta.',
    });
  } else {
    pending.push({
      id: 'vision',
      sourceRef: 'formulario-v1:E-PER-000!R33',
      declared: null,
      hypothesis: 'No hay una frase de visión guardada.',
      status: 'AUSENTE',
      effect: 'La exploración, si hace falta, se marca como general.',
    });
  }
  if (value) {
    resources.push({
      id: 'valor',
      sourceRef: 'formulario-v1:E-PER-000!R50',
      declared: value,
      hypothesis: 'Puede servir para elegir o para renunciar. Nombrarlo no demuestra que la elección ya cambió.',
      status: 'POR_RECONOCER',
      effect: 'Entra en la razón si la persona lo usa.',
    });
  }
  if (standard) {
    resources.push({
      id: 'estandar',
      sourceRef: 'formulario-v1:E-PER-000!R62',
      declared: standard,
      hypothesis: 'Puede volverse el criterio de esta semana, o quedar grande para la carga.',
      status: 'POR_RECONOCER',
      effect: 'Cambia el criterio del entregable si la persona lo mantiene.',
    });
  }
  if (input.postpone === 'SI' || input.postpone === 'PARCIAL') {
    tensions.push({
      id: 'postergar',
      sourceRef: 'formulario-v1:E-PER-000!R134',
      declared: input.postpone,
      hypothesis: 'Puede estar desplazando esta entrega. No diagnostica miedo ni carácter.',
      status: 'POR_RECONOCER',
      effect: 'Si la persona lo reconoce, la preparación no espera el diseño final.',
    });
  }
  if (activity) {
    resources.push({
      id: 'ikigai',
      sourceRef: null,
      declared: activity,
      hypothesis: 'Es una actividad ya escrita. Sirve como hipótesis de experiencia, no como propósito cerrado.',
      status: 'POR_RECONOCER',
      effect: 'Puede ser el experimento si la persona está explorando.',
    });
  }

  const known = [vision, value, activity].filter(Boolean);
  const paths: PathOffer[] = [];
  if (!input.goalKind && !input.goalText?.trim()) {
    paths.push(known.length
      ? {
          id: 'EXPLORAR',
          personalized: true,
          title: 'Explorar a partir de lo que ya dijiste',
          evidence: known.slice(0, 3).map((text) => ({ text: text as string, refs: ['CUENTA'] })),
          firstStep: activity
            ? `Una muestra pequeña de esto: ${activity}`
            : `Una prueba pequeña a partir de esto: ${vision ?? value}`,
        }
      : {
          id: 'EXPLORAR',
          personalized: false,
          title: 'Exploración general',
          evidence: [],
          firstStep: 'Elige una experiencia reciente y anota qué quisiste sostener. No es una lectura personalizada.',
        });
  }
  if (input.goalText?.trim() || input.goalKind) {
    paths.push({
      id: 'PREPARAR',
      personalized: true,
      title: 'Preparar la meta que ya elegiste',
      evidence: [{ text: input.goalText?.trim() || input.goalKind || '', refs: ['USER_GOAL'] }],
      firstStep: standard
        ? `El criterio de esta semana puede salir de tu estándar: ${standard}`
        : 'Una parte revisable, con un criterio que puedas comprobar.',
    });
  }
  paths.push({
    id: 'SEGUIR',
    personalized: false,
    title: 'Seguir tu propio plan',
    evidence: [],
    firstStep: 'Escribes la acción, la ocasión y el criterio. La guía queda apagada hasta que la pidas.',
  });

  return { version: DEVOLUTION_VERSION, recognized, resources, tensions, pending, paths: paths.slice(0, 3) };
}

export function standardCriterion(input: {
  standard: string | null;
  choice: 'FULL' | 'PARTIAL' | null;
  occasions: number | null;
}): { note: string; tension: string | null } | null {
  const standard = present(input.standard);
  if (!standard) return null;
  if (input.choice === 'PARTIAL' || (input.occasions != null && input.occasions <= 1 && input.choice !== 'FULL')) {
    return {
      note: 'Quedó hecha una parte del estándar semanal, la que elijas para esta ocasión.',
      tension: input.choice === 'PARTIAL'
        ? null
        : 'El estándar semanal pide más de una cosa. ¿Esta semana te quedas con una parte?',
    };
  }
  return { note: `Quedó hecho según el estándar que escribiste: ${standard}`, tension: null };
}
