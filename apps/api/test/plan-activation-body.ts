/** Campos mínimos para activar un plan en preparación en pruebas HTTP. */
export function activatePlanBody(overrides?: {
  confirmed?: boolean;
  capacityMinutes?: number;
  protectNote?: string | null;
  explicitNoSchedule?: boolean;
}) {
  return {
    status: 'ACTIVE' as const,
    confirmed: true,
    capacityMinutes: 120,
    protectNote: 'Nada que proteger por ahora.',
    ...overrides,
  };
}
