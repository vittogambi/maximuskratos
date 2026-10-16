import type { AnswerOptionDto } from '@/lib/api';

/** True when the stored label is just the numeric level (legacy seed artifact). */
export function isBareScaleLabel(textEs: string, order: number): boolean {
  const t = textEs.trim();
  return t === String(order) || (/^\d+$/.test(t) && parseInt(t, 10) === order);
}

/** Infer a readable middle label when anchors exist but intermediates were not stored. */
export function inferScaleLabel(
  order: number,
  scaleType: 'BEHAVIORAL' | 'FREQUENCY' | null | undefined,
): string {
  if (scaleType === 'FREQUENCY') {
    const labels: Record<number, string> = {
      2: 'Rara vez',
      3: 'A veces',
      4: 'Con frecuencia',
    };
    return labels[order] ?? '';
  }

  const labels: Record<number, string> = {
    2: 'En desacuerdo',
    3: 'Neutro / parcialmente',
    4: 'Mayormente de acuerdo',
  };
  return labels[order] ?? '';
}

export function resolveScaleLabel(
  opt: AnswerOptionDto,
  scaleType: 'BEHAVIORAL' | 'FREQUENCY' | null | undefined,
  ends?: { low: string; high: string },
): string {
  if (!isBareScaleLabel(opt.textEs, opt.order)) return opt.textEs;
  // Bare numbers stay numbers. Invented middles contradicted descending anchors.
  return String(opt.order);
}
