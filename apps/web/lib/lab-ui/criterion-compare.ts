import { isUnsureValue, comparePriority } from './compare';
import { labUiLabels } from './labels';

export type CriterionStance = 'ROUTE' | 'DOMAIN_ONLY' | 'NO_DOMAIN' | 'UNSURE' | '';

export const CRITERION_STANCE_OPTIONS = [
  { value: 'ROUTE', label: 'Elegiría un ámbito prioritario y propondría una ruta' },
  { value: 'DOMAIN_ONLY', label: 'Elegiría un ámbito prioritario, pero todavía no propondría una ruta' },
  { value: 'NO_DOMAIN', label: 'Todavía no elegiría un ámbito' },
  { value: 'UNSURE', label: 'No estoy seguro' },
] as const;

const STANCES = new Set(['ROUTE', 'DOMAIN_ONLY', 'NO_DOMAIN', 'UNSURE']);

export function stanceFromRecord(input: {
  open_first_action?: string | null;
  openFirstAction?: string | null;
  personal_first_domain?: string | null;
  personalFirstDomain?: string | null;
}): CriterionStance {
  const action = input.open_first_action ?? input.openFirstAction ?? '';
  if (STANCES.has(action)) return action as CriterionStance;
  const domain = input.personal_first_domain ?? input.personalFirstDomain ?? '';
  if (!domain || isUnsureValue(domain)) return domain ? 'UNSURE' : '';
  if (domain === 'NONE') return 'NO_DOMAIN';
  return 'DOMAIN_ONLY';
}

export function canRevealCriterion(input: {
  open_first_action?: string | null;
  personal_first_domain?: string | null;
}): boolean {
  const stance = stanceFromRecord(input);
  if (!stance) return false;
  if (stance === 'ROUTE' || stance === 'DOMAIN_ONLY') {
    const domain = input.personal_first_domain ?? '';
    return Boolean(domain) && domain !== 'UNSURE' && domain !== 'NONE';
  }
  return true;
}

export type CriterionCompareInput = {
  stance: CriterionStance;
  personalDomain: string | null | undefined;
  expectedState?: string | null;
  expectedPlanId?: string | null;
  matrixDomain: string | null | undefined;
  matrixState: string | null | undefined;
  matrixPlanName: string | null | undefined;
  matrixBlocked?: boolean;
};

export type CriterionCompareRow = { label: string; you: string; matrix: string };

export type CriterionCompareView = {
  rows: CriterionCompareRow[];
  phrase: string;
  firstDifference: 'prioridad' | 'ruta' | 'estado' | null;
};

function youFirst(stance: CriterionStance, domain: string | null | undefined): string {
  if (stance === 'UNSURE' || !stance) return 'Sin un ámbito prioritario claro';
  if (stance === 'NO_DOMAIN') return 'Sin un ámbito prioritario claro';
  return domain ? labUiLabels.domain(domain) : 'Sin registrar';
}

function matrixFirst(domain: string | null | undefined): string {
  return domain ? labUiLabels.domain(domain) : 'Sin un ámbito prioritario claro';
}

function youRoute(stance: CriterionStance): string {
  if (stance === 'ROUTE') return 'Sí';
  if (stance === 'DOMAIN_ONLY' || stance === 'NO_DOMAIN') return 'No';
  return 'No';
}

function matrixRoute(planName: string | null | undefined, blocked?: boolean): string {
  if (blocked || !planName) return 'No';
  return 'Sí';
}

function youState(expectedState: string | null | undefined): string {
  if (!expectedState || isUnsureValue(expectedState)) return 'Sin predicción';
  if (expectedState === 'NO_CLASIFICADO') return 'No clasificado';
  return labUiLabels.state(expectedState);
}

function matrixStateLabel(state: string | null | undefined): string {
  if (!state) return 'No clasificado';
  return labUiLabels.state(state);
}

export function criterionVsMatrix(input: CriterionCompareInput): CriterionCompareView {
  const rows: CriterionCompareRow[] = [
    {
      label: 'Ámbito prioritario',
      you: youFirst(input.stance, input.personalDomain),
      matrix: matrixFirst(input.matrixDomain),
    },
    {
      label: '¿Indicar una ruta ahora?',
      you: youRoute(input.stance),
      matrix: matrixRoute(input.matrixPlanName, input.matrixBlocked),
    },
    {
      label: 'Estado esperado',
      you: youState(input.expectedState),
      matrix: matrixStateLabel(input.matrixState),
    },
  ];

  if (input.stance === 'UNSURE' || !input.stance) {
    return {
      rows,
      phrase: 'No registraste una decisión firme. Puedes revisar el resultado sin forzar una comparación.',
      firstDifference: null,
    };
  }

  const youDomain =
    input.stance === 'NO_DOMAIN' ? 'NONE' : input.personalDomain ?? 'NONE';
  const matrixDomain = input.matrixDomain ?? 'NONE';
  const priority = comparePriority(youDomain, matrixDomain);

  const youWantsRoute = input.stance === 'ROUTE';
  const matrixHasRoute = Boolean(input.matrixPlanName) && !input.matrixBlocked;
  const routeDiffers = youWantsRoute !== matrixHasRoute;

  const stateAnticipated = Boolean(input.expectedState && !isUnsureValue(input.expectedState));
  const stateDiffers =
    stateAnticipated && (input.expectedState ?? null) !== (input.matrixState ?? 'NO_CLASIFICADO');

  let firstDifference: CriterionCompareView['firstDifference'] = null;
  if (priority === 'DIFFERENT') firstDifference = 'prioridad';
  else if (routeDiffers) firstDifference = 'ruta';
  else if (stateDiffers) firstDifference = 'estado';

  if (!firstDifference) {
    const domainName = youDomain === 'NONE' ? null : labUiLabels.domain(youDomain);
    const routeBit = youWantsRoute ? 'y en proponer una ruta.' : 'y en no entregar todavía una ruta.';
    const phrase = domainName
      ? `Coinciden en elegir ${domainName} como ámbito prioritario ${routeBit}`
      : `Coinciden en no elegir todavía un ámbito ${routeBit}`;
    return { rows, phrase, firstDifference: null };
  }

  const where =
    firstDifference === 'prioridad'
      ? 'el ámbito prioritario'
      : firstDifference === 'ruta'
        ? 'si conviene una ruta ahora'
        : 'el estado';
  return {
    rows,
    phrase: `La primera diferencia entre tu lectura y la Matriz aparece en ${where}.`,
    firstDifference,
  };
}

export const UNSURE_CRITERION_COPY =
  'No registraste una decisión firme. Puedes revisar el resultado sin forzar una comparación.';
