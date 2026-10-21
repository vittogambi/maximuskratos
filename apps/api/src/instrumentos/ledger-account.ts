import type { AccountSources } from '../journey/accompaniment/devolution';
import { healthFactFromAnswers } from '../journey/plan-gate';
import { answerAt, ledgerText, type LedgerEntry } from './answer-ledger';

const POSTPONE_REF = 'formulario-v1:E-PER-000!R134';

function postponeFromLedger(entries: LedgerEntry[]): AccountSources['postpone'] {
  const row = answerAt(entries, POSTPONE_REF);
  if (!row) return null;
  if (row.exceptionKind) return 'UNKNOWN';
  const value = row.value?.trim();
  if (value === '2') return 'SI';
  if (value === '1') return 'PARCIAL';
  if (value === '0') return 'NO';
  return null;
}

/** Account copy fields from the answer ledger (active session or latest completed). */
export function accountTextsFromLedger(entries: LedgerEntry[]): Pick<AccountSources, 'visionDay' | 'visionPhrase' | 'valueDefended' | 'weeklyStandard' | 'postpone'> {
  return {
    visionDay: ledgerText(entries, 'formulario-v1:E-PER-000!R30'),
    visionPhrase: ledgerText(entries, 'formulario-v1:E-PER-000!R33'),
    valueDefended: ledgerText(entries, 'formulario-v1:E-PER-000!R50'),
    weeklyStandard: ledgerText(entries, 'formulario-v1:E-PER-000!R62'),
    postpone: postponeFromLedger(entries),
  };
}

/** Health fact from F-RAD-001 cells present in the ledger. Unanswered refs stay unknown. */
export function healthFactFromLedger(entries: LedgerEntry[]) {
  const textAt = (ref: string) => ledgerText(entries, `formulario-v1:F-RAD-001!${ref}`);
  return healthFactFromAnswers(textAt);
}
