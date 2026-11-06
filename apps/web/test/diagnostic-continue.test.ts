import { describe, expect, it } from 'vitest';
import { ambitoPathForTerritory, routeDiagnosticFromState } from '@/lib/diagnostic-continue';
import type { DiagnosticState } from '@/lib/api';

describe('routeDiagnosticFromState', () => {
  it('sends territory_complete to the ámbito screen', () => {
    const paths: string[] = [];
    const state = {
      sessionState: { showWelcomeScreen: false, currentModuleSlug: null },
      nextStep: { type: 'territory_complete' as const, data: { territory: 'FINANZAS' } },
    } as DiagnosticState;
    routeDiagnosticFromState(state, { replace: (path) => paths.push(path) });
    expect(paths).toEqual([ambitoPathForTerritory('FINANZAS', 'territory_complete')]);
  });

  it('sends a finished questionnaire to the stored-answers screen, not a profile', () => {
    const paths: string[] = [];
    const state = {
      sessionState: { showWelcomeScreen: false, currentModuleSlug: null },
      nextStep: { type: 'diagnostic_complete' as const, data: { archetypePrimary: 'sin-clasificar', selfKnowledgePct: 100 } },
    } as DiagnosticState;
    routeDiagnosticFromState(state, { replace: (path) => paths.push(path) });
    expect(paths).toEqual(['/diagnostico/resultado']);
  });
});
