import { ENGINE_SEMVER } from '../types';
import { runAssessment } from '../engine/run-assessment';
import type { MatrixDefinition, ResultSnapshot } from '../types';
import { fixtureCatalog } from './catalog';
import { materializeFixture } from './materialize';
import type { GoldenSnapshot, MaterializedFixture } from './types';

export const FIXTURE_NOW = '2026-08-25T12:00:00.000Z';

export function listFixtureCases(definition: MatrixDefinition): MaterializedFixture[] {
  return fixtureCatalog(definition).flatMap((family) =>
    family.cases.map((spec) => materializeFixture(definition, family.key, spec)),
  );
}

export function runMaterialized(
  definition: MatrixDefinition,
  fixture: MaterializedFixture,
  now = FIXTURE_NOW,
): ResultSnapshot {
  return runAssessment({
    definition,
    responses: fixture.responses,
    policy: fixture.policy,
    engineSemver: ENGINE_SEMVER,
    now,
  });
}

export function stripGeneratedAt(snapshot: ResultSnapshot): GoldenSnapshot {
  const { generated_at: _generatedAt, ...rest } = snapshot;
  return rest;
}

export function goldenName(familyKey: string, caseId: string): string {
  return caseId === 'main' ? familyKey : `${familyKey}.${caseId}`;
}
