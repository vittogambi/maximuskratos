import type { MatrixDefinition } from '@mk/matrix-engine';
import { PURPOSE_MODULE_KEYS, purposeModuleKey } from '@mk/experience-engine';

type QuestionDefinition = MatrixDefinition['questions'][number];
type ScaleDefinition = MatrixDefinition['scales'][number];

const DOMAIN_ORDER = ['MENTALIDAD', 'RELACIONES', 'FINANZAS', 'CUERPO', 'PROPÓSITO'] as const;

function choiceAnchors(scale: ScaleDefinition) {
  if (scale.kind !== 'CHOICE' || scale.anchors.length !== 1) return scale.anchors;
  const only = scale.anchors[0];
  if (only.value != null) return scale.anchors;
  const parts = only.label.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return scale.anchors;
  return parts.map((label) => ({ value: label, label, score: only.score }));
}

export function serializeScale(scale: ScaleDefinition | undefined) {
  if (!scale) return null;
  return {
    id: scale.id,
    kind: scale.kind,
    anchors: choiceAnchors(scale).map((anchor) => ({
      value: anchor.value,
      label: anchor.label,
      score: anchor.score,
    })),
  };
}

export function buildQuestionnaireBlueprint(
  definition: MatrixDefinition,
  servedIds: string[],
) {
  const served = new Set(servedIds);
  const scaleById = new Map(definition.scales.map((item) => [item.id, item]));
  const dimLabel = new Map(definition.dimensions.map((item) => [item.key, item.labels[0] ?? item.key]));
  const byDomain = new Map<string, QuestionDefinition[]>();
  for (const question of definition.questions) {
    if (!served.has(question.id)) continue;
    const list = byDomain.get(question.domain) ?? [];
    list.push(question);
    byDomain.set(question.domain, list);
  }
  const domains = DOMAIN_ORDER.filter((key) => byDomain.has(key)).map((key) => {
    const questions = byDomain.get(key) ?? [];
    const dimOrder: string[] = [];
    for (const question of questions) {
      if (!dimOrder.includes(question.dimension)) dimOrder.push(question.dimension);
    }
    return {
      key,
      total: questions.length,
      sections: dimOrder.map((dimension) => ({
        key: dimension,
        label: dimLabel.get(dimension) ?? dimension,
        question_ids: questions.filter((item) => item.dimension === dimension).map((item) => item.id),
      })),
    };
  });
  return {
    domains,
    purpose_modules: definition.purpose_modules
      .filter((item) => item.key !== 'ALINEACIÓN')
      .map((item) => ({
        key: item.key,
        name: item.name,
        order: item.order,
      })),
    phases: buildQuestionnairePhases(definition, servedIds),
    scales: definition.scales.map((item) => serializeScale(item)),
    total_served: servedIds.length,
  };
}

export const PURPOSE_EDITOR_KEYS = PURPOSE_MODULE_KEYS;

export function buildQuestionnairePhases(definition: MatrixDefinition, servedIds: string[]) {
  const served = new Set(servedIds);
  const questions = definition.questions.filter((item) => served.has(item.id));
  const ids = (test: (item: QuestionDefinition) => boolean) => questions.filter(test).map((item) => item.id);
  const modules = PURPOSE_EDITOR_KEYS.map((key) => {
    const meta = definition.purpose_modules.find((item) => item.key === key);
    return {
      key,
      name: meta?.name ?? key,
      question_ids: ids((item) => purposeModuleKey(item) === key),
    };
  }).filter((item) => item.question_ids.length > 0);
  return [
    {
      key: 'auditoria',
      chip: 'Auditoría',
      title: 'Auditoría inicial',
      help: 'Primera lectura de los cuatro ámbitos. No reemplaza el diagnóstico.',
      question_ids: ids((item) => item.id.startsWith('AUD-')),
    },
    {
      key: 'cuerpo',
      chip: 'Cuerpo',
      title: 'Radiografía de cuerpo',
      help: 'Sueño, movimiento, alimentación, seguridad y objetivo. Las alertas no puntúan como estado.',
      question_ids: [...ids((item) => item.id.startsWith('D-CUE-')), ...ids((item) => item.id.startsWith('P-CUE-'))],
    },
    {
      key: 'relaciones',
      chip: 'Relaciones',
      title: 'Radiografía de relaciones',
      help: null,
      question_ids: ids((item) => item.id.startsWith('D-REL-')),
    },
    {
      key: 'finanzas',
      chip: 'Finanzas',
      title: 'Radiografía de finanzas',
      help: null,
      question_ids: ids((item) => item.id.startsWith('D-FIN-')),
    },
    {
      key: 'mentalidad',
      chip: 'Mentalidad',
      title: 'Diagnóstico de mentalidad',
      help: null,
      question_ids: ids((item) => item.id.startsWith('D-MEN-')),
    },
    {
      key: 'proposito',
      chip: 'Propósito',
      title: 'Propósito',
      help: 'Conserva hacia dónde quiere construir esta persona. No entra al diagnóstico.',
      question_ids: ids((item) => item.domain === 'PROPÓSITO' || item.domain === 'PURPOSE'),
      modules,
    },
  ].filter((item) => item.question_ids.length > 0);
}

export function questionScalePayload(definition: MatrixDefinition, question: QuestionDefinition | undefined) {
  if (!question) return null;
  return serializeScale(definition.scales.find((item) => item.id === question.scale_id));
}
