import { devolutionOf, type AccountSources } from './accompaniment/devolution';
import type { LedgerEntry } from '../instrumentos/answer-ledger';
import { ledgerText } from '../instrumentos/answer-ledger';

export type DiscoverLine = {
  text: string;
  sourceRef: string | null;
  partial: boolean;
};

/** Non interpretive synthesis lines with provenance (T5.3 partial until D-SYN). */
export function discoverSynthesis(input: AccountSources & { ledger: LedgerEntry[]; partialCoverage: boolean }): DiscoverLine[] {
  const devolution = devolutionOf(input);
  const lines: DiscoverLine[] = [];
  if (devolution.situation) {
    lines.push({ text: devolution.situation, sourceRef: ledgerText(input.ledger, 'formulario-v1:E-AUD-001!R26') ? 'formulario-v1:E-AUD-001!R26' : null, partial: input.partialCoverage });
  }
  if (devolution.missing?.length) {
    for (const item of devolution.missing) {
      lines.push({ text: item, sourceRef: null, partial: true });
    }
  }
  return lines;
}
