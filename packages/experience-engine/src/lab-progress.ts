export interface LabProgressInput {
  status: string;
  skipped_expectation?: boolean;
  has_expectation?: boolean;
  has_review?: boolean;
  has_case_verdict?: boolean;
  has_purpose?: boolean;
  has_product_review?: boolean;
}

export interface DualTrackStatus {
  complete: boolean;
  label: string;
  tone: 'pending' | 'progress' | 'done' | 'warn' | 'error';
}

/** Matrix review is independent from Purpose and Product. A case is closed when Rafa records a verdict. */
export function isMatrixReviewComplete(run: LabProgressInput): boolean {
  if (run.status !== 'REVEALED') return false;
  return Boolean(run.has_case_verdict);
}

export function isProductReviewComplete(run: LabProgressInput): boolean {
  return Boolean(run.has_product_review);
}

export function isPurposeComplete(run: LabProgressInput): boolean {
  return Boolean(run.has_purpose);
}

export function matrixTrackStatus(run: LabProgressInput): DualTrackStatus {
  if (run.status === 'FAILED') {
    return { complete: false, label: 'Fallo técnico', tone: 'error' };
  }
  if (isMatrixReviewComplete(run)) {
    return { complete: true, label: 'Revisada', tone: 'done' };
  }
  if (run.has_review) {
    return { complete: false, label: 'Falta cerrar la revisión', tone: 'progress' };
  }
  if (run.status === 'REVEALED') {
    return { complete: false, label: 'Hay que entender la diferencia', tone: 'progress' };
  }
  if (run.has_expectation || run.status === 'AWAITING_EXPECTATION') {
    return { complete: false, label: 'En curso', tone: 'progress' };
  }
  return { complete: false, label: 'Pendiente', tone: 'pending' };
}

export function purposeTrackStatus(run: LabProgressInput): DualTrackStatus {
  if (isPurposeComplete(run)) {
    return { complete: true, label: 'Registrado', tone: 'done' };
  }
  return { complete: false, label: 'Pendiente', tone: 'pending' };
}

export function productTrackStatus(run: LabProgressInput): DualTrackStatus {
  if (isProductReviewComplete(run)) {
    return { complete: true, label: 'Revisada', tone: 'done' };
  }
  return { complete: false, label: 'Pendiente', tone: 'pending' };
}

export function disagreementFromVerdicts(verdicts: Record<string, unknown> | null): boolean {
  if (!verdicts) return false;
  const values = flattenVerdicts(verdicts);
  return values.some((value) => value === 'INCORRECT' || value === 'PARTIAL');
}

function flattenVerdicts(verdicts: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const value of Object.values(verdicts)) {
    if (typeof value === 'string') out.push(value);
    else if (value && typeof value === 'object') {
      out.push(...flattenVerdicts(value as Record<string, unknown>));
    }
  }
  return out;
}
