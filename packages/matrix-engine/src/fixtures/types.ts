import type { PolicyDefinition, ResponseInput, ResultSnapshot } from '../types';

export type FixturePattern =
  | { pattern: 'ALL'; value: number }
  | { pattern: 'BY_DOMAIN'; values: Record<string, number> }
  | { pattern: 'BY_DIMENSION'; values: Record<string, number> }
  | { pattern: 'EXPLICIT'; values: Record<string, number | string> }
  | { pattern: 'NONE' };

export type RiskAnswers =
  | 'SAFE'
  | 'ALL_FIRED'
  | Record<string, number | { value: number; qualitativeConfirmed?: boolean | null }>;

export interface FixtureCase {
  id: string;
  purpose: string;
  policy_id: string;
  custom_ids?: string[];
  answers: FixturePattern;
  overrides?: Record<string, number | string | null>;
  risk_answers: RiskAnswers;
  narrative: 'EMPTY' | 'FILLED';
  expected_invariants: string[];
  golden: boolean;
}

export interface FixtureFamily {
  key: string;
  purpose: string;
  golden: boolean;
  cases: FixtureCase[];
}

export interface MaterializedFixture {
  family_key: string;
  case_id: string;
  purpose: string;
  golden: boolean;
  expected_invariants: string[];
  policy: PolicyDefinition;
  responses: ResponseInput[];
}

export type GoldenSnapshot = Omit<ResultSnapshot, 'generated_at'>;
