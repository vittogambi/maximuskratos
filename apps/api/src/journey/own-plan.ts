export type OwnPlanAction = {
  id: string;
  title: string;
  doneWhen: string;
  weekday: number | null;
  occasionsPerWeek: number | null;
  minutesPerOccasion: number | null;
};

export type OwnPlanGap =
  | 'OCCASION'
  | 'CRITERION'
  | 'HORIZON'
  | 'LOAD';

export type OwnPlanReading = {
  gaps: OwnPlanGap[];
  loadMinutes: number;
  declaredCapacityMinutes: number | null;
  loadExceedsDeclared: boolean;
  messages: string[];
};

function missingCriterion(action: OwnPlanAction): boolean {
  const text = action.doneWhen.trim();
  return !text || text.length < 4;
}

function missingOccasion(action: OwnPlanAction): boolean {
  return action.weekday == null && (action.occasionsPerWeek ?? 0) === 0;
}

export function readOwnPlan(input: {
  actions: OwnPlanAction[];
  reviewAt: string | null;
  capacityMinutes: number | null;
}): OwnPlanReading {
  const gaps = new Set<OwnPlanGap>();
  const messages: string[] = [];
  for (const action of input.actions) {
    if (missingOccasion(action)) gaps.add('OCCASION');
    if (missingCriterion(action)) gaps.add('CRITERION');
  }
  if (!input.reviewAt) {
    gaps.add('HORIZON');
    messages.push('Falta cuándo revisarás si el plan sigue teniendo sentido.');
  }
  const loadMinutes = input.actions.reduce(
    (sum, action) => sum + (action.minutesPerOccasion ?? 0) * (action.occasionsPerWeek ?? (action.weekday == null ? 0 : 1)),
    0,
  );
  const loadExceedsDeclared =
    input.capacityMinutes != null && input.capacityMinutes >= 0 && loadMinutes > input.capacityMinutes;
  if (loadExceedsDeclared) {
    gaps.add('LOAD');
    messages.push('La carga de las acciones supera los minutos que declaraste. Puedes ajustar antes de activar.');
  }
  if (gaps.has('OCCASION')) messages.push('Al menos una acción necesita día u ocasiones por semana.');
  if (gaps.has('CRITERION')) messages.push('Al menos una acción necesita un criterio hecho observable.');
  return {
    gaps: [...gaps],
    loadMinutes,
    declaredCapacityMinutes: input.capacityMinutes,
    loadExceedsDeclared,
    messages,
  };
}
