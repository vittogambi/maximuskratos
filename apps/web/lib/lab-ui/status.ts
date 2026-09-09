/**
 * Human status and session progress for a Lab run. Pure functions: no fetching, no React.
 * The machine state stays in the backend; here it only decides what the admin reads and does next.
 */

export interface LabRunProgress {
  status: string;
  served?: number | null;
  answered?: number;
  skipped?: number;
  has_expectation?: boolean;
  has_review?: boolean;
  has_case_verdict?: boolean;
  has_purpose?: boolean;
  has_product_review?: boolean;
  purpose_answered?: boolean;
  skipped_expectation?: boolean;
  has_findings?: boolean;
}

export type LabStepId =
  | 'case'
  | 'responses'
  | 'prediction'
  | 'result'
  | 'review'
  | 'verdict'
  | 'purpose'
  | 'experience'
  | 'change';

export type LabStepState = 'DONE' | 'CURRENT' | 'AVAILABLE' | 'LOCKED';

export interface LabStep {
  id: LabStepId;
  label: string;
  state: LabStepState;
  /** Why the step is not reachable yet. Only present when state is LOCKED. */
  lockedReason?: string;
}

export interface LabRunHumanStatus {
  /** Short label for lists and headers. Never a raw machine state. */
  label: string;
  /** Primary action text, or null when there is nothing left to do. */
  cta: string | null;
  /** Step the primary action leads to. */
  step: LabStepId;
  tone: 'pending' | 'progress' | 'done' | 'error';
  complete: boolean;
}

export const STEP_LABELS: Record<LabStepId, string> = {
  case: 'Caso',
  responses: 'Respuestas',
  prediction: 'Tu lectura',
  result: 'Resultado',
  review: 'Revisión',
  verdict: 'Cierre',
  purpose: 'Propósito y dirección',
  experience: 'Probar cómo se vería en MK',
  change: 'Cambio en evaluación',
};

/** Visible run architecture. Review and close stay internal. */
export const PRIMARY_STEPS: LabStepId[] = ['case', 'prediction', 'result'];

export const SECONDARY_STEPS: LabStepId[] = ['purpose', 'experience'];

const STEP_ORDER: LabStepId[] = [
  'case',
  'responses',
  'prediction',
  'result',
  'review',
  'verdict',
  ...SECONDARY_STEPS,
];

export function getLabRunHumanStatus(run: LabRunProgress): LabRunHumanStatus {
  if (run.status === 'FAILED') {
    return {
      label: 'Caso con fallo técnico',
      cta: 'Ver el caso',
      step: 'responses',
      tone: 'error',
      complete: false,
    };
  }
  if (run.status === 'COLLECTING') {
    return {
      label: 'Listo para revisar el caso',
      cta: 'Continuar',
      step: 'case',
      tone: 'pending',
      complete: false,
    };
  }
  if (run.status === 'REVEALED' && run.has_case_verdict) {
    return {
      label: 'Matriz revisada',
      cta: 'Ver resultado',
      step: 'result',
      tone: 'done',
      complete: true,
    };
  }
  if (!run.has_expectation) {
    return {
      label: 'Falta tu criterio',
      cta: 'Registrar tu criterio',
      step: 'prediction',
      tone: 'progress',
      complete: false,
    };
  }
  if (run.status !== 'REVEALED') {
    return {
      label: 'Criterio registrado',
      cta: 'Ver el resultado de la Matriz',
      step: 'result',
      tone: 'progress',
      complete: false,
    };
  }
  if (!run.has_review || !run.has_case_verdict) {
    return {
      label: 'Resultado disponible',
      cta: 'Continuar',
      step: 'result',
      tone: 'progress',
      complete: false,
    };
  }
  return {
    label: 'Matriz revisada',
    cta: 'Ver resultado',
    step: 'result',
    tone: 'done',
    complete: true,
  };
}

export function buildLabSteps(run: LabRunProgress): LabStep[] {
  const frozen = run.status !== 'COLLECTING';
  const predicted = Boolean(run.has_expectation);
  const revealed = run.status === 'REVEALED';

  const done: Record<LabStepId, boolean> = {
    case: frozen,
    responses: frozen,
    prediction: predicted,
    result: revealed && Boolean(run.has_case_verdict),
    review: Boolean(run.has_review),
    verdict: Boolean(run.has_case_verdict),
    purpose: Boolean(run.has_purpose),
    experience: Boolean(run.has_product_review),
    change: false,
  };

  const locked: Partial<Record<LabStepId, string>> = {};
  if (!frozen) locked.prediction = 'Disponible después de cerrar las respuestas.';
  if (!revealed) {
    const reason = predicted
      ? 'Disponible después de ver el resultado de la Matriz.'
      : 'Disponible después de registrar tu criterio.';
    locked.result = predicted ? 'Disponible al revelar el resultado.' : reason;
    locked.review = reason;
    locked.verdict = reason;
    locked.purpose = reason;
    locked.experience = reason;
    locked.change = reason;
  }

  let currentAssigned = false;
  return STEP_ORDER.map((id) => {
    const lockedReason = locked[id];
    if (lockedReason) {
      return { id, label: STEP_LABELS[id], state: 'LOCKED' as LabStepState, lockedReason };
    }
    if (done[id]) {
      return { id, label: STEP_LABELS[id], state: 'DONE' as LabStepState };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { id, label: STEP_LABELS[id], state: 'CURRENT' as LabStepState };
    }
    return { id, label: STEP_LABELS[id], state: 'AVAILABLE' as LabStepState };
  });
}

export function isStepReachable(steps: LabStep[], id: LabStepId): boolean {
  return steps.find((step) => step.id === id)?.state !== 'LOCKED';
}

export function isMatrixReviewComplete(run: LabRunProgress): boolean {
  return run.status === 'REVEALED' && Boolean(run.has_case_verdict);
}

export function matrixTrackLabel(run: LabRunProgress): string {
  if (run.status === 'FAILED') return 'Fallo técnico';
  if (isMatrixReviewComplete(run)) return 'Cerrado';
  if (run.has_findings) return 'Con hallazgo';
  if (run.has_review) return 'En revisión';
  if (run.status === 'REVEALED') return 'Resultado listo';
  if (run.has_expectation || run.status === 'AWAITING_EXPECTATION') return 'En revisión';
  return 'Pendiente';
}

export function purposeTrackLabel(run: LabRunProgress, purposeAnswered?: number): string {
  if (purposeAnswered === 0 || run.purpose_answered === false) {
    return 'Sin información en este caso';
  }
  return run.has_purpose ? 'Registrado' : 'Pendiente';
}

export function productTrackLabel(run: LabRunProgress): string {
  return run.has_product_review ? 'Revisada' : 'Pendiente';
}
