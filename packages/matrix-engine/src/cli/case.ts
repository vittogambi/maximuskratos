import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ENGINE_SEMVER, type MatrixDefinition, type PolicyDefinition, type ResponseInput } from '../types';
import { runAssessment } from '../engine/run-assessment';
import { formatSummary, formatTrace, formatWhy } from '../engine/explain';
import { FULL_POLICY } from '../policy/resolve-served';
import { namedPolicy } from '../policy/build-policy-plan';
import { listFixtureCases, runMaterialized } from '../fixtures/run-fixture';

function arg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function frozenDefinitionPath(): string {
  return resolve(__dirname, '../../definitions/matrix-v2.0.json');
}

async function loadDefinition(ref: string): Promise<MatrixDefinition> {
  const path =
    ref.endsWith('.json') || ref.includes('/') || ref.includes('\\')
      ? resolve(ref)
      : frozenDefinitionPath();
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as MatrixDefinition;
}

function asResponseEntry(
  questionId: string,
  value: unknown,
): ResponseInput {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const raw = record.value ?? record.rawValue ?? record.raw ?? null;
    const qualitative =
      'qualitativeConfirmed' in record
        ? (record.qualitativeConfirmed as boolean | null)
        : 'qualitative_confirmed' in record
          ? (record.qualitative_confirmed as boolean | null)
          : undefined;
    const status =
      typeof record.status === 'string'
        ? (record.status as ResponseInput['status'])
        : 'ANSWERED';
    return {
      questionId,
      status,
      rawValue: raw as number | string | null,
      qualitativeConfirmed: qualitative,
    };
  }
  return {
    questionId,
    status: 'ANSWERED',
    rawValue: value as number | string | null,
  };
}

interface CaseFile {
  case_id?: string;
  policy_id?: string;
  policy?: PolicyDefinition;
  now?: string;
  responses?: Record<string, unknown>;
}

async function main(): Promise<void> {
  const definitionRef = arg('--definition') ?? 'matrix-v2.0@1';
  const responsesPath = arg('--responses');
  const fixtureKey = arg('--fixture');
  const format = arg('--format') ?? 'summary';
  const whyDomain = arg('--why-domain');

  if (!responsesPath && !fixtureKey) {
    process.stderr.write(
      'usage: matrix:case --responses <json> | --fixture F01_ALL_MAX [--definition matrix-v2.0@1] [--format summary|snapshot|trace|why] [--why-domain CUERPO]\n',
    );
    process.exitCode = 1;
    return;
  }

  try {
    const definition = await loadDefinition(definitionRef);
    let snapshot;
    let caseId: string | undefined;
    if (fixtureKey) {
      const fixtures = listFixtureCases(definition);
      const selected = fixtures.filter(
        (item) => item.family_key === fixtureKey || item.case_id === fixtureKey,
      );
      if (!selected.length) {
        process.stderr.write(`unknown fixture ${fixtureKey}\n`);
        process.stderr.write(fixtures.map((item) => item.family_key).filter((v, i, a) => a.indexOf(v) === i).join('\n') + '\n');
        process.exitCode = 1;
        return;
      }
      for (const fixture of selected) {
        const current = runMaterialized(definition, fixture);
        process.stdout.write(formatSummary(current, fixture.case_id));
      }
      return;
    }
    const caseRaw = JSON.parse(await readFile(resolve(responsesPath!), 'utf8')) as CaseFile;
    const responses = Object.entries(caseRaw.responses ?? {}).map(([id, value]) =>
      asResponseEntry(id, value),
    );
    const policy: PolicyDefinition =
      caseRaw.policy ??
      (caseRaw.policy_id ? namedPolicy(caseRaw.policy_id) : FULL_POLICY);
    caseId = caseRaw.case_id;
    snapshot = runAssessment({
      definition,
      responses,
      policy,
      engineSemver: ENGINE_SEMVER,
      now: caseRaw.now ?? new Date().toISOString(),
    });

    if (format === 'snapshot') {
      process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
      return;
    }
    if (format === 'trace') {
      process.stdout.write(formatTrace(snapshot));
      return;
    }
    if (format === 'why') {
      process.stdout.write(formatWhy(snapshot, whyDomain));
      return;
    }
    process.stdout.write(formatSummary(snapshot, caseId));
    process.stdout.write('\nWHY\n');
    process.stdout.write(formatWhy(snapshot, whyDomain));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

void main();
