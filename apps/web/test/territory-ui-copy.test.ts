import { describe, expect, it } from 'vitest';
import {
  complianceCopy,
  territoryCoverageLabel,
  territoryCoveragePercent,
  territoryDesignPickerHint,
  territoryDesignPickerSubline,
} from '@/lib/territory-ui-copy';

describe('territory ui copy', () => {
  it('describes each ámbito for the design picker', () => {
    expect(territoryDesignPickerHint('MENTALIDAD')).toContain('Creencias');
    expect(territoryDesignPickerSubline('FINANZAS', null)).toContain('dinero');
    expect(territoryDesignPickerSubline('RELACIONES', { state: 'NOT_STARTED', settled: 0, required: 10 })).not.toContain('Descubre');
    expect(territoryDesignPickerSubline('SALUD_FISICA', { state: 'PARTIAL', settled: 4, required: 12 })).toContain('4 de 12');
  });

  it('maps coverage states to Spanish labels', () => {
    expect(territoryCoverageLabel('EXPLORED')).toBe('Explorado');
    expect(territoryCoverageLabel('PARTIAL')).toBe('En curso');
    expect(territoryCoverageLabel('NOT_STARTED')).toBe('Sin empezar');
  });

  it('computes percent with cap at 100', () => {
    expect(territoryCoveragePercent(35, 35)).toBe(100);
    expect(territoryCoveragePercent(0, 0)).toBe(0);
  });

  it('keeps a real zero and does not invent a percent', () => {
    expect(complianceCopy({ percent: 0, percentReason: null, done: 0, upcoming: 0, dueUnmarked: 0, noInformation: 0 })).toBe('0 %');
    expect(complianceCopy(null)).toBe('Sin ocasiones');
    expect(complianceCopy({ percent: null, percentReason: 'NO_INFORMATION', done: 1, upcoming: 0, dueUnmarked: 0, noInformation: 1 })).toBe('Sin completar registros');
    expect(complianceCopy({ percent: null, percentReason: 'OPEN_WEEK', done: 1, upcoming: 2, dueUnmarked: 0, noInformation: 0 })).toBe('En curso');
  });
});
