import type { DiagnosticState } from '@/lib/api';

const KEY = 'dk_outro_bootstrap';

export function stashOutroBootstrap(state: DiagnosticState): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function readOutroBootstrap(): DiagnosticState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiagnosticState;
  } catch {
    return null;
  }
}

export function clearOutroBootstrap(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
