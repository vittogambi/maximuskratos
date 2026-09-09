export { ENGINE_SEMVER, EXPECTED_SOURCE_SHA256, LAB_INTERPRETATION_IDS } from './types';
export type {
  ImportReport,
  ImportResult,
  MatrixDefinition,
  PolicyDefinition,
  ResponseInput,
  ResultSnapshot,
  TraceNode,
  ValidationIssue,
} from './types';
export { MatrixImportError } from './types';
export {
  canonicalize,
  definitionSha256,
  hashResponses,
  verifyDefinitionHash,
} from './engine/hash';
export { importMatrix } from './import/xlsx-importer';
export { normalizeItem, formulaScore01 } from './engine/normalize';
export { scoreDimensions, scoreDomains, itemWeightedDomainScore } from './engine/score';
export { computeCoverage, computeDimensionCoverage, classifyCoverage, gateDomainScore } from './engine/coverage';
export { assignState, roundHalfUp, distanceToBandEdge } from './engine/state';
export { STATE_BANDS, BAND_CUTS, COVERAGE_BANDS, PLAN_DOMAINS } from './constants';
export { evaluateSafety, applyOverrides } from './engine/safety';
export { selectPriority } from './engine/priority';
export { buildRecommendations } from './engine/recommend';
export { runAssessment } from './engine/run-assessment';
export { toDiagnosticContract, diagnosticContractsEqual } from './engine/diagnostic-contract';
export type { DiagnosticContract } from './engine/diagnostic-contract';
export { formatSummary, formatWhy, formatTrace } from './engine/explain';
export { indexTrace, walkTrace } from './engine/trace';
export { classifyResponses } from './engine/responses';
export { FULL_POLICY, resolveServedQuestionIds } from './policy/resolve-served';
export {
  buildPolicyPlan,
  namedPolicy,
  AUD_ONLY_POLICY,
  AUD_PLUS_CORE_POLICY,
  AUD_PLUS_BRANCHES_POLICY,
} from './policy/build-policy-plan';
export { formatReport } from './import/report';
export { validateDefinition } from './import/validate';
export { buildInterpretations } from './interpretations';
export { fixtureCatalog, FIXTURE_KEYS } from './fixtures/catalog';
export { materializeFixture, likertForK } from './fixtures/materialize';
export { listFixtureCases, runMaterialized, stripGeneratedAt } from './fixtures/run-fixture';
export { applyChangeOperations, isNoopChange } from './changeset/apply-operations';
export type { ChangeOperation } from './changeset/apply-operations';
export { compareSnapshots, replayMethodology } from './engine/replay';
export {
  loadSourceMappings,
  sourceMappingById,
  loadMigrationLedger,
} from './source-mapping';
export type { SourceMapping, MigrationLedgerRow, SourceTransformation } from './source-mapping';
export {
  diffNoBorrarCatalogs,
  extractNoBorrarItems,
  ideaLabelsFromSource,
  loadLegacyCatalogDiffFromRepo,
} from './legacy/no-borrar-diff';
export type { LegacyCatalogRow, LegacyCatalogStatus } from './legacy/no-borrar-diff';
