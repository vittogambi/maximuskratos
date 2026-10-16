/** Scoring types for the Formularios por paso questionnaire. Not matrix v2. */

export type ExceptionKind = 'UNKNOWN' | 'NOT_APPLICABLE' | 'DECLINED' | 'PENDING';

export type FormularioAnswer = {
  id: string;
  /** Numeric scale, or a labelled choice. Null when unanswered or excepted. */
  value: number | string | null;
  exception?: ExceptionKind | null;
};

export type Coverage = { answered: number; required: number };

export type InstrumentResult = {
  value: number | null;
  min: number;
  max: number;
  coverage: Coverage;
  calculable: boolean;
  /** Partial sum only when explicitly labelled. Never a projected total. */
  partial: number | null;
  parts: Record<string, InstrumentResult | string | number | null>;
  descriptor: string | null;
  sourceRefs: string[];
  discrepancies: string[];
};

export type SignalStatus = 'FIRED' | 'NOT_FIRED' | 'NOT_EVALUATED';

export type FormularioSignal = {
  id: string;
  questionId: string;
  status: SignalStatus;
  ruleVersion: string;
  nativeRule: string;
  productRule: string;
  message: string | null;
};
