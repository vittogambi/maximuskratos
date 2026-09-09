import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type SourceTransformation =
  | 'UNCHANGED'
  | 'REFORMULATED'
  | 'SCALE_CHANGED'
  | 'SPLIT'
  | 'MERGED'
  | 'RECLASSIFIED'
  | 'SAFETY_SEPARATED'
  | 'NON_SCOREABLE'
  | 'REMOVED'
  | 'NEW_IN_V2'
  | 'UNCLEAR';

export type SourceMapping = {
  v2_question_id: string;
  v2_question: string;
  v2_domain: string;
  v2_dimension: string;
  v2_variable_type: string;
  v2_phase: string;
  v2_instrumento: string;
  source_form: string | null;
  source_section: string | null;
  source_question_number: string | null;
  source_question: string | null;
  source_response_type: string | null;
  source_alert_logic: string | null;
  transformation_type: SourceTransformation;
  why_changed: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  review_needed_by_rafa: 'YES' | 'NO';
};

export type MigrationLedgerRow = {
  id: string;
  source_sheets: string;
  problem: string;
  cause: string;
  impact: string;
  v2_resolution: string;
  design_status: string;
  affected_v2_ids: string[];
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, '../definitions', file), 'utf8')) as T;
}

let mappingsCache: SourceMapping[] | null = null;
let ledgerCache: MigrationLedgerRow[] | null = null;

export function loadSourceMappings(): SourceMapping[] {
  mappingsCache ??= readJson<{ mappings: SourceMapping[] }>('source-mapping-v2.0.json').mappings;
  return mappingsCache;
}

export function sourceMappingById(id: string): SourceMapping | null {
  return loadSourceMappings().find((item) => item.v2_question_id === id) ?? null;
}

export function loadMigrationLedger(): MigrationLedgerRow[] {
  ledgerCache ??= readJson<{ decisions: MigrationLedgerRow[] }>('migration-ledger-v2.0.json').decisions;
  return ledgerCache;
}
