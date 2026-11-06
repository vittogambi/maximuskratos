export const TERRITORY_OPTIONS = [
  ['MENTALIDAD', 'Mentalidad'],
  ['FINANZAS', 'Finanzas'],
  ['RELACIONES', 'Relaciones'],
  ['SALUD_FISICA', 'Salud física'],
] as const;

export function territoryLabel(value: string | null | undefined): string {
  return TERRITORY_OPTIONS.find((row) => row[0] === value)?.[1] ?? 'Sin ámbito';
}
