import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StepReview, emptyReviewDraft, reviewPayload } from '@/components/admin/lab/step-review';
import { StepVerdict } from '@/components/admin/lab/step-verdict';
import { StepChange } from '@/components/admin/lab/step-change';
import { PairCompare } from '@/components/admin/lab/pair-compare';
import { canCloseWithoutFinding, followupCauseLabel, needsFirstProblem, shouldRegisterFinding, showsWeightFollowup } from '@/lib/lab-ui/review-followup';
import { PRIMARY_STEPS } from '@/lib/lab-ui/status';
import { expectationFixture, questionsFixture, resultFixture, runFixture } from './fixtures';

function text(node: Parameters<typeof renderToStaticMarkup>[0]) {
  return renderToStaticMarkup(node)
    .replace(/<details[\s\S]*?<\/details>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

const noop = () => undefined;

describe('generic Lab flow', () => {
  it('keeps three visible run stages', () => {
    expect(PRIMARY_STEPS).toEqual(['case', 'prediction', 'result']);
  });

  it('closes a matching case without a finding', () => {
    expect(canCloseWithoutFinding('YES')).toBe(true);
    const body = text(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture()}
        saved={null}
        draft={{ ...emptyReviewDraft, overallSense: 'YES', firstDivergence: 'NONE' }}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onContinue={noop}
      />,
    );
    expect(body).toContain('Cerrar revisión');
    expect(body).not.toContain('¿Dónde aparece la primera diferencia?');
  });

  it('opens first difference only after En parte or No', () => {
    expect(needsFirstProblem('PARTIAL')).toBe(true);
    const body = text(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture()}
        saved={null}
        draft={{ ...emptyReviewDraft, overallSense: 'NO', firstDivergence: 'RESPONSE_VALIDATION' }}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onContinue={noop}
      />,
    );
    expect(body).toContain('Buscar pregunta del caso');
    expect(body).toContain('Escribe para buscar');
    expect(body).not.toContain(questionsFixture()[0]!.text);
  });

  it('lets an unsure review close without a ChangeSet', () => {
    expect(canCloseWithoutFinding('UNSURE')).toBe(true);
    const body = text(
      <StepVerdict
        run={runFixture({ status: 'REVEALED' })}
        result={resultFixture()}
        expectation={expectationFixture()}
        saved={null}
        reviewDraft={{ ...emptyReviewDraft, overallSense: 'UNSURE' }}
        pending={false}
        onSaved={noop}
        onContinue={noop}
      />,
    );
    expect(body).toContain('No tengo suficiente evidencia');
    expect(body).not.toContain('ChangeSet');
    expect(body).not.toContain('SET_QUESTION_WEIGHT');
  });

  it('shows the question picker only on the question branch', () => {
    const coverage = text(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture()}
        saved={null}
        draft={{ ...emptyReviewDraft, overallSense: 'NO', firstDivergence: 'DOMAIN_COVERAGE' }}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onContinue={noop}
      />,
    );
    expect(coverage).toContain('¿Qué esperabas que ocurriera con esta cantidad de información?');
    expect(coverage).not.toContain('Buscar pregunta del caso');
  });

  it('shows weight only after the cause is influence', () => {
    expect(showsWeightFollowup('DIMENSION_SCORE', 'WEIGHT')).toBe(true);
    expect(showsWeightFollowup('DIMENSION_SCORE', 'AVERAGE_LOSS')).toBe(false);
    const before = text(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture()}
        saved={null}
        draft={{
          ...emptyReviewDraft,
          overallSense: 'NO',
          firstDivergence: 'DIMENSION_SCORE',
          rootCauses: ['AVERAGE_LOSS'],
        }}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onContinue={noop}
      />,
    );
    expect(before).not.toContain('¿Cómo debería influir?');
    const after = text(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture()}
        saved={null}
        draft={{
          ...emptyReviewDraft,
          overallSense: 'NO',
          firstDivergence: 'DIMENSION_SCORE',
          rootCauses: ['WEIGHT'],
        }}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onContinue={noop}
      />,
    );
    expect(after).toContain('¿Cómo debería influir?');
  });

  it('shows the Spanish scale follow-up under Qué ocurrió, not the enum', () => {
    const body = text(
      <StepReview
        result={resultFixture()}
        questions={questionsFixture()}
        expectation={expectationFixture()}
        saved={null}
        draft={{
          ...emptyReviewDraft,
          overallSense: 'NO',
          firstDivergence: 'SCALE_MAP',
          rootCauses: ['SCALE_TOO_NARROW'],
        }}
        onDraft={noop}
        pending={false}
        onSubmit={noop}
        onContinue={noop}
      />,
    );
    expect(followupCauseLabel('SCALE_MAP', ['SCALE_TOO_NARROW'])).toBe('La escala es demasiado estrecha');
    expect(body).toContain('La escala es demasiado estrecha');
    expect(body).not.toContain('SCALE_TOO_NARROW');
  });

  it('keeps a definition issue as a finding, not a weight', () => {
    const body = text(
      <StepChange
        runId="run-new"
        options={null}
        reasonSeed=""
        pending={false}
        onSubmit={noop}
        result={null}
        onVerdict={noop}
        onDiscard={noop}
      />,
    );
    expect(body).not.toContain('SET_QUESTION_WEIGHT');
  });

  it('shows A/B compare only as a complement question', () => {
    const body = text(
      <PairCompare
        pair={{
          available: true,
          pair: 'PAIR',
          changed_questions: [],
          dimensions: {},
          domains: {},
          priority: { a: 'FINANZAS', b: 'FINANZAS' },
          plans: { a: null, b: null, a_name: null, b_name: null },
        }}
      />,
    );
    expect(body).toContain('¿Esta diferencia en las respuestas debería producir esta diferencia en el resultado?');
  });

  it('registers a finding without a ChangeSet, and can link instead of duplicating', () => {
    expect(shouldRegisterFinding('NO', 'PRIORITY')).toBe(true);
    expect(shouldRegisterFinding('UNSURE', 'PRIORITY')).toBe(false);
    expect(shouldRegisterFinding('YES', 'NONE')).toBe(false);
    const payload = reviewPayload({
      ...emptyReviewDraft,
      overallSense: 'NO',
      firstDivergence: 'PRIORITY',
      linkedFindingId: 'finding-existing',
    });
    expect(payload.linked_finding_id).toBe('finding-existing');
    expect(JSON.stringify(payload)).not.toContain('SET_QUESTION_WEIGHT');
  });
});

describe('no fixture branches in Lab UI', () => {
  it('does not special-case R01-R15 IDs in production Lab code', () => {
    const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
    const files: string[] = [
      join(repoRoot, 'apps/web/components/admin/lab-session.tsx'),
      join(repoRoot, 'apps/api/src/lab/lab-pair.ts'),
    ];
    function walk(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
      }
    }
    walk(join(repoRoot, 'apps/web/components/admin/lab'));
    walk(join(repoRoot, 'apps/web/lib/lab-ui'));
    walk(join(repoRoot, 'apps/web/app/admin/lab'));
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/RAFA-R(?:0[1-9]|1[0-5])/);
      expect(source, file).not.toMatch(/caseId === ['"]R/);
      expect(source, file).not.toMatch(/casebook_key === ['"]R(?:0[1-9]|1[0-5])/);
      expect(source, file).not.toMatch(/'(R(?:0[1-9]|1[0-5])[AB]?)'/);
    }
  });
});
