import type { MatrixDefinition } from '@mk/matrix-engine';
import { PLAN_DOMAINS, sourceMappingById } from '@mk/matrix-engine';
import { isPurposeDomain } from '@mk/experience-engine';
import { originTypeFromMapping } from './lab-provenance';

export type QuestionRole =
  | 'Puntaje'
  | 'Alerta'
  | 'Cobertura'
  | 'Ruta'
  | 'Contexto'
  | 'Dirección'
  | 'Seguimiento';

export type IntegrityKind = 'ok' | 'without_role' | 'without_current_consumer' | 'broken_config';

type QuestionDefinition = MatrixDefinition['questions'][number];

const PLANED = PLAN_DOMAINS as readonly string[];

function isDiagnosticDomain(domain: string): boolean {
  return PLANED.includes(domain);
}

export function questionRoles(question: QuestionDefinition): QuestionRole[] {
  const roles = new Set<QuestionRole>();
  const purpose = isPurposeDomain(question.domain);
  const diagnostic = isDiagnosticDomain(question.domain);
  if (question.scoreable && diagnostic) {
    roles.add('Puntaje');
    roles.add('Cobertura');
  }
  if (question.risk) roles.add('Alerta');
  if (purpose) roles.add('Dirección');
  if (question.metric_key) roles.add('Seguimiento');
  if (question.plan_selector && diagnostic && question.scoreable) roles.add('Ruta');
  if (
    !purpose &&
    diagnostic &&
    !question.scoreable &&
    !question.risk &&
    (question.variable_kind === 'NARRATIVA' ||
      question.variable_kind === 'PREFERENCIA' ||
      question.variable_kind === 'RECURSO' ||
      question.variable_kind === 'DATO')
  ) {
    roles.add('Contexto');
  }
  return [...roles];
}

export function questionFunctionalConsumer(question: QuestionDefinition): string {
  const roles = questionRoles(question);
  if (roles.includes('Puntaje')) return `Cálculo de ${question.dimension || question.domain}.`;
  if (roles.includes('Alerta')) return `Alerta de ${question.domain}.`;
  if (roles.includes('Dirección')) return 'Lectura de dirección y revisión metodológica.';
  if (roles.includes('Contexto')) return 'Revisión metodológica.';
  if (roles.includes('Seguimiento')) return 'Métrica de seguimiento.';
  return 'Ninguno implementado todavía.';
}

export function questionSurface(): string {
  return 'Lab';
}

export function questionFutureConsumer(question: QuestionDefinition): string | null {
  if (isPurposeDomain(question.domain)) return 'Motor de Intervención.';
  return null;
}

export function questionDoesNotModify(question: QuestionDefinition): string | null {
  if (isPurposeDomain(question.domain)) {
    return 'puntaje, estado, cobertura diagnóstica, alertas ni ámbito prioritario';
  }
  return null;
}

function brokenConfig(question: QuestionDefinition, roles: QuestionRole[]): string | null {
  if (roles.includes('Puntaje') && !question.dimension) return 'Puntaje sin dimensión.';
  if (roles.includes('Puntaje') && question.unscoreable_reason) return 'Puntaje sin mapping válido.';
  if (roles.includes('Alerta') && !question.risk) return 'Alerta sin regla.';
  if (roles.includes('Ruta') && !question.plan_selector) return 'Ruta sin selector.';
  return null;
}

export function questionIntegrity(
  question: QuestionDefinition,
  roles: QuestionRole[],
): { kind: IntegrityKind; warning: string | null } {
  const broken = brokenConfig(question, roles);
  if (broken) return { kind: 'broken_config', warning: broken };
  if (roles.length === 0) {
    return {
      kind: 'without_role',
      warning: 'Esta información no tiene una función definida en la versión actual.',
    };
  }
  if (questionFunctionalConsumer(question) === 'Ninguno implementado todavía.') {
    return {
      kind: 'without_current_consumer',
      warning: 'Tiene un rol, pero todavía no hay un consumidor implementado.',
    };
  }
  return { kind: 'ok', warning: null };
}

export function buildQuestionBank(definition: MatrixDefinition) {
  const questions = definition.questions.map((question) => {
    const roles = questionRoles(question);
    const integrity = questionIntegrity(question, roles);
    const mapping = sourceMappingById(question.id);
    return {
      id: question.id,
      text: question.text,
      domain: question.domain,
      dimension: question.dimension,
      roles,
      functional_consumer: questionFunctionalConsumer(question),
      surface: questionSurface(),
      future_consumer: questionFutureConsumer(question),
      used_in: questionFunctionalConsumer(question),
      does_not_modify: questionDoesNotModify(question),
      participates_in_score: roles.includes('Puntaje'),
      affects_coverage: roles.includes('Cobertura'),
      can_trigger_safety: roles.includes('Alerta'),
      informs_direction: roles.includes('Dirección'),
      integrity: integrity.kind,
      warning: integrity.warning,
      source_form: mapping?.source_form ?? null,
      source_section: mapping?.source_section ?? null,
      source_question: mapping?.source_question ?? null,
      transformation_type: mapping?.transformation_type ?? null,
      confidence: mapping?.confidence ?? null,
      review_needed_by_rafa: mapping?.review_needed_by_rafa ?? null,
      why_changed: mapping?.why_changed ?? null,
      origin_type: mapping ? originTypeFromMapping(mapping) : null,
    };
  });
  return {
    questions,
    total: questions.length,
    without_role: questions.filter((item) => item.integrity === 'without_role').length,
    without_current_consumer: questions.filter((item) => item.integrity === 'without_current_consumer').length,
    broken_config: questions.filter((item) => item.integrity === 'broken_config').length,
    without_function: questions.filter((item) => item.integrity === 'without_role').length,
  };
}
