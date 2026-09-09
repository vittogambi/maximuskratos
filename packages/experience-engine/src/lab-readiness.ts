export interface ReadinessInput {
  contractsPass: boolean;
  safetyPass: boolean;
  enginePass: boolean;
  openCriticalFindings: number;
  coreFamiliesReviewed: boolean;
  pendingCoreFamilies: string[];
  allIncludedChangesReplayed: boolean;
  openCriticalRegressions: number;
  knownLimitationsDocumented: boolean;
  explicitDecisionReady: boolean;
  blockingQuestionnaireIssues?: number;
}

export function readinessMissing(input: ReadinessInput): string[] {
  const missing: string[] = [];
  if (!input.contractsPass) missing.push('Contratos técnicos correctos');
  if (!input.safetyPass) missing.push('Invariantes de alerta correctas');
  if (!input.enginePass) missing.push('Pruebas del motor correctas');
  if (input.openCriticalFindings > 0) {
    missing.push(`${input.openCriticalFindings} hallazgo${input.openCriticalFindings === 1 ? '' : 's'} crítico${input.openCriticalFindings === 1 ? '' : 's'} abierto${input.openCriticalFindings === 1 ? '' : 's'}`);
  }
  if (!input.coreFamiliesReviewed) {
    missing.push(
      input.pendingCoreFamilies.length
        ? `Pruebas core sin revisar: ${input.pendingCoreFamilies.join(', ')}`
        : 'Pruebas core revisadas',
    );
  }
  if (!input.allIncludedChangesReplayed) {
    missing.push('Volver a probar los casos revisados para cada cambio incluido');
  }
  if (input.openCriticalRegressions > 0) {
    missing.push(`${input.openCriticalRegressions} regresión${input.openCriticalRegressions === 1 ? '' : 'es'} crítica${input.openCriticalRegressions === 1 ? '' : 's'} sin resolver`);
  }
  if (!input.knownLimitationsDocumented) {
    missing.push('Limitaciones conocidas documentadas');
  }
  if ((input.blockingQuestionnaireIssues ?? 0) > 0) {
    missing.push(
      `${input.blockingQuestionnaireIssues} problema${input.blockingQuestionnaireIssues === 1 ? '' : 's'} de contenido de pregunta sin resolver`,
    );
  }
  if (!input.explicitDecisionReady) {
    missing.push('Decisión final explícita: Lista para siguiente etapa');
  }
  return missing;
}

export function readinessCopy(missing: string[]): string | null {
  if (missing.length) return null;
  return 'Esta versión candidata está suficientemente alineada con el criterio metodológico registrado para avanzar a la siguiente etapa.';
}

export const CORE_FAMILY_IDS = [
  'baseline',
  'one_low',
  'two_low',
  'tie',
  'edge_39_40',
  'edge_59_60',
  'edge_79_80',
  'insufficient',
  'safety_critical',
  'safety_high_unclassified',
  'same_headline',
  'aud_vs_full',
] as const;

export type CoreFamilyId = (typeof CORE_FAMILY_IDS)[number];
