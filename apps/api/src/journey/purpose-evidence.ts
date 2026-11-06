import { IKIGAI_LISTAS } from '../instrumentos/ikigai-listas';
import { IKIGAI_FIELDS, type IkigaiField } from '../instrumentos/ikigai-lists';
import type { Activity } from './purpose-synthesis';

/**
 * Literal answers of the questionnaire parts Propósito may consult.
 * Nothing here is scored or interpreted. Exceptions are named as the person chose them.
 */
export const EVIDENCE_MODULES = {
  vision: 'e-per-vision',
  values: 'e-per-valores',
  ikigai: 'e-per-ikigai',
} as const;

export type EvidenceSectionId = keyof typeof EVIDENCE_MODULES;

export type EvidenceAnswerStatus = 'ANSWERED' | 'UNKNOWN' | 'DECLINED' | 'NOT_APPLICABLE' | 'PENDING' | 'SKIPPED' | 'EMPTY';

export type EvidenceItem = { status: EvidenceAnswerStatus; texts: string[] };

export type EvidenceGroup = {
  id: string;
  title: string;
  question: string | null;
  items: EvidenceItem[];
};

export type EvidenceAccess = 'ANSWERED' | 'CURRENT' | 'LATER' | 'NOT_STARTED' | 'CLOSED';

export type EvidenceSection = {
  id: EvidenceSectionId;
  title: string;
  moduleSlug: string;
  answered: number;
  total: number;
  groups: EvidenceGroup[];
  access: EvidenceAccess;
  href: string | null;
};

export type EvidenceQuestion = {
  moduleSlug: string;
  order: number;
  sourceRef: string | null;
  textEs: string;
};

export type EvidenceResponse = {
  sourceRef: string | null;
  moduleSlug: string;
  freeText: string | null;
  options: { order: number; textEs: string }[];
  exceptionKind: string | null;
  skipped: boolean;
};

export type EvidenceInput = {
  sessionStatus: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | null;
  moduleStatus: Partial<Record<string, 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETE'>>;
  questions: EvidenceQuestion[];
  responses: EvidenceResponse[];
  activities: Activity[];
};

const TITLES: Record<EvidenceSectionId, string> = {
  vision: 'Visión',
  values: 'Valores',
  ikigai: 'IKIGAI',
};

function itemFor(response: EvidenceResponse | undefined): EvidenceItem {
  if (!response) return { status: 'EMPTY', texts: [] };
  const kind = response.exceptionKind;
  if (kind === 'UNKNOWN' || kind === 'DECLINED' || kind === 'NOT_APPLICABLE' || kind === 'PENDING') {
    return { status: kind, texts: [] };
  }
  if (response.skipped) return { status: 'SKIPPED', texts: [] };
  const options = [...response.options].sort((left, right) => left.order - right.order).map((row) => row.textEs.trim()).filter(Boolean);
  const free = response.freeText?.trim() ?? '';
  const texts = options.length ? options : free ? [free] : [];
  return texts.length ? { status: 'ANSWERED', texts } : { status: 'EMPTY', texts: [] };
}

function accessFor(input: EvidenceInput, slug: string, answered: number): { access: EvidenceAccess; href: string | null } {
  if (!input.sessionStatus) return { access: 'NOT_STARTED', href: '/diagnostico?alcance=general' };
  const status = input.moduleStatus[slug];
  if (input.sessionStatus !== 'ACTIVE') return { access: answered ? 'ANSWERED' : 'CLOSED', href: null };
  if (status === 'COMPLETE') return { access: 'ANSWERED', href: null };
  if (status === 'AVAILABLE' || status === 'IN_PROGRESS') return { access: 'CURRENT', href: '/diagnostico' };
  return { access: 'LATER', href: '/diagnostico' };
}

function questionSection(input: EvidenceInput, id: 'vision' | 'values'): EvidenceSection {
  const slug = EVIDENCE_MODULES[id];
  const questions = input.questions.filter((row) => row.moduleSlug === slug).sort((left, right) => left.order - right.order);
  const groups = questions.map((question) => {
    const response = input.responses.find((row) => row.moduleSlug === slug && row.sourceRef && row.sourceRef === question.sourceRef);
    return {
      id: question.sourceRef ?? `${slug}:${question.order}`,
      title: question.textEs,
      question: null,
      items: [itemFor(response)],
    };
  });
  const answered = groups.filter((group) => group.items.some((item) => item.status === 'ANSWERED')).length;
  return { id, title: TITLES[id], moduleSlug: slug, answered, total: groups.length, groups, ...accessFor(input, slug, answered) };
}

function ikigaiSection(input: EvidenceInput): EvidenceSection {
  const slug = EVIDENCE_MODULES.ikigai;
  const fields = IKIGAI_LISTAS.fields as Record<IkigaiField, { sourceName: string; sourceHeading: string }>;
  const groups = IKIGAI_FIELDS.map((field) => {
    const items = input.activities
      .filter((row) => row.field === field)
      .map((row) => ({ status: 'ANSWERED' as const, texts: [row.answer] }));
    return {
      id: field,
      title: fields[field].sourceName,
      question: fields[field].sourceHeading,
      items: items.length ? items : [{ status: 'EMPTY' as const, texts: [] }],
    };
  });
  const answered = groups.filter((group) => group.items.some((item) => item.status === 'ANSWERED')).length;
  return { id: 'ikigai', title: TITLES.ikigai, moduleSlug: slug, answered, total: groups.length, groups, ...accessFor(input, slug, answered) };
}

export function buildPurposeEvidence(input: EvidenceInput): EvidenceSection[] {
  return [questionSection(input, 'vision'), questionSection(input, 'values'), ikigaiSection(input)];
}
