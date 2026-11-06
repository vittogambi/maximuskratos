import type { Execution } from './engine';
import { executionFrom } from './engine';

export type ExecutionCoverage = 'COMPLETE' | 'INCOMPLETE' | 'NONE';

export type ExecutionStats = {
  done: number;
  notDone: number;
  noInformation: number;
  resolved: number;
  scheduled: number;
  ratioOfResolved: number | null;
  coverage: ExecutionCoverage;
  level: Execution;
  levelForReview: Execution;
};

/** Cumplimiento (hecho vs no hecho) y cobertura (cuántas ocasiones tienen registro) van separados. */
export function executionStats(counts: { done: number; notDone: number; noInformation: number }, trigger: boolean): ExecutionStats {
  const done = counts.done;
  const notDone = counts.notDone;
  const noInformation = counts.noInformation;
  const resolved = done + notDone;
  const scheduled = resolved + noInformation;
  const ratioOfResolved = resolved === 0 ? null : Math.round((100 * done) / resolved);
  const coverage: ExecutionCoverage = resolved === 0 ? 'NONE' : noInformation === 0 ? 'COMPLETE' : 'INCOMPLETE';
  const level = executionFrom(counts, trigger);
  let levelForReview = level;
  if (coverage === 'INCOMPLETE' && level === 'SUFFICIENT') {
    levelForReview = 'PARTIAL';
  }
  if (coverage === 'NONE' && level !== 'NOT_APPLICABLE') {
    levelForReview = 'NONE';
  }
  return { done, notDone, noInformation, resolved, scheduled, ratioOfResolved, coverage, level, levelForReview };
}
