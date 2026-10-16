import { apiDiagnosticOutroSeen, apiDiagnosticState, type DiagnosticState } from '@/lib/api';

/** Marks the finished module seen and returns the next real step. */
export async function continuePastModule(token: string, moduleSlug: string): Promise<DiagnosticState> {
  await apiDiagnosticOutroSeen(token, moduleSlug);
  return apiDiagnosticState(token);
}

export async function settleModuleOutro(token: string, state: DiagnosticState): Promise<DiagnosticState> {
  if (state.nextStep.type !== 'module_outro') return state;
  return continuePastModule(token, state.nextStep.data.moduleSlug);
}
