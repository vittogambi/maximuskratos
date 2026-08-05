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

/**
 * Precio público sin símbolo de moneda (p. ej. 29.990).
 * Reduce saliencia del "pain of paying" vs $29.990 (Yang, Kimes & Sessarego, Cornell / IJHM).
 */
export function formatPricePlain(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(amount);
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

/** Cómo se expresa el cobro del plazo (sin el verbo "se cobra"). */
export function formatChargedEvery(periodMonths: number): string {
  switch (periodMonths) {
    case 1:
      return 'cada mes';
    case 3:
      return 'cada 3 meses';
    case 6:
      return 'cada 6 meses';
    case 12:
      return 'una vez al año';
    default:
      return `cada ${periodMonths} meses`;
  }
}

/** Plan mensural de referencia (ancla) dentro del set público. */
export function findMonthlyAnchor(plans: ReadonlyArray<{ periodMonths: number }>) {
  return plans.find((p) => p.periodMonths === 1) ?? null;
}

/** Equivalente mensual calculado desde el total del plazo (no un campo independiente). */
export function monthlyEquivalentFromTotal(priceAmount: number, periodMonths: number): number {
  if (periodMonths <= 0) return priceAmount;
  return Math.round(priceAmount / periodMonths);
}

/** Ahorro total del plazo vs pagar el ancla mes a mes durante esos meses. */
export function periodSavingsVsMonthly(
  plan: { periodMonths: number; priceAmount: number },
  monthlyAnchorPrice: number,
): number {
  if (plan.periodMonths <= 1) return 0;
  return Math.max(0, monthlyAnchorPrice * plan.periodMonths - plan.priceAmount);
}

/** Porcentaje de ahorro vs pagar el ancla mes a mes durante el plazo. */
export function periodSavingsPctVsMonthly(
  plan: { periodMonths: number; priceAmount: number },
  monthlyAnchorPrice: number,
): number {
  if (plan.periodMonths <= 1 || monthlyAnchorPrice <= 0) return 0;
  const full = monthlyAnchorPrice * plan.periodMonths;
  if (full <= 0) return 0;
  return Math.max(0, Math.round(((full - plan.priceAmount) / full) * 100));
}
