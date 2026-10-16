/** Títulos y claves OCEAN alineados a apps/api/src/instrumentos/personality-reading.ts */

export const PERSONALITY_FACTOR_ROWS: Array<{ key: string; title: string }> = [
  { key: 'Apertura', title: 'A. Apertura a la experiencia (creatividad y rutina)' },
  { key: 'Responsabilidad', title: 'R. Responsabilidad y conciencia (organización y espontaneidad)' },
  { key: 'Extraversión', title: 'E. Extraversión (energía social e introversión)' },
  { key: 'Amabilidad', title: 'M. Amabilidad y empatía (cooperación y competitividad)' },
  { key: 'Sensibilidad emocional', title: 'N. Neuroticismo y estabilidad emocional (sensibilidad y calma)' },
];

export function formatPersonalityAverage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return String(rounded).replace('.', ',');
}
