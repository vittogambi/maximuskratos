import { describe, expect, it } from 'vitest';
import { CASEBOOK_FAMILIES } from '../src/lab/lab-casebook';
import { originTypeFromMapping, decisionStatusFromVerdict } from '../src/lab/lab-provenance';
import { catalogById, hydrateCatalog } from '../src/lab/lab-review-catalog';
import { DIRECTION_FAMILY_ID, buildReviewAgenda, matrixTrackFamilies } from '../src/lab/lab-review-agenda';

function family(id: string, status: string) {
  const meta = CASEBOOK_FAMILIES.find((item) => item.id === id)!;
  return {
    id,
    label: meta.label,
    intro: meta.intro ?? null,
    question: meta.question,
    status,
  };
}

describe('methodology provenance', () => {
  it('classifies Excel unchanged as original source and the rest as Matrix v2', () => {
    expect(originTypeFromMapping({ transformation_type: 'UNCHANGED' })).toBe('EXCEL_SOURCE');
    expect(originTypeFromMapping({ transformation_type: 'REMOVED' })).toBe('MATRIX_V2');
    expect(originTypeFromMapping({ transformation_type: 'NEW_IN_V2' })).toBe('MATRIX_V2');
  });

  it('does not put documented v2 or technical corrections in the review queue', () => {
    const catalog = hydrateCatalog([]);
    const queued = catalog.filter((item) => item.in_rafa_queue);
    expect(queued.every((item) => item.id.startsWith('FID-') || item.id === 'REF-DIRECTION-V01')).toBe(true);
    expect(catalog.find((item) => item.id === 'MIG-05')?.in_rafa_queue).toBe(false);
    expect(catalog.find((item) => item.id === 'MIG-05')?.decision_status).toBe('DOCUMENTED_IN_V2');
    expect(catalog.find((item) => item.id === 'REF-COVERAGE-QA')?.in_rafa_queue).toBe(false);
    expect(catalog.find((item) => item.id === 'REF-HONEST-CONSUMER')?.in_rafa_queue).toBe(false);
    expect(catalog.find((item) => item.id === 'REF-FOCUS-SPLIT')?.in_rafa_queue).toBe(false);
    expect(catalog.find((item) => item.id === 'FID-BROOKS')?.origin_type).toBe('V2_UNDOCUMENTED_RESULT');
    expect(catalog.find((item) => item.id === 'FID-BROOKS')?.decision_by).toBe('UNDOCUMENTED');
    expect(catalog.find((item) => item.id === 'FID-LINAJE')?.title).toContain('arquetipo');
    expect(catalog.find((item) => item.id === 'FID-IKIGAI')?.composition?.from_product.length).toBeGreaterThan(0);
    expect(catalog.find((item) => item.id === 'REF-FOCUS-SPLIT')?.card_kind).toBe('later');
  });

  it('keeps Brooks, F-RAD-003, E-PER-006 and linaje in the fidelity queue', () => {
    expect(catalogById('FID-BROOKS')?.in_rafa_queue).toBe(true);
    expect(catalogById('FID-FRAD003')?.in_rafa_queue).toBe(true);
    expect(catalogById('FID-EPER006')?.in_rafa_queue).toBe(true);
    expect(catalogById('FID-LINAJE')?.in_rafa_queue).toBe(true);
  });
});

describe('review agenda', () => {
  it('points next at the first unfinished Matrix family, then fidelity, then Direction', () => {
    const families = CASEBOOK_FAMILIES.map((item) => family(item.id, 'Pendiente'));
    const first = buildReviewAgenda({ families, stored: [] });
    expect(first.next.track).toBe('matrix');
    expect(first.next.title).toBe(matrixTrackFamilies()[0]!.label);
    expect(first.next.cta).toBe('Continuar');
    expect(first.rule).toMatch(/Cada decisión metodológica/);
    expect(first.tracks.map((track) => track.cta)).toEqual(['Seguir revisando', 'Revisar cambios', 'Revisar']);
    expect(first.tracks[0]?.total).toBe(12);
    expect(first.tracks[2]?.total).toBe(1);
    expect(first.fidelity_queue).toHaveLength(6);

    const matrixDone = CASEBOOK_FAMILIES.map((item) =>
      family(item.id, item.id === DIRECTION_FAMILY_ID ? 'Pendiente' : 'Validada'),
    );
    const afterCases = buildReviewAgenda({ families: matrixDone, stored: [] });
    expect(afterCases.next.track).toBe('fidelity');
    expect(afterCases.next.done_prompt).toMatch(/Ya terminaste las pruebas de Matriz/);
    expect(afterCases.next.title).toBe('Desarrollo y sentido');

    const fidelityDone = hydrateCatalog(
      first.fidelity_queue.map((item) => ({ id: item.id, rafaVerdict: 'KEEP_V2', rafaNote: null })),
    );
    const afterFidelity = buildReviewAgenda({
      families: matrixDone,
      stored: fidelityDone.map((item) => ({
        id: item.id,
        rafaVerdict: item.rafa_verdict,
        rafaNote: null,
      })),
    });
    expect(afterFidelity.next.track).toBe('direction');
    expect(afterFidelity.next.href).toContain(DIRECTION_FAMILY_ID);
    expect(afterFidelity.next.done_prompt).toMatch(/frontera Matriz \/ Dirección/);
  });

  it('does not treat a KEEP_V2 fidelity item as still able to modify Matrix', () => {
    const families = CASEBOOK_FAMILIES.map((item) => family(item.id, 'Validada'));
    const agenda = buildReviewAgenda({
      families,
      stored: [{ id: 'FID-BROOKS', rafaVerdict: 'KEEP_V2', rafaNote: null }],
    });
    expect(agenda.summary.fidelity_resolved).toBe(1);
    expect(agenda.summary.fidelity_pending_matrix).toBe(5);
    expect(agenda.summary.fidelity_recovered_matrix).toBe(0);
  });

  it('maps verdicts to review statuses', () => {
    expect(decisionStatusFromVerdict(null, true)).toBe('DOCUMENTED_IN_V2');
    expect(decisionStatusFromVerdict('KEEP_V2', false)).toBe('APPROVED_RAFA');
    expect(decisionStatusFromVerdict('REJECT', false)).toBe('REJECTED_RAFA');
    expect(decisionStatusFromVerdict('NOT_APPLICABLE', false)).toBe('NEED_MORE_EVIDENCE');
  });
});
