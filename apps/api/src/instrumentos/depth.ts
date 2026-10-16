import { PURPOSE_COMPONENTS, PURPOSE_COMPONENT_LABEL, type PurposeComponent } from './glossary';

/** Product draft. Documented elaboration, not psychological depth and not an Excel formula. */
export const DEPTH_METHOD = 'profundidad-mk@0.1';
export const DEPTH_NAME = 'Índice de profundidad MK';

export type DepthRecord = 'VALID' | 'DECLINED' | 'UNRELIABLE' | 'ABSENT' | 'NOT_APPLICABLE';
export type DepthDecision = 'KEEP' | 'CHANGE' | 'NOT_APPLY';

export type DepthFact = {
  component: PurposeComponent;
  record: DepthRecord;
  /** What the person says it means and why it matters. Empty text does not count, whatever its length. */
  recognized: { meaning: string; matters: string } | null;
  /** A decision, standard, renunciation, priority or experiment that changes because of this component. */
  integrated: { change: string; link: string } | null;
  /** linkCurrent is false when the direction revision that held the link is no longer current. */
  linkCurrent: boolean;
  contrasted: { evidence: string; decision: DepthDecision } | null;
};

export type DepthComponentScore = {
  component: PurposeComponent;
  label: string;
  level: number | null;
  score: number | null;
  stage: string;
  reason: string;
};

export type DepthIndex = {
  name: typeof DEPTH_NAME;
  methodVersion: typeof DEPTH_METHOD;
  components: DepthComponentScore[];
  general: number | null;
  partial: number | null;
  coverage: { scored: number; required: number };
};

const STAGE = ['Sin trabajo documentado', 'Registrado', 'Reconocido', 'Integrado', 'Contrastado'] as const;

function filled(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function scoreOf(level: number): number {
  return level * 25;
}

export function scoreComponent(fact: DepthFact): DepthComponentScore {
  const label = PURPOSE_COMPONENT_LABEL[fact.component];
  const base = (level: number | null, stage: string, reason: string): DepthComponentScore => ({
    component: fact.component,
    label,
    level,
    score: level == null ? null : scoreOf(level),
    stage,
    reason,
  });
  if (fact.record === 'DECLINED') return base(null, 'Declinado', 'DECLINED');
  if (fact.record === 'UNRELIABLE') return base(null, 'Captura no fiable', 'UNRELIABLE');
  if (fact.record === 'NOT_APPLICABLE') return base(null, 'Aplicabilidad no definida', 'NOT_APPLICABLE');
  if (fact.record === 'ABSENT') {
    return base(0, STAGE[0], 'No hay trabajo documentado. No describe a la persona.');
  }
  let level = 1;
  const recognized = fact.recognized && filled(fact.recognized.meaning) && filled(fact.recognized.matters);
  if (recognized) level = 2;
  const integrated = Boolean(
    recognized && fact.integrated && filled(fact.integrated.change) && filled(fact.integrated.link) && fact.linkCurrent,
  );
  if (integrated) level = 3;
  const contrasted = Boolean(integrated && fact.contrasted && filled(fact.contrasted.evidence) && fact.contrasted.decision);
  if (contrasted) level = 4;
  const stale = Boolean(fact.integrated && filled(fact.integrated.link) && !fact.linkCurrent && level < 3);
  const reason = stale
    ? 'El vínculo quedó en una revisión anterior. No acredita la integración vigente.'
    : STAGE[level];
  return base(level, STAGE[level], reason);
}

export function scoreDepth(facts: DepthFact[]): DepthIndex {
  const byComponent = new Map(facts.map((fact) => [fact.component, fact]));
  const components = PURPOSE_COMPONENTS.map((component) => scoreComponent(
    byComponent.get(component) ?? {
      component,
      record: 'ABSENT',
      recognized: null,
      integrated: null,
      linkCurrent: false,
      contrasted: null,
    },
  ));
  const scored = components.filter((item) => item.score != null);
  const general = scored.length === PURPOSE_COMPONENTS.length
    ? Math.round((scored.reduce((sum, item) => sum + (item.score as number), 0) / PURPOSE_COMPONENTS.length) * 10000) / 10000
    : null;
  const partial = scored.length > 0 && general == null
    ? Math.round((scored.reduce((sum, item) => sum + (item.score as number), 0) / scored.length) * 10000) / 10000
    : null;
  return {
    name: DEPTH_NAME,
    methodVersion: DEPTH_METHOD,
    components,
    general,
    partial,
    coverage: { scored: scored.length, required: PURPOSE_COMPONENTS.length },
  };
}
