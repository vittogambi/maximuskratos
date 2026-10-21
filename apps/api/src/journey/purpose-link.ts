import { NOT_CONNECTED } from './accompaniment/sources';
import { isWorkingDirection, WORKING_DIRECTIONS } from './plan-gate';

export type WhyStatus = 'PROPOSED' | 'CONFIRMED' | 'PROVISIONAL';
export type PlanLinkKind = 'DIRECT' | 'ENABLING' | 'PROTECTIVE' | 'EXPLORATORY';

export type PurposeRef = { id: string; label: string; excerpt?: string };

export type ProposePurposeInput = {
  goalText?: string | null;
  situationText?: string | null;
  directionStatement?: string | null;
  directionStatus?: string | null;
  valueRef?: string | null;
  visionText?: string | null;
  huellaText?: string | null;
  ikigaiCombination?: string | null;
};

export type ProposePurposeResult = {
  text: string | null;
  refs: PurposeRef[];
  reasons: string[];
  question: string;
};

export type ProposeLinkResult = {
  linkKind: PlanLinkKind | null;
  reason: string | null;
};

export type DirectionSeedResult = {
  offer: boolean;
  statement: string | null;
  directionStatus: 'EXPLORANDO' | null;
  reason: string | null;
};

export type ReviewPurposePlan = {
  whyStatus: WhyStatus | null;
  whyItMatters: string | null;
};

const PURPOSE_QUESTION = '¿Para qué te importa esto?';
const GOAL_QUESTION = '¿Esta meta sigue importándote?';

function clip(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
}

function forbiddenSource(id: string): boolean {
  return (NOT_CONNECTED as readonly string[]).includes(id);
}

export function proposePurpose(input: ProposePurposeInput): ProposePurposeResult {
  const refs: PurposeRef[] = [];
  const reasons: string[] = [];
  const goal = clip(input.goalText ?? input.situationText ?? '');
  if (goal) {
    refs.push({ id: 'goal', label: 'Meta o situación', excerpt: goal });
    reasons.push('Partimos de lo que escribiste sobre el cambio.');
  }
  const statement = input.directionStatement?.trim();
  if (statement && isWorkingDirection(input.directionStatus ?? null)) {
    refs.push({ id: 'direction', label: 'Dirección de cuenta', excerpt: clip(statement) });
    reasons.push('Citamos tu dirección vigente.');
  }
  if (input.valueRef?.trim()) {
    refs.push({ id: 'value', label: 'Valor elegido', excerpt: clip(input.valueRef) });
  }
  if (input.visionText?.trim() && !forbiddenSource('vision')) {
    refs.push({ id: 'vision', label: 'Visión', excerpt: clip(input.visionText) });
  }
  // huella stays in NOT_CONNECTED until D-SRC; do not propose from it here.
  if (input.ikigaiCombination?.trim()) {
    refs.push({ id: 'ikigai', label: 'Combinación IKIGAI', excerpt: clip(input.ikigaiCombination) });
  }

  if (refs.length === 0) {
    return { text: null, refs: [], reasons: [], question: PURPOSE_QUESTION };
  }

  const primary = refs[0];
  const text = primary.excerpt
    ? `Porque ${primary.excerpt.charAt(0).toLowerCase()}${primary.excerpt.slice(1)}`
    : null;
  return { text, refs, reasons, question: PURPOSE_QUESTION };
}

export function proposeLink(input: {
  directionStatement?: string | null;
  directionStatus?: string | null;
  explicitDirectReason?: string | null;
}): ProposeLinkResult {
  if (!isWorkingDirection(input.directionStatus ?? null) || !input.directionStatement?.trim()) {
    return { linkKind: null, reason: null };
  }
  if (input.explicitDirectReason?.trim()) {
    return { linkKind: 'DIRECT', reason: clip(input.explicitDirectReason) };
  }
  if (input.directionStatus === 'EXPLORANDO') {
    return {
      linkKind: 'EXPLORATORY',
      reason: 'Tu dirección está en exploración; este plan puede ayudarte a probarla.',
    };
  }
  return {
    linkKind: 'DIRECT',
    reason: 'Conecta de forma directa con la dirección que confirmaste.',
  };
}

export function directionSeed(input: {
  directionStatus?: string | null;
  directionConfirmedAt?: string | null;
  whyStatus: WhyStatus;
  whyItMatters: string | null;
}): DirectionSeedResult {
  if (input.directionConfirmedAt) {
    return { offer: false, statement: null, directionStatus: null, reason: 'signed_direction' };
  }
  if (isWorkingDirection(input.directionStatus ?? null)) {
    return { offer: false, statement: null, directionStatus: null, reason: 'working_direction' };
  }
  if (input.whyStatus !== 'CONFIRMED' || !input.whyItMatters?.trim()) {
    return { offer: false, statement: null, directionStatus: null, reason: 'why_not_confirmed' };
  }
  return {
    offer: true,
    statement: input.whyItMatters.trim(),
    directionStatus: 'EXPLORANDO',
    reason: 'confirmed_why_without_direction',
  };
}

export function reviewPurposeQuestion(plan: ReviewPurposePlan): string {
  if (plan.whyStatus === 'CONFIRMED' && plan.whyItMatters?.trim()) {
    return `¿Esto sigue sirviendo a: ${plan.whyItMatters.trim()}?`;
  }
  return GOAL_QUESTION;
}

/** Re-export for tests documenting allowed working directions. */
export const WORKING_DIRECTION_STATUSES = WORKING_DIRECTIONS;
