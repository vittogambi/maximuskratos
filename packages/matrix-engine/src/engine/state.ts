import { BAND_CUTS } from '../constants';
import type { StateBand } from '../types';

export function roundHalfUp(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.floor(value * factor + 0.5) / factor;
}

export function storeScore(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function distanceToBandEdge(scoreDisplay: number): number {
  return Math.min(...BAND_CUTS.map((cut) => Math.abs(scoreDisplay - cut)));
}

export function assignState(
  score: number,
  bands: StateBand[],
): { state: string; ruleId: string; scoreDisplay: number } {
  const scoreDisplay = roundHalfUp(score, 0);
  const band = bands.find(
    (item) => scoreDisplay >= item.min && scoreDisplay <= item.max,
  );
  if (!band) {
    throw new Error(`no state band for score_display ${scoreDisplay}`);
  }
  return { state: band.state, ruleId: band.rule_id, scoreDisplay };
}
