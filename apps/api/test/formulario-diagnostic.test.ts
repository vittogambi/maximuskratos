import { describe, expect, it } from 'vitest';
import { auditSheetDiagnostic, financeSheetDiagnostic, relationSheetDiagnostic } from '../src/instrumentos/formulario-diagnostic';

describe('formulario sheet diagnostics', () => {
  it('matches E-AUD-001 cuts on C15', () => {
    expect(auditSheetDiagnostic(0)).toBe('Sin desarrollo');
    expect(auditSheetDiagnostic(45)).toBe('CRÍTICO. Desalineación Total');
    expect(auditSheetDiagnostic(46)).toBe('INESTABLE. Intención sin Sistema');
    expect(auditSheetDiagnostic(68)).toBe('INESTABLE. Intención sin Sistema');
    expect(auditSheetDiagnostic(69)).toBe('SÓLIDO. Identidad en Construcción');
    expect(auditSheetDiagnostic(91)).toBe('SÓLIDO. Identidad en Construcción');
    expect(auditSheetDiagnostic(92)).toBe('DOMINANTE. Alineación y Control');
    expect(auditSheetDiagnostic(115)).toBe('DOMINANTE. Alineación y Control');
    expect(auditSheetDiagnostic(116)).toBe('Fuera de rango');
  });

  it('matches F-RAD-002 cuts on C33', () => {
    expect(relationSheetDiagnostic(0)).toBe('Sin desarrollo');
    expect(relationSheetDiagnostic(28)).toBe('Entorno en detrimento crítico');
    expect(relationSheetDiagnostic(29)).toBe('Entorno en alerta por aislamiento o discrepancia');
    expect(relationSheetDiagnostic(48)).toBe('Entorno en alerta por aislamiento o discrepancia');
    expect(relationSheetDiagnostic(49)).toBe('Entorno propulsor soberano');
    expect(relationSheetDiagnostic(60)).toBe('Entorno propulsor soberano');
  });

  it('matches evaluación cuantitativa cuts on C42', () => {
    expect(financeSheetDiagnostic(0)).toBe('Sin desarrollo');
    expect(financeSheetDiagnostic(24)).toBe('Nivel crítico. Supervivencia y asfixia');
    expect(financeSheetDiagnostic(25)).toBe('Nivel de alerta. Estancamiento o techo de valor');
    expect(financeSheetDiagnostic(44)).toBe('Nivel de alerta. Estancamiento o techo de valor');
    expect(financeSheetDiagnostic(45)).toBe('Nivel óptimo');
    expect(financeSheetDiagnostic(60)).toBe('Nivel óptimo');
  });
});
