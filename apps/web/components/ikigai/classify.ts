const INTUITION = new Set(['ATRACCION', 'INTUICION', 'INDIRECTA', 'NO_PROBADO', 'DESCONOCIDO']);
const BACKED = new Set([
  'SOSTENIDO',
  'OCASIONAL',
  'RESULTADOS',
  'EXPERIENCIA',
  'SENALES',
  'VIVIDA',
  'OBSERVADA',
  'SOSTUVO_A_MI',
  'SOSTIENE_A_OTROS',
]);

export function classifyLocal(key: string | null): 'backed' | 'intuition' | 'unmarked' {
  if (!key) return 'unmarked';
  if (INTUITION.has(key)) return 'intuition';
  if (BACKED.has(key)) return 'backed';
  return 'unmarked';
}
