import { describe, expect, it } from 'vitest';
import { PLAN_DOMAINS, buildRecommendations } from '../src';
import type { DomainResult } from '../src/types';
import { loadFrozen } from './helpers/assessment';

function classifiedDomain(key: string, state: string): DomainResult {
  return {
    key,
    coverage_definition: 1,
    coverage_served: 1,
    classification: 'INTERPRETABLE',
    score: 50,
    score_display: 50,
    state_from_band: state,
    state_final: state,
    state_source: 'BAND',
    state_rule_id: 'R-STATE-01',
    distance_to_band_edge: 0,
    dimensions_used: 1,
  };
}

describe('ROUTE_COMPLETE', () => {
  it('every valid diagnostic domain × state has a unique route', () => {
    const definition = loadFrozen();
    const states = definition.state_bands.map((band) => band.state);
    const gaps: string[] = [];

    for (const domain of PLAN_DOMAINS) {
      for (const state of states) {
        const matches = definition.plans.filter(
          (plan) => plan.domain === domain && plan.state === state,
        );
        if (matches.length > 1) {
          gaps.push(`${domain} × ${state} → rutas múltiples`);
          continue;
        }
        if (matches.length === 0) {
          gaps.push(`${domain} × ${state} → sin ruta`);
          continue;
        }

        const selected = buildRecommendations(
          definition,
          [classifiedDomain(domain, state)],
          [],
          domain,
          null,
        ).primary;

        if (!selected?.plan_id) {
          gaps.push(`${domain} × ${state} → sin ruta`);
        }
      }
    }

    expect(PLAN_DOMAINS.length * states.length).toBeGreaterThan(0);
    expect(gaps, gaps.join('\n')).toEqual([]);
  });
});
