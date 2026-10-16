import { describe, expect, it } from 'vitest';
import { ambitsOf, fieldFromSource } from '../src/instrumentos/ikigai-lists';
import {
  activityFromStored,
  composePurpose,
  emptySynthesis,
  reconcileSynthesis,
  visiblePurpose,
  type Activity,
} from '../src/journey/purpose-synthesis';
import { reviewGuidance } from '../src/journey/review-guidance';
import { resolvePlanLink } from '../src/journey/plan-gate';
import { applyWeekDecisions } from '../src/journey/apply-week';

const pasion: Activity = {
  sourceRef: 'formulario-v1:E-PER-000!R220',
  field: 'pasion',
  ambit: 'Creación y Expresión',
  option: ambitsOf('pasion')[0].options[0],
  answer: 'Escribir ensayos',
};
const profesion: Activity = {
  sourceRef: 'formulario-v1:E-PER-000!R241',
  field: 'profesion',
  ambit: '',
  option: '',
  answer: 'Diagnosticar problemas',
};

describe('purpose synthesis', () => {
  it('reads the field from the sheet row, not from the other names in the old context', () => {
    expect(fieldFromSource('formulario-v1:E-PER-000!R241', '@actividad:pasion')).toBe('pasion');
    expect(fieldFromSource('formulario-v1:E-PER-000!R241', null)).toBe('profesion');
    expect(fieldFromSource('formulario-v1:E-PER-000!R227', '@ikigai:Vocación:Pasión|Misión|Profesión')).toBe('vocacion');
  });

  it('reads a structured activity and ignores an exception', () => {
    expect(activityFromStored({
      sourceRef: pasion.sourceRef,
      field: 'pasion',
      freeText: JSON.stringify({ ambit: pasion.ambit, option: pasion.option, answer: pasion.answer }),
      exceptionKind: null,
    })?.answer).toBe('Escribir ensayos');
    expect(activityFromStored({
      sourceRef: pasion.sourceRef,
      field: 'pasion',
      freeText: JSON.stringify({ answer: 'Texto' }),
      exceptionKind: 'NOT_APPLICABLE',
    })).toBeNull();
  });

  it('does not pair activities that were not connected and does not invent a full purpose', () => {
    const saved = reconcileSynthesis(emptySynthesis(), { activities: [pasion, profesion], links: [], combinations: [], purpose: { status: 'EXPLORANDO', parts: { pasion: pasion.sourceRef }, edited: null } }, [pasion, profesion]);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.state.links).toEqual([]);
    expect(saved.state.purpose.generated).toContain('Por ahora');
    expect(saved.state.purpose.generated).not.toContain('[');
    expect(saved.state.purpose.open.length).toBeGreaterThan(0);
  });

  it('keeps a free edit and marks an existing link when the activity changes', () => {
    const previous = reconcileSynthesis(emptySynthesis(), {
      activities: [pasion, profesion],
      combinations: [{ id: 'c1', reason: 'Misma idea', valuation: 'PARTIAL', valuationReason: 'Aún no', experiment: '' }],
      links: [{ id: 'l1', fromRef: pasion.sourceRef, toRef: profesion.sourceRef, combinationId: 'c1', reason: 'Se parecen en el oficio', status: 'ACTIVE' }],
      purpose: { status: 'PROVISIONAL', parts: { pasion: pasion.sourceRef, profesion: profesion.sourceRef }, edited: 'Mi frase, no la plantilla.' },
    }, [pasion, profesion]);
    expect(previous.ok).toBe(true);
    if (!previous.ok) return;
    const changed = { ...pasion, answer: 'Escribir para equipos' };
    const next = reconcileSynthesis(previous.state, {
      ...previous.state,
      activities: [changed, profesion],
      purpose: { ...previous.state.purpose, edited: 'Mi frase, no la plantilla.' },
    }, [pasion, profesion]);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.state.links[0]?.status).toBe('NEEDS_REVIEW');
    expect(next.state.links[0]?.id).toBe('l1');
    expect(visiblePurpose(next.state.purpose)).toBe('Mi frase, no la plantilla.');
    expect(composePurpose({ pasion: 'Escribir', vocacion: 'Ordenar', mision: 'Equipos', profesion: 'Consultoría' }).generated).toContain('Mi propósito es poner mi Escribir');
  });

  it('rejects a link inside one column and an option from another ambit', () => {
    const same = reconcileSynthesis(emptySynthesis(), {
      links: [{ id: 'l1', fromRef: pasion.sourceRef, toRef: pasion.sourceRef, combinationId: 'c1', reason: '', status: 'ACTIVE' }],
      combinations: [{ id: 'c1', reason: '', valuation: null, valuationReason: '', experiment: '' }],
    }, [pasion]);
    expect(same.ok).toBe(false);
    const wrong = { ...pasion, option: 'Esta opción no está en el ámbito' };
    const rejected = reconcileSynthesis(emptySynthesis(), { activities: [wrong] }, [pasion]);
    expect(rejected.ok).toBe(false);
  });
});

describe('review guidance', () => {
  it('asks about strategy when many actions are done and the result is stuck', () => {
    const guidance = reviewGuidance({
      done: 4,
      applicable: 4,
      result: 'STUCK',
      alignmentLow: false,
      bodyCareLow: false,
      directionChanged: false,
    });
    expect(guidance?.situation).toBe('STUCK_RESULT');
    expect(guidance?.prompt).toContain('estrategia');
    expect(guidance?.options.join(' ')).not.toMatch(/felicitar|subir la ficha/i);
  });

  it('asks to reduce the load when few actions were done', () => {
    expect(reviewGuidance({
      done: 1,
      applicable: 4,
      result: 'UNKNOWN',
      alignmentLow: false,
      bodyCareLow: false,
      directionChanged: false,
    })?.situation).toBe('LOW_CAPACITY');
  });

  it('asks about the objective when compliance and declared alignment disagree', () => {
    const guidance = reviewGuidance({
      done: 4,
      applicable: 4,
      result: 'MOVED',
      alignmentLow: true,
      bodyCareLow: false,
      directionChanged: false,
    });
    expect(guidance?.situation).toBe('ALIGNMENT_GAP');
    expect(guidance?.options.join(' ')).toContain('objetivo');
  });

  it('does not treat a missing denominator as failure', () => {
    expect(reviewGuidance({
      done: 0,
      applicable: 0,
      result: 'UNKNOWN',
      alignmentLow: false,
      bodyCareLow: false,
      directionChanged: false,
    })?.situation).toBe('MISSING_INFORMATION');
  });
});

describe('plan link and future weekday', () => {
  it('stores an explicit link without reading it from the artifact text', () => {
    expect(resolvePlanLink({ linkKind: 'PROTECTIVE', priorityNote: 'Valor: Lealtad. Esta semana escribo la conducta.' })).toBe('PROTECTIVE');
    expect(resolvePlanLink({ priorityNote: 'DIRECT: texto viejo' })).toBe('DIRECT');
  });

  it('keeps a field doubt without copying the global valuation or replacing a free edit', () => {
    const known = [pasion, profesion];
    const saved = reconcileSynthesis(emptySynthesis(), {
      activities: known,
      links: [],
      combinations: [{
        id: 'c1',
        reason: 'Quiero probar enseñar',
        valuation: 'PARTIAL',
        valuationReason: 'No basta',
        experiment: 'Una muestra con dos personas',
        fieldStance: { pasion: 'RECOGNIZE', vocacion: 'RECOGNIZE', mision: 'DOUBT', profesion: 'UNKNOWN' },
        unknownNote: 'No sé si a otros les sirve.',
        learningQuestion: '¿Quiero repetir la muestra?',
      }],
      purpose: { status: 'EXPLORANDO', parts: { pasion: pasion.sourceRef }, edited: 'Quiero probar escribir ensayos.' },
    }, known);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.state.version).toBe('cruce-cualitativo@2');
    expect(saved.state.combinations[0]?.fieldStance?.mision).toBe('DOUBT');
    expect(saved.state.combinations[0]?.fieldStance?.profesion).toBe('UNKNOWN');
    expect(saved.state.purpose.edited).toBe('Quiero probar escribir ensayos.');
    expect(saved.state.purpose.generated).not.toContain('propósito es poner');
  });

  it('changes the future weekday and leaves the action id in place', () => {
    const next = applyWeekDecisions(
      [{ id: 'a', title: 'Escribir', doneWhen: 'Hay borrador', active: true, weekday: 1 }],
      { a: 'MODIFY' },
      { a: { weekday: 3 } },
    );
    expect(next[0]?.weekday).toBe(3);
    expect(next[0]?.id).toBe('a');
    expect(next[0]?.doneWhen).toBe('Hay borrador');
  });
});
