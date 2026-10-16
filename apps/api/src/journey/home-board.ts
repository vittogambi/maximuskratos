import type { DepthCard, IndexCard } from '../instrumentos/core-reading';
import { signalByRef } from '../instrumentos/core-definition';
import { TERRITORY_LABEL, type Territory } from '../instrumentos/glossary';
import { territoryHomes, type TerritoryEvidence } from '../instrumentos/territory-map';
import type { AlignmentReading } from '../instrumentos/iad';

export type HomeSituation =
  | 'QUESTIONNAIRE'
  | 'JUST_CLOSED'
  | 'EXPLORING'
  | 'GUIDED'
  | 'OWN'
  | 'PAUSED'
  | 'RETURN';

export type HomePlan = {
  id: string;
  title: string;
  outcome: string;
  priorityNote: string | null;
  linkKind: string | null;
  status: string;
  guided: boolean;
};

export type HomeFacts = {
  formularioCompleted: boolean;
  hasActiveSession: boolean;
  directionStatus: string | null;
  preference: string | null;
  path: string | null;
  headSituation: string | null;
  goalText: string | null;
  activePlan: HomePlan | null;
  pausedPlan: HomePlan | null;
  actionsPaused: boolean;
  synthesis: { text: string | null; source: 'EDITED' | 'GENERATED' | 'NONE' };
  experiment: { hypothesis: string; status: string } | null;
  occasion: { day: string; title: string; criterion: string } | null;
  review: { weekStart: string; note: string | null; changes: string[] } | null;
  index: IndexCard | null;
  history: IndexCard[];
  declared: AlignmentReading;
  depth: DepthCard | null;
  signals: { id: string; sourceRef: string; raw: number | null }[];
};

export type HomeBoard = {
  situation: HomeSituation;
  reading: {
    name: string;
    methodVersion: string | null;
    general: number | null;
    pillars: { espiritu: number | null; mente: number | null; cuerpo: number | null } | null;
    coverage: { eligible: number; required: number } | null;
    computedAt: string | null;
    explanation: string | null;
  } | null;
  synthesis: HomeFacts['synthesis'];
  direction: { status: string | null; goalText: string | null; experiment: HomeFacts['experiment'] };
  plan: HomePlan | null;
  occasion: HomeFacts['occasion'];
  review: HomeFacts['review'];
  depth: {
    name: string;
    methodVersion: string;
    general: number | null;
    partial: number | null;
    coverage: { scored?: number; required: number };
    explanation: string;
    components: { component: string; label: string; stage: string; detail: string; href: string }[];
  } | null;
  evolution: {
    status: 'NONE' | 'INITIAL' | 'NOT_COMPARABLE' | 'COMPARABLE';
    delta: number | null;
    points: {
      computedAt: string;
      kind: string;
      general: number | null;
      pillars: { espiritu: number | null; mente: number | null; cuerpo: number | null } | null;
      methodVersion: string;
    }[];
    note: string;
  };
  territories: {
    figure: null;
    method: null;
    note: string;
    items: {
      territory: Territory;
      label: string;
      state: string;
      readings: { id: string; raw: number; scale: string | null }[];
    }[];
  };
};

const EMPTY: HomeFacts = {
  formularioCompleted: false,
  hasActiveSession: false,
  directionStatus: null,
  preference: null,
  path: null,
  headSituation: null,
  goalText: null,
  activePlan: null,
  pausedPlan: null,
  actionsPaused: false,
  synthesis: { text: null, source: 'NONE' },
  experiment: null,
  occasion: null,
  review: null,
  index: null,
  history: [],
  declared: {
    status: 'none',
    total: null,
    pillars: { E: null, M: null, C: null },
    savedAt: null,
    methodVersion: null,
    coverage: { answered: 0, required: 9 },
    revision: null,
    directionStatus: null,
  },
  depth: null,
  signals: [],
};

export function homeSituation(facts: HomeFacts): HomeSituation {
  if (!facts.formularioCompleted || facts.hasActiveSession) return 'QUESTIONNAIRE';
  if (facts.headSituation === 'RETURN') return 'RETURN';
  if (facts.headSituation === 'PAUSE' || facts.actionsPaused || (!facts.activePlan && facts.pausedPlan)) return 'PAUSED';
  if (facts.preference === 'PROPIO' || facts.path === 'SEGUIR') return 'OWN';
  if (
    facts.preference === 'GUIADA'
    || facts.preference === 'PUNTUAL'
    || facts.path === 'PREPARAR'
    || Boolean(facts.activePlan?.guided)
  ) return 'GUIDED';
  if (facts.path === 'EXPLORAR' || facts.directionStatus === 'EXPLORANDO') return 'EXPLORING';
  if (facts.activePlan) return 'OWN';
  return 'JUST_CLOSED';
}

function evidenceOf(signals: HomeFacts['signals']): TerritoryEvidence[] {
  return signals
    .filter((item) => item.raw != null)
    .map((item) => ({ sourceRef: item.sourceRef, role: 'senal' as const, note: `${item.id} ${item.raw}` }));
}

function territoriesOf(signals: HomeFacts['signals']): HomeBoard['territories'] {
  const byRef = new Map(signals.map((item) => [item.sourceRef, item]));
  return {
    figure: null,
    method: null,
    note: 'No hay un índice de ámbito ni una serie en el tiempo. La celda no copia el índice del pilar. Cada número es el valor original de la señal.',
    items: territoryHomes(evidenceOf(signals)).map((cell) => ({
      territory: cell.territory,
      label: TERRITORY_LABEL[cell.territory],
      state: cell.state,
      readings: cell.evidence.flatMap((item) => {
        const signal = byRef.get(item.sourceRef);
        if (signal?.raw == null) return [];
        const scale = signalByRef(item.sourceRef);
        return [{
          id: signal.id,
          raw: signal.raw,
          scale: scale ? `de ${scale.min} a ${scale.max}` : null,
        }];
      }),
    })),
  };
}

function evolutionOf(facts: HomeFacts): HomeBoard['evolution'] {
  const points = facts.history.map((card) => ({
    computedAt: card.computedAt,
    kind: card.kind,
    general: card.general,
    pillars: card.pillars,
    methodVersion: card.methodVersion,
  }));
  const withGeneral = points.filter((point) => point.general != null);
  const delta = facts.index?.delta ?? null;
  if (points.length === 0) {
    return { status: 'NONE', delta: null, points, note: 'Todavía no hay una lectura del cuestionario.' };
  }
  if (withGeneral.length >= 2 && delta != null) {
    return { status: 'COMPARABLE', delta, points, note: 'La diferencia usa solo lecturas comparables del mismo método. No es una tendencia de ámbitos.' };
  }
  if (withGeneral.length >= 2) {
    return { status: 'NOT_COMPARABLE', delta: null, points, note: 'Hay más de una lectura y no son comparables. No se dibuja una tendencia.' };
  }
  return { status: 'INITIAL', delta: null, points, note: 'Estado inicial. Una medición no es una tendencia.' };
}

function shownPlan(facts: HomeFacts, situation: HomeSituation): HomePlan | null {
  if (situation === 'PAUSED') return facts.pausedPlan ?? facts.activePlan;
  return facts.activePlan;
}

/** Assembles the home from readings that already exist. It does not score. */
export function homeBoard(partial: Partial<HomeFacts> = {}): HomeBoard {
  const facts: HomeFacts = { ...EMPTY, ...partial, declared: partial.declared ?? EMPTY.declared, synthesis: partial.synthesis ?? EMPTY.synthesis };
  const situation = homeSituation(facts);
  const paused = situation === 'PAUSED';
  return {
    situation,
    reading: facts.index ? {
      name: facts.index.name,
      methodVersion: facts.index.methodVersion,
      general: facts.index.general,
      pillars: facts.index.pillars,
      coverage: facts.index.coverage.eligible == null ? null : { eligible: facts.index.coverage.eligible, required: facts.index.coverage.required },
      computedAt: facts.index.computedAt,
      explanation: facts.index.explanation,
    } : null,
    synthesis: facts.synthesis,
    direction: { status: facts.directionStatus, goalText: facts.goalText, experiment: facts.experiment },
    plan: shownPlan(facts, situation),
    occasion: paused ? null : facts.occasion,
    review: facts.review,
    depth: facts.depth ? {
      name: facts.depth.name,
      methodVersion: facts.depth.methodVersion,
      general: facts.depth.general,
      partial: facts.depth.partial,
      coverage: facts.depth.coverage,
      explanation: facts.depth.explanation,
      components: facts.depth.components.map((item) => ({
        component: item.component,
        label: item.label,
        stage: item.stage,
        detail: item.reason.includes(' ') ? item.reason : item.stage,
        href: '/proposito',
      })),
    } : null,
    evolution: evolutionOf(facts),
    territories: territoriesOf(facts.signals),
  };
}
