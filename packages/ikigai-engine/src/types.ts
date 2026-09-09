export const ENGINE_VERSION = '0.1.0';
export const IKIGAI_DEFINITION_ID = 'ikigai-v0.1';

export const FIELD_KEYS = ['PASION', 'CAPACIDAD', 'NECESIDAD', 'VALOR'] as const;
export type IkigaiFieldKey = (typeof FIELD_KEYS)[number];

export const CRITERION_KEYS = [
  'DISFRUTE_SOSTENIBLE',
  'CAPACIDAD_DEMOSTRABLE',
  'UTILIDAD_REAL',
  'VALOR_ECONOMICO',
  'COHERENCIA_MORAL',
  'FACTIBILIDAD',
] as const;
export type IkigaiCriterionKey = (typeof CRITERION_KEYS)[number];

export const STEPS = [
  'PASION',
  'CAPACIDAD',
  'NECESIDAD',
  'VALOR',
  'REVISION',
  'HIPOTESIS',
  'CONTRASTE',
] as const;
export type IkigaiStep = (typeof STEPS)[number];

export const INTUITION_KEYS = [
  'ATRACCION',
  'INTUICION',
  'INDIRECTA',
  'NO_PROBADO',
  'DESCONOCIDO',
] as const;

export const BACKED_KEYS = [
  'SOSTENIDO',
  'OCASIONAL',
  'RESULTADOS',
  'EXPERIENCIA',
  'SENALES',
  'VIVIDA',
  'OBSERVADA',
  'SOSTUVO_A_MI',
  'SOSTIENE_A_OTROS',
] as const;

export const ENABLED_RULE_IDS = [
  'T_FIELD_EMPTY',
  'T_FIELD_THIN',
  'T_HYP_GAP',
  'T_NO_HYPOTHESIS',
  'T_ALL_UNLINKED',
  'T_SAME_TEXT_ALL_FIELDS',
  'T_HYP_CRITERION_LOW',
  'T_FIELD_INTUITION_ONLY',
  'T_HYP_WEAK_EVIDENCE',
  'T_HYP_MORAL_CONFLICT',
] as const;

export const DISABLED_RULE_IDS = [
  'T_ENJOY_NOT_SUSTAINED',
  'T_SKILL_NO_ENJOY',
  'NX_CRITERION_LOWEST',
  'NX_INTUITION_FIRST',
  'NX_FIELD_WEAKEST',
] as const;

export type IkigaiRuleId =
  | (typeof ENABLED_RULE_IDS)[number]
  | (typeof DISABLED_RULE_IDS)[number];

export type EvidenceClass = 'backed' | 'intuition' | 'unmarked';

export interface IkigaiEvidenceOption {
  key: string;
  label: string;
}

export interface IkigaiFieldDef {
  key: IkigaiFieldKey;
  title: string;
  prompt: string;
  help: string;
  examples: string[];
  placeholder: string;
  matrixIds: string[];
  evidencePrompt: string;
  evidenceOptions: IkigaiEvidenceOption[];
}

export interface IkigaiCriterionDef {
  key: IkigaiCriterionKey;
  label: string;
  text: string;
  matrixId: string;
}

export interface IkigaiRuleDef {
  id: IkigaiRuleId;
  enabled: boolean;
  copy: string;
}

export interface IkigaiLikertAnchor {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
}

export interface IkigaiDefinition {
  definitionId: string;
  revision: number;
  ref: string;
  status: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
  engineMin: string;
  matrixRef: string;
  publicName: string;
  examplesDisclaimer: string;
  hypothesis: {
    label: string;
    help: string;
    examples: string[];
    noHypothesisLabel: string;
  };
  likertAnchors: IkigaiLikertAnchor[];
  skipCriterionLabel: string;
  fields: IkigaiFieldDef[];
  criteria: IkigaiCriterionDef[];
  gapQuestionByField: Record<IkigaiFieldKey, string>;
  rules: IkigaiRuleDef[];
  nextExperiment: {
    focusLabel: string;
    horizonLabel: string;
    horizons: number[];
    actionLabel: string;
    signalLabel: string;
  };
  lexicon: Record<string, string>;
  feedback: {
    clarity: string;
    clarityOptions: string[];
    wantsTest: string;
    wantsTestOptions: string[];
    friction: string;
  };
  source: { legacy_form: string; matrix: string };
}

export interface IkigaiItem {
  id: string;
  text: string;
  evidence: string | null;
  order: number;
}

export interface IkigaiHypothesis {
  id: string;
  text: string;
  itemIds: string[];
  criteria: Partial<Record<IkigaiCriterionKey, 1 | 2 | 3 | 4 | 5 | null>>;
  order: number;
}

export interface IkigaiNextExperiment {
  hypothesisId: string | null;
  focus: string;
  horizonDays: 30 | 60 | 90;
  action: string;
  signal: string;
  savedAt: string;
}

export type FieldClarity = 'ANSWERED' | 'UNCLEAR' | null;

export type FieldClarityMap = Record<IkigaiFieldKey, FieldClarity>;

export interface IkigaiDraft {
  items: Record<IkigaiFieldKey, IkigaiItem[]>;
  patternNote: string | null;
  hypotheses: IkigaiHypothesis[];
  noHypothesisYet: boolean;
  nextExperiment: IkigaiNextExperiment | null;
  fieldClarity: FieldClarityMap;
  selectedHypothesisId: string | null;
}

export interface Tension {
  ruleId: IkigaiRuleId;
  text: string;
  hypothesisId?: string;
  fieldKey?: IkigaiFieldKey;
}

export interface MaterialItemView {
  id: string;
  text: string;
  evidence: string | null;
  evidenceLabel: string | null;
  classification: EvidenceClass;
}

export interface FieldMaterialView {
  key: IkigaiFieldKey;
  title: string;
  items: MaterialItemView[];
  thin: boolean;
  untagged: boolean;
}

export interface HypothesisView {
  id: string;
  index: number;
  text: string;
  coverage: Record<IkigaiFieldKey, boolean>;
  criteria: Array<{
    key: IkigaiCriterionKey;
    label: string;
    text: string;
    value: 1 | 2 | 3 | 4 | 5 | null | undefined;
    answerLabel: string;
  }>;
  linkedItems: MaterialItemView[];
}

export interface IkigaiResult {
  definitionRef: string;
  engineVersion: string;
  generatedAt: string;
  selectedHypothesisId: string | null;
  fieldClarity: FieldClarityMap;
  material: { fields: FieldMaterialView[] };
  convergences: {
    byHypothesis: Array<{ hypothesisId: string; text: string; counts: Record<IkigaiFieldKey, number> }>;
    recurring: Array<{ text: string; count: number }>;
    unused: Array<{ fieldKey: IkigaiFieldKey; title: string; text: string }>;
    patternNote: string | null;
  };
  tensions: Tension[];
  hypotheses: HypothesisView[];
  evidence: {
    byHypothesis: Array<{
      hypothesisId: string;
      backed: MaterialItemView[];
      intuition: MaterialItemView[];
    }>;
  };
  openQuestions: string[];
  nextExperiment: IkigaiNextExperiment | null;
}

export interface CompletionFailure {
  ok: false;
  step: IkigaiStep;
  details: string;
}

export interface CompletionOk {
  ok: true;
}

export type CompletionCheck = CompletionOk | CompletionFailure;
