import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_SEMVER } from '../src/types';
import { runAssessment } from '../src/engine/run-assessment';
import { FULL_POLICY } from '../src/policy/resolve-served';
import { indexTrace } from '../src/engine/trace';
import { loadFrozen } from './helpers/assessment';

const DIR = resolve(__dirname, 'cases/rafa-casebook');
const DOCUMENTED_UNSCOREABLE_NUMERIC = new Set(['D-CUE-07']);

type CasebookFile = {
  case_id: string;
  now: string;
  responses: Record<string, unknown>;
};

function files(): string[] {
  return readdirSync(DIR)
    .filter((name) => /^R\d+[A-Z]?\.json$/.test(name))
    .sort();
}

function loadCase(file: string): CasebookFile {
  return JSON.parse(readFileSync(resolve(DIR, file), 'utf8')) as CasebookFile;
}

function purposeKeys(responses: Record<string, unknown>): string[] {
  return Object.keys(responses).filter((key) => key.startsWith('P-PRO-'));
}

function maskText(value: unknown): unknown {
  return typeof value === 'string' ? { __text: true } : value;
}

function structuredResponses(responses: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(responses)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, maskText(value)]),
  );
}

function differingKeys(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys]
    .sort()
    .filter((key) => JSON.stringify(maskText(left[key])) !== JSON.stringify(maskText(right[key])));
}

const AB_FILES = [
  ['R07A.json', 'R07B.json'],
  ['R08A.json', 'R08B.json'],
  ['R09A.json', 'R09B.json'],
  ['R13A.json', 'R13B.json'],
  ['R15.json', 'R15B.json'],
] as const;

const METHOD_VOICE = /\b(coherencia|propósito|alineación|transformación|trascendencia|identidad|evidencia|estándares)\b/i;
const NOUN_LIST = /^[\p{L}]+(?:,\s*[\p{L}]+){3,}\.?$/u;

function asInput(questionId: string, value: unknown) {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      questionId,
      status: 'ANSWERED' as const,
      rawValue: (record.value ?? record.rawValue ?? null) as number | string | null,
      qualitativeConfirmed: (record.qualitativeConfirmed as boolean | null | undefined) ?? null,
    };
  }
  return { questionId, status: 'ANSWERED' as const, rawValue: value as number | string | null };
}

function headline(file: string, snapshot: ReturnType<typeof runAssessment>): string {
  const domains = snapshot.domains
    .map((domain) => {
      const score = domain.score_display ?? 'nulo';
      const state = domain.state_final ?? domain.classification;
      return `${domain.key.slice(0, 3)} ${score} ${state}`;
    })
    .join(' | ');
  const plan = snapshot.recommendations.primary?.plan_id ?? 'sin plan';
  const exec = snapshot.recommendations.primary?.executable_recommendation ?? '';
  const alert = snapshot.safety.alerts.filter((item) => item.fired).map((item) => item.question_id);
  const cue = indexTrace(snapshot.trace).get('domain_score:CUERPO');
  const counter =
    cue && typeof cue.output === 'object' && cue.output != null
      ? (cue.output as { counterfactual_item_weighted?: number }).counterfactual_item_weighted
      : null;
  const extra = file === 'R04.json' ? ` cf_item=${counter}` : '';
  return `${file}  ${domains} || P ${snapshot.priority.domain ?? 'nula'} ${snapshot.priority.tier ?? snapshot.priority.reason} ${plan} ${exec} || alerts ${alert.join(',') || 'ninguna'}${extra}`;
}

describe('rafa-casebook fixtures', () => {
  const definition = loadFrozen();

  it('keeps Purpose empty except R15 A and B', () => {
    for (const file of files()) {
      const keys = purposeKeys(loadCase(file).responses);
      if (file === 'R15.json' || file === 'R15B.json') {
        expect(keys, file).toHaveLength(36);
      } else {
        expect(keys, file).toEqual([]);
      }
    }
  });

  it('matches HEADLINES.txt after runAssessment', () => {
    const expected = readFileSync(resolve(DIR, 'HEADLINES.txt'), 'utf8').trimEnd();
    const rows = files().map((file) => {
      const json = loadCase(file);
      const snapshot = runAssessment({
        definition,
        responses: Object.entries(json.responses).map(([id, value]) => asInput(id, value)),
        policy: FULL_POLICY,
        engineSemver: ENGINE_SEMVER,
        now: json.now,
      });
      return headline(file, snapshot);
    });
    expect(rows.join('\n')).toBe(expected);
  });

  it('only documents D-CUE-07 as unscoreable numeric', () => {
    const byId = new Map(definition.questions.map((question) => [question.id, question]));
    for (const file of files()) {
      const json = loadCase(file);
      for (const [id, value] of Object.entries(json.responses)) {
        const question = byId.get(id);
        if (!question) continue;
        const raw =
          value != null && typeof value === 'object' && !Array.isArray(value)
            ? (value as { value?: unknown }).value
            : value;
        const numeric = typeof raw === 'number' && question.response_kind === 'NUMBER';
        if (numeric && question.scoreable === false) {
          expect(DOCUMENTED_UNSCOREABLE_NUMERIC.has(id), `${file} ${id}`).toBe(true);
        }
      }
    }
    expect(byId.get('D-CUE-07')?.scoreable).toBe(false);
    expect(loadCase('R03.json').responses['D-CUE-07']).toBe(5.5);
  });

  it('locks non-text values, missingness and A/B diffs', () => {
    const fingerprints = Object.fromEntries(
      files().map((file) => [file, structuredResponses(loadCase(file).responses)]),
    );
    expect(fingerprints).toMatchSnapshot();
    expect({
      'R07A/B': differingKeys(loadCase('R07A.json').responses, loadCase('R07B.json').responses),
      'R08A/B': differingKeys(loadCase('R08A.json').responses, loadCase('R08B.json').responses),
      'R09A/B': differingKeys(loadCase('R09A.json').responses, loadCase('R09B.json').responses),
      'R13A/B': differingKeys(loadCase('R13A.json').responses, loadCase('R13B.json').responses),
      'R15A/B': differingKeys(loadCase('R15.json').responses, loadCase('R15B.json').responses),
    }).toMatchSnapshot();
    for (const [left, right] of AB_FILES) {
      expect(Object.keys(loadCase(left).responses).sort()).toEqual(
        Object.keys(loadCase(right).responses).sort(),
      );
    }
  });

  it('keeps free-text unique, non-methodological and not a noun list', () => {
    const texts: string[] = [];
    for (const file of files()) {
      for (const [id, value] of Object.entries(loadCase(file).responses)) {
        if (typeof value !== 'string') continue;
        texts.push(value);
        expect(METHOD_VOICE.test(value), `${file} ${id}`).toBe(false);
        expect(NOUN_LIST.test(value.trim()), `${file} ${id}`).toBe(false);
      }
    }
    expect(new Set(texts).size).toBe(texts.length);
    const r15TextIds = Object.entries(loadCase('R15.json').responses)
      .filter(([, value]) => typeof value === 'string')
      .map(([id]) => id)
      .sort();
    expect(r15TextIds).toEqual([
      'P-PRO-001',
      'P-PRO-002',
      'P-PRO-003',
      'P-PRO-006',
      'P-PRO-008',
      'P-PRO-010',
      'P-PRO-011',
      'P-PRO-012',
      'P-PRO-013',
      'P-PRO-016',
      'P-PRO-051',
      'P-PRO-056',
      'P-PRO-061',
      'P-PRO-066',
      'P-PRO-081',
    ]);
    const r15Likert = Object.fromEntries(
      Object.entries(loadCase('R15.json').responses).filter(
        ([id, value]) => id.startsWith('P-PRO-') && typeof value === 'number',
      ),
    );
    const r15bLikert = Object.fromEntries(
      Object.entries(loadCase('R15B.json').responses).filter(
        ([id, value]) => id.startsWith('P-PRO-') && typeof value === 'number',
      ),
    );
    expect(r15Likert).toEqual(r15bLikert);
  });

  it('covers clean priority in four domains and a support-only tie', () => {
    const snapshot = (file: string) => {
      const json = loadCase(file);
      return runAssessment({
        definition,
        responses: Object.entries(json.responses).map(([id, value]) => asInput(id, value)),
        policy: FULL_POLICY,
        engineSemver: ENGINE_SEMVER,
        now: json.now,
      });
    };
    const alerts = (file: string) =>
      snapshot(file).safety.alerts.filter((item) => item.fired).map((item) => item.question_id);
    expect(snapshot('R02.json').priority.domain).toBe('MENTALIDAD');
    expect(snapshot('R16.json').priority.domain).toBe('RELACIONES');
    expect(snapshot('R17.json').priority.domain).toBe('FINANZAS');
    expect(snapshot('R03.json').priority.domain).toBe('CUERPO');
    expect(alerts('R02.json')).toEqual([]);
    expect(alerts('R16.json')).toEqual([]);
    expect(alerts('R17.json')).toEqual([]);
    expect(alerts('R03.json')).toEqual([]);
    const tie = snapshot('R18.json');
    expect(tie.domains.find((item) => item.key === 'MENTALIDAD')?.score_display).toBe(75);
    expect(tie.domains.find((item) => item.key === 'CUERPO')?.score_display).toBe(25);
    expect(tie.domains.find((item) => item.key === 'FINANZAS')?.score_display).toBe(25);
    expect(tie.priority.domain).toBe('CUERPO');
    expect(alerts('R18.json')).toEqual([]);
  });

  it('keeps critical unclassified without a Cuerpo score and caps high finance alerts', () => {
    const unclassified = runAssessment({
      definition,
      responses: Object.entries(loadCase('R11B.json').responses).map(([id, value]) => asInput(id, value)),
      policy: FULL_POLICY,
      engineSemver: ENGINE_SEMVER,
      now: loadCase('R11B.json').now,
    });
    const cuerpo = unclassified.domains.find((item) => item.key === 'CUERPO');
    expect(cuerpo?.score).toBeNull();
    expect(cuerpo?.state_final).toBe('CONTENCIÓN');
    expect(unclassified.safety.alerts.some((item) => item.fired && item.question_id === 'D-CUE-05')).toBe(true);

    const capped = runAssessment({
      definition,
      responses: Object.entries(loadCase('R12B.json').responses).map(([id, value]) => asInput(id, value)),
      policy: FULL_POLICY,
      engineSemver: ENGINE_SEMVER,
      now: loadCase('R12B.json').now,
    });
    const finanzas = capped.domains.find((item) => item.key === 'FINANZAS');
    expect(finanzas?.score_display).toBe(100);
    expect(finanzas?.state_final).toBe('ESTABILIZACIÓN');
    expect(capped.safety.alerts.some((item) => item.fired && item.question_id === 'D-FIN-09')).toBe(true);
  });
});
