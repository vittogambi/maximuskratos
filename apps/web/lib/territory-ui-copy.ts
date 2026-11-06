/** Etiquetas de producto para estados de cobertura por ámbito. */
export function territoryIcon(territory: string | null | undefined): string {
  switch (territory) {
    case 'FINANZAS':
      return 'wallet';
    case 'RELACIONES':
      return 'users';
    case 'SALUD_FISICA':
      return 'dumbbell';
    default:
      return 'brain';
  }
}

export function territoryCoverageLabel(state: string | undefined): string {
  switch (state) {
    case 'EXPLORED':
      return 'Explorado';
    case 'PARTIAL':
      return 'En curso';
    case 'NOT_STARTED':
    default:
      return 'Sin empezar';
  }
}

export function territoryCoveragePercent(settled: number, required: number): number {
  if (required <= 0) return 0;
  return Math.min(100, Math.round((settled / required) * 100));
}

export function planStageLabel(stage: string | null | undefined): string {
  switch (stage) {
    case 'PREPARING':
      return 'En preparación';
    case 'ACTIVE':
      return 'Activo';
    case 'PAUSED':
      return 'En pausa';
    case 'MAINTENANCE':
      return 'En mantenimiento';
    case 'CLOSED':
      return 'Cerrado';
    default:
      return 'Sin plan';
  }
}

const TERRITORY_NAMES: Record<string, string> = {
  MENTALIDAD: 'Mentalidad',
  FINANZAS: 'Finanzas',
  RELACIONES: 'Relaciones',
  SALUD_FISICA: 'Salud física',
};

const TERRITORY_DESIGN_HINTS: Record<string, string> = {
  MENTALIDAD: 'Creencias, hábitos y formas de enfrentar lo que ocurre.',
  FINANZAS: 'Orden, prioridades y decisiones sobre el dinero.',
  RELACIONES: 'Vínculos con familia, pareja, amistades o trabajo.',
  SALUD_FISICA: 'Energía, descanso, alimentación y movimiento.',
};

/** Una línea bajo el nombre del ámbito al elegir dónde diseñar. */
export function territoryDesignPickerHint(territory: string | null | undefined): string {
  if (!territory) return '';
  return TERRITORY_DESIGN_HINTS[territory.toUpperCase()] ?? '';
}

export function territoryDesignPickerSubline(
  territory: string,
  discover: { state: string; settled: number; required: number } | null,
): string {
  const hint = territoryDesignPickerHint(territory);
  if (!discover || discover.state === 'NOT_STARTED') return hint;
  const coverage = territoryCoverageLabel(discover.state).toLowerCase();
  if (discover.state === 'PARTIAL' && discover.required > 0) {
    return `${hint} En Descubre, ${coverage}, ${discover.settled} de ${discover.required} preguntas.`;
  }
  return `${hint} En Descubre, ${coverage}.`;
}

export function territoryDisplayLabel(code: string | null | undefined): string {
  if (!code) return 'Plan';
  return TERRITORY_NAMES[code.toUpperCase()] ?? code.replaceAll('_', ' ');
}

export function discoverActionLabel(state: string | undefined): string {
  if (state === 'EXPLORED') return 'Ver respuestas';
  if (state === 'PARTIAL') return 'Continuar';
  return 'Empezar';
}

export function designActionLabel(stage: string | null | undefined): string {
  if (!stage) return 'Crear plan';
  if (stage === 'PREPARING') return 'Continuar borrador';
  if (stage === 'CLOSED') return 'Ver cierre';
  return 'Ver plan';
}

export function designStageBrief(stage: string | null | undefined): string {
  return planStageLabel(stage);
}

export function actStatusCopy(
  stage: string | null | undefined,
  nextTitle: string | null,
  week: { upcoming: number; dueUnmarked: number; done: number; percentReason?: string | null } | null,
): string {
  if (!stage) return 'Sin acciones todavía';
  if (stage === 'PREPARING') return 'Activa el plan primero';
  if (stage === 'PAUSED') return 'Plan en pausa';
  if (stage === 'CLOSED') return 'Ciclo cerrado';
  if (stage === 'MAINTENANCE') return 'En mantenimiento';
  if (week?.percentReason === 'NO_INFORMATION') return 'Registros incompletos';
  if (week?.percentReason === 'OPEN_WEEK' || (week && (week.done > 0 || week.upcoming > 0 || week.dueUnmarked > 0))) {
    return 'En curso';
  }
  if (nextTitle) return 'Próxima ocasión programada';
  return 'Sin ocasiones esta semana';
}

export function actWeekDetail(
  week: { upcoming: number; dueUnmarked: number; done: number; noInformation?: number } | null,
): string | null {
  if (!week) return null;
  const pending = week.upcoming + week.dueUnmarked;
  if (pending === 1) return '1 ocasión pendiente';
  if (pending > 1) return `${pending} ocasiones pendientes`;
  if (week.done === 1) return '1 ocasión hecha';
  if (week.done > 1) return `${week.done} ocasiones hechas`;
  if ((week.noInformation ?? 0) > 0) return 'Faltan registros';
  return null;
}

export function actActionLabel(stage: string | null | undefined): string {
  if (stage === 'CLOSED') return 'Ver historial';
  if (stage === 'PAUSED') return 'Revisar la pausa';
  return 'Ver mi semana';
}

export function complianceCopy(week: { percent: number | null; percentReason: string | null; done: number; upcoming: number; dueUnmarked: number; noInformation: number } | null): string {
  if (!week) return 'Sin ocasiones';
  if (week.percent != null) return `${week.percent} %`;
  if (week.percentReason === 'OPEN_WEEK') return 'En curso';
  if (week.percentReason === 'NO_INFORMATION') return 'Sin completar registros';
  if (week.percentReason === 'EXCEPTIONS') return 'Hay excepciones. Sin porcentaje';
  if (week.percentReason === 'LEGACY_WEEK') return 'Semana anterior. Sin porcentaje nuevo';
  return 'Sin ocasiones';
}
