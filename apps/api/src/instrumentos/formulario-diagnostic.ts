/** Sheet diagnostics aligned to E-AUD-001, F-RAD-002 and evaluación cuantitativa (C42). */

export function auditSheetDiagnostic(total: number): string {
  if (total <= 0) return 'Sin desarrollo';
  if (total < 46) return 'CRÍTICO. Desalineación Total';
  if (total < 69) return 'INESTABLE. Intención sin Sistema';
  if (total < 92) return 'SÓLIDO. Identidad en Construcción';
  if (total <= 115) return 'DOMINANTE. Alineación y Control';
  return 'Fuera de rango';
}

export function relationSheetDiagnostic(total: number): string {
  if (total <= 0) return 'Sin desarrollo';
  if (total <= 28) return 'Entorno en detrimento crítico';
  if (total <= 48) return 'Entorno en alerta por aislamiento o discrepancia';
  if (total <= 60) return 'Entorno propulsor soberano';
  return 'Fuera de rango';
}

export function financeSheetDiagnostic(total: number): string {
  if (total <= 0) return 'Sin desarrollo';
  if (total <= 24) return 'Nivel crítico. Supervivencia y asfixia';
  if (total <= 44) return 'Nivel de alerta. Estancamiento o techo de valor';
  if (total <= 60) return 'Nivel óptimo';
  return 'Fuera de rango';
}
