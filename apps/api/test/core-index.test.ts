import { describe, expect, it } from 'vitest';
import { compareAlignment, scoreAlignment, type CoreAnswer } from '../src/instrumentos/core-index';
import { CORE_SIGNALS } from '../src/instrumentos/core-definition';
import { scoreDepth, type DepthFact } from '../src/instrumentos/depth';
import { territoryMap } from '../src/instrumentos/territory-map';
import { proposePriority } from '../src/journey/priority';
import { isMonday, weekStartMonday } from '../src/journey/civil-date';

const V6 = 'formulario-completo@6';

function answers(version: string, raw: Record<string, number>, exceptions: Record<string, CoreAnswer['exception']> = {}): CoreAnswer[] {
  return Object.entries(raw).map(([sourceRef, value]) => ({
    sourceRef,
    value: exceptions[sourceRef] ? null : value,
    exception: exceptions[sourceRef] ?? null,
    catalogVersion: version,
    answeredAt: '2026-10-13T15:00:00.000Z',
  }));
}

const caseA = {
  'formulario-v1:E-AUD-001!R62': 5,
  'formulario-v1:E-AUD-001!R63': 4,
  'formulario-v1:E-PER-000!R73': 3,
  'formulario-v1:E-PER-000!R74': 3,
  'formulario-v1:E-AUD-001!R60': 4,
  'formulario-v1:E-PER-000!R77': 4,
  'formulario-v1:E-AUD-001!R7': 3,
  'formulario-v1:E-AUD-001!R8': 3,
  'formulario-v1:E-AUD-001!R19': 4,
  'formulario-v1:E-AUD-001!R26': 1,
  'formulario-v1:E-AUD-001!R27': 3,
  'formulario-v1:E-AUD-001!R29': 2,
  'formulario-v1:E-PER-000!R80': 2,
  'formulario-v1:E-PER-000!R154': 1,
  'formulario-v1:E-PER-000!R76': 2,
  'formulario-v1:E-PER-000!R86': 1,
  'formulario-v1:E-AUD-001!R17': 3,
  'formulario-v1:E-AUD-001!R20': 2,
  'formulario-v1:E-AUD-001!R18': 4,
  'formulario-v1:E-AUD-001!R57': 4,
};

describe('ia-mk-cuest@0.1', () => {
  it('uses twenty signals once, with IN7 positive', () => {
    expect(CORE_SIGNALS).toHaveLength(20);
    expect(new Set(CORE_SIGNALS.map((item) => item.sourceRef)).size).toBe(20);
    const high = scoreAlignment(answers(V6, { 'formulario-v1:E-PER-000!R154': 2 }));
    const low = scoreAlignment(answers(V6, { 'formulario-v1:E-PER-000!R154': 0 }));
    const yes = high.signals.find((item) => item.id === 'IN7')?.value;
    const no = low.signals.find((item) => item.id === 'IN7')?.value;
    expect(yes).toBe(100);
    expect(no).toBe(0);
  });

  it('matches the reference cases and does not treat absence as zero', () => {
    const a = scoreAlignment(answers(V6, caseA));
    expect(a.pillars.ESPIRITU).toBeCloseTo(80.5556, 4);
    expect(a.pillars.MENTE).toBeCloseTo(39.8148, 4);
    expect(a.pillars.CUERPO).toBeCloseTo(43.0556, 4);
    expect(a.general).toBeCloseTo(54.4753, 4);
    expect(a.coverage).toEqual({ eligible: 20, required: 20 });

    const b = scoreAlignment(answers(V6, { ...caseA, 'formulario-v1:E-AUD-001!R62': 2, 'formulario-v1:E-AUD-001!R63': 1, 'formulario-v1:E-PER-000!R73': 1, 'formulario-v1:E-PER-000!R74': 2, 'formulario-v1:E-AUD-001!R60': 3, 'formulario-v1:E-PER-000!R77': 3 }, { 'formulario-v1:E-PER-000!R154': 'UNKNOWN' }));
    expect(b.pillars.ESPIRITU).toBeCloseTo(29.1667, 4);
    expect(b.pillars.MENTE).toBeNull();
    expect(b.general).toBeNull();
    expect(b.signals.find((item) => item.id === 'IN7')?.value).toBeNull();
    expect(b.coverage.eligible).toBe(19);
  });

  it('does not score an old capture whose labels were not visible, nor an unrelated fact', () => {
    const old = scoreAlignment(answers('formulario-completo@5', caseA));
    expect(old.signals.find((item) => item.id === 'I73')?.reason).toBe('OPCIONES_SIN_SIGNIFICADO');
    expect(old.signals.find((item) => item.id === 'E8')?.reason).toBe('ETIQUETAS_GENERICAS_CONTRADICTORIAS');
    expect(old.pillars.ESPIRITU).toBeNull();
    const withSalary = scoreAlignment([
      ...answers(V6, caseA),
      { sourceRef: 'formulario-v1:F-RAD-003!R48', value: 9, catalogVersion: V6 },
    ]);
    expect(withSalary.general).toBe(scoreAlignment(answers(V6, caseA)).general);
  });

  it('refuses a delta against an ineligible previous reading', () => {
    const previous = scoreAlignment(answers('formulario-completo@5', caseA));
    const next = scoreAlignment(answers(V6, caseA));
    expect(compareAlignment(previous, next, 'INITIAL').allowed).toBe(false);
    const again = scoreAlignment(answers(V6, { ...caseA, 'formulario-v1:E-AUD-001!R26': 5 }));
    const compared = compareAlignment(next, again, 'REMEASURE');
    expect(compared.allowed).toBe(true);
    if (compared.allowed) expect(compared.delta).not.toBe(0);
  });
});

describe('profundidad-mk@0.1', () => {
  const origen = (patch: Partial<DepthFact>): DepthFact => ({
    component: 'origen',
    record: 'VALID',
    recognized: null,
    integrated: null,
    linkCurrent: true,
    contrasted: null,
    ...patch,
  });

  it('scores stages only with the previous ones, and does not treat a decline as zero', () => {
    expect(scoreDepth([origen({ record: 'ABSENT' })]).components[0]).toMatchObject({ score: 0, stage: 'Sin trabajo documentado' });
    expect(scoreDepth([origen({})]).components.find((item) => item.component === 'origen')?.score).toBe(25);
    expect(scoreDepth([origen({
      recognized: { meaning: 'No conozco el linaje.', matters: 'El límite es no inventarlo.' },
    })]).components.find((item) => item.component === 'origen')?.score).toBe(50);
    const declined = scoreDepth([origen({ record: 'DECLINED' })]).components.find((item) => item.component === 'origen');
    expect(declined?.score).toBeNull();
    expect(declined?.reason).toBe('DECLINED');
  });

  it('does not credit a stale link or a long text without a confirmation', () => {
    const stale = scoreDepth([origen({
      recognized: { meaning: 'Sé una parte.', matters: 'Quiero conservar esa parte.' },
      integrated: { change: 'Renuncio a una reunión.', link: 'plan-viejo' },
      linkCurrent: false,
    })]).components.find((item) => item.component === 'origen');
    expect(stale?.score).toBe(50);
    expect(stale?.reason).toMatch(/revisión anterior/);
    const long = scoreDepth([origen({
      recognized: { meaning: 'x'.repeat(4000), matters: '' },
    })]).components.find((item) => item.component === 'origen');
    expect(long?.score).toBe(25);
  });

  it('keeps the general pending until every component has a numeric level', () => {
    const reading = scoreDepth([origen({ record: 'DECLINED' })]);
    expect(reading.general).toBeNull();
    expect(reading.partial).not.toBeNull();
  });
});

describe('prioridades@0.1', () => {
  it('proposes organization when direction is clear, not the lowest pillar', () => {
    const proposal = proposePriority({
      direction: 'PROVISIONAL',
      interest: 'TRABAJO',
      capacity: 2,
      healthLimit: false,
      hasIkigaiExperiment: false,
      raw: caseA,
    });
    expect(proposal.focus).toBe('ORGANIZACION');
    expect(proposal.alternatives).toContain('CONDUCTA');
  });

  it('lets exploration follow a concrete interest, and pauses at capacity zero', () => {
    expect(proposePriority({
      direction: 'EXPLORANDO',
      interest: 'IKIGAI',
      capacity: 1,
      healthLimit: false,
      hasIkigaiExperiment: true,
      raw: caseA,
    }).focus).toBe('EXPERIMENTO');
    expect(proposePriority({
      direction: 'EXPLORANDO',
      interest: 'TRABAJO',
      capacity: 1,
      healthLimit: false,
      hasIkigaiExperiment: false,
      raw: caseA,
    }).focus).toBe('ORGANIZACION');
    expect(proposePriority({
      direction: 'PROVISIONAL',
      interest: 'CUIDADO',
      capacity: 0,
      healthLimit: true,
      hasIkigaiExperiment: false,
      raw: caseA,
    })).toMatchObject({ focus: 'PAUSA', requiresAction: false });
  });

  it('puts care first when a current limit and low recovery are both present', () => {
    const proposal = proposePriority({
      direction: 'PROVISIONAL',
      interest: 'CUIDADO',
      capacity: 1,
      healthLimit: true,
      hasIkigaiExperiment: false,
      raw: { ...caseA, 'formulario-v1:E-AUD-001!R18': 1 },
    });
    expect(proposal.focus).toBe('CUIDADO');
    expect(proposal.territory).toBe('SALUD_FISICA');
  });
});

describe('territory map and civil dates', () => {
  it('does not copy a pillar score into a cell', () => {
    const cells = territoryMap([{ sourceRef: 'formulario-v1:E-AUD-001!R26', role: 'senal', note: 'Solo reacciono' }]);
    expect(cells.every((cell) => cell.figure === null)).toBe(true);
    expect(cells.filter((cell) => cell.evidence.length > 0)).toHaveLength(1);
    expect(cells.filter((cell) => cell.state === 'SIN_INFORMACION').length).toBe(11);
  });

  it('keeps the civil week across daylight saving dates', () => {
    expect(weekStartMonday('2026-09-06')).toBe('2026-08-31');
    expect(weekStartMonday('2027-04-04')).toBe('2027-03-29');
    expect(isMonday('2026-10-12')).toBe(true);
  });
});
