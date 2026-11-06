import { apiDiagnosticOutroSeen, apiDiagnosticState, type DiagnosticState } from '@/lib/api';

export function ambitoPathForTerritory(
  territory: string,
  hint?: 'territory_complete' | 'territory_pause',
): string {
  const base = `/ambito/${encodeURIComponent(territory)}`;
  if (hint === 'territory_complete') return `${base}?cuestionario=completo`;
  if (hint === 'territory_pause') return `${base}?cuestionario=pausa`;
  return base;
}

/** Marks the finished module seen and returns the next real step. */
export async function continuePastModule(token: string, moduleSlug: string): Promise<DiagnosticState> {
  await apiDiagnosticOutroSeen(token, moduleSlug);
  return apiDiagnosticState(token);
}

export async function settleModuleOutro(token: string, state: DiagnosticState): Promise<DiagnosticState> {
  if (state.nextStep.type !== 'module_outro') return state;
  if (state.nextStep.data.moduleSlug === 'e-aud-s6') return state;
  return continuePastModule(token, state.nextStep.data.moduleSlug);
}

type DiagnosticRouter = { replace: (path: string) => void; push?: (path: string) => void };

export function routeDiagnosticFromState(
  state: DiagnosticState,
  router: DiagnosticRouter,
  mode: 'replace' | 'push' = 'replace',
) {
  const go = mode === 'push' && router.push ? router.push.bind(router) : router.replace.bind(router);

  if (state.sessionState.showWelcomeScreen) {
    go('/diagnostico/bienvenida');
    return;
  }

  const { nextStep, sessionState } = state;

  if (nextStep.type === 'territory_complete' || nextStep.type === 'territory_pause') {
    go(ambitoPathForTerritory(nextStep.data.territory, nextStep.type));
    return;
  }
  if (nextStep.type === 'phase_end') {
    go('/diagnostico/resultado');
    return;
  }
  if (nextStep.type === 'question' && sessionState.currentModuleSlug) {
    go(`/diagnostico/modulo/${sessionState.currentModuleSlug}/pregunta`);
    return;
  }
  if (nextStep.type === 'module_outro') {
    go(`/diagnostico/outro/${nextStep.data.moduleSlug}`);
    return;
  }
  if (nextStep.type === 'diagnostic_complete') {
    go('/diagnostico/resultado');
    return;
  }
  go('/diagnostico/bienvenida');
}
