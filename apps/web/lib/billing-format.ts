/** Formatea un monto en la unidad mínima de la moneda (CLP no tiene decimales). */
export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/** "1" -> "Mensual", "3" -> "Trimestral", etc. Cae a "Cada N meses" para valores no estándar. */
export function formatPeriod(periodMonths: number): string {
  switch (periodMonths) {
    case 1:
      return 'Mensual';
    case 3:
      return 'Trimestral';
    case 6:
      return 'Semestral';
    case 12:
      return 'Anual';
    default:
      return `Cada ${periodMonths} meses`;
  }
}

/** Cómo se cobra el plazo seleccionado (copia secundaria bajo el precio/mes). */
export function formatBillingCadence(periodMonths: number): string {
  switch (periodMonths) {
    case 1:
      return 'Se cobra cada mes';
    case 3:
      return 'Se cobra cada 3 meses';
    case 6:
      return 'Se cobra cada 6 meses';
    case 12:
      return 'Se cobra una vez al año';
    default:
      return `Se cobra cada ${periodMonths} meses`;
  }
}

/** Plan mensural de referencia (ancla) dentro del set público. */
export function findMonthlyAnchor(plans: ReadonlyArray<{ periodMonths: number }>) {
  return plans.find((p) => p.periodMonths === 1) ?? null;
}

/** Ahorro total del plazo vs pagar el ancla mes a mes durante esos meses. */
export function periodSavingsVsMonthly(
  plan: { periodMonths: number; priceAmount: number },
  monthlyAnchorPrice: number,
): number {
  if (plan.periodMonths <= 1) return 0;
  return Math.max(0, monthlyAnchorPrice * plan.periodMonths - plan.priceAmount);
}
