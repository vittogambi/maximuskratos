import { devolutionOf, type AccountSources } from './accompaniment/devolution';
import type { LedgerEntry } from '../instrumentos/answer-ledger';

export type DiscoverLine = {
  text: string;
  sourceRef: string | null;
  partial: boolean;
};

/** Non interpretive synthesis lines with provenance (T5.3 partial until D-SYN). */
export function discoverSynthesis(input: AccountSources & { ledger: LedgerEntry[]; partialCoverage: boolean }): DiscoverLine[] {
  const devolution = devolutionOf(input);
  const lines: DiscoverLine[] = [];
  for (const row of devolution.recognized) {
    lines.push({ text: row.hypothesis, sourceRef: row.sourceRef, partial: input.partialCoverage });
  }
  for (const row of devolution.pending) {
    lines.push({ text: row.hypothesis, sourceRef: row.sourceRef, partial: true });
  }
  return lines;
}
