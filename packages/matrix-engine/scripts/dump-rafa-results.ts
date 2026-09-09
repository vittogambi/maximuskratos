import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ENGINE_SEMVER, type ResultSnapshot } from '../src/types';
import { runAssessment } from '../src/engine/run-assessment';
import { FULL_POLICY } from '../src/policy/resolve-served';
import { indexTrace } from '../src/engine/trace';

function asInput(id: string, value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as { value?: unknown; qualitativeConfirmed?: boolean | null };
    return {
      questionId: id,
      status: 'ANSWERED' as const,
      rawValue: (record.value ?? null) as number | string | null,
      qualitativeConfirmed: record.qualitativeConfirmed ?? null,
    };
  }
  return {
    questionId: id,
    status: 'ANSWERED' as const,
    rawValue: value as number | string | null,
  };
}

function summarize(snapshot: ResultSnapshot): void {
  process.stdout.write(
    `safety fired=${snapshot.safety.alerts
      .filter((item) => item.fired)
      .map((item) => `${item.question_id}:${item.condition_confirmed}:${item.severity}`)
      .join(',') || 'ninguna'} cov=${snapshot.safety.risk_coverage} incomplete=${snapshot.safety.safety_incomplete}\n`,
  );
  for (const domain of snapshot.domains) {
    process.stdout.write(
      `  ${domain.key} score=${domain.score} disp=${domain.score_display} cov=${domain.coverage_definition} ${domain.classification} band=${domain.state_from_band} final=${domain.state_final} src=${domain.state_source} dist=${domain.distance_to_band_edge}\n`,
    );
  }
  process.stdout.write(
    `  P=${snapshot.priority.domain}/${snapshot.priority.tier}/${snapshot.priority.reason} M=${snapshot.maintenance.domain} plan=${snapshot.recommendations.primary?.plan_id} exec=${snapshot.recommendations.primary?.executable_recommendation} maintPlan=${snapshot.recommendations.maintenance?.plan_id} global=${snapshot.global.average}\n`,
  );
  process.stdout.write(
    `  purpose score=${snapshot.purpose.domain_score} stage=${snapshot.purpose.stage} ${snapshot.purpose.not_applicable_reason}\n`,
  );
}

async function main(): Promise<void> {
  const definition = JSON.parse(
    await readFile(resolve(__dirname, '../definitions/matrix-v2.0.json'), 'utf8'),
  );
  const dir = resolve(__dirname, '../test/cases/rafa-casebook');
  const files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort();
  for (const file of files) {
    const caseFile = JSON.parse(await readFile(resolve(dir, file), 'utf8')) as {
      case_id: string;
      now: string;
      responses: Record<string, unknown>;
    };
    const snapshot = runAssessment({
      definition,
      responses: Object.entries(caseFile.responses).map(([id, value]) => asInput(id, value)),
      policy: FULL_POLICY,
      engineSemver: ENGINE_SEMVER,
      now: caseFile.now,
    });
    process.stdout.write(`\n======== ${caseFile.case_id} ========\n`);
    summarize(snapshot);
    if (caseFile.case_id === 'RAFA-R04') {
      const node = indexTrace(snapshot.trace).get('domain_score:CUERPO');
      process.stdout.write(`  R04 ${JSON.stringify(node?.output)}\n`);
      process.stdout.write(
        `  R04 dims ${JSON.stringify(snapshot.dimensions.filter((item) => item.domain === 'CUERPO').map((item) => ({ k: item.key, s: item.score })))}\n`,
      );
    }
    if (caseFile.case_id.startsWith('RAFA-R13') || caseFile.case_id === 'RAFA-R14') {
      process.stdout.write(
        `  men dims ${JSON.stringify(snapshot.dimensions.filter((item) => item.domain === 'MENTALIDAD').map((item) => ({ k: item.key, s: item.score })))}\n`,
      );
    }
    if (caseFile.case_id === 'RAFA-R15') {
      process.stdout.write(
        `  purpose dims ${JSON.stringify(snapshot.purpose.dimension_scores.filter((item) => item.score != null))}\n`,
      );
      process.stdout.write(`  narr ${JSON.stringify(snapshot.narrative_completion)}\n`);
    }
    if (caseFile.case_id === 'RAFA-R11' || caseFile.case_id === 'RAFA-R12') {
      process.stdout.write(`  reco ${JSON.stringify(snapshot.recommendations.primary)}\n`);
    }
  }
}

void main();
