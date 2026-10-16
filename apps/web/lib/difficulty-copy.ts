/** Copy compartido para bloques PR/ER/PY/D/IN en perfil y admin. */

export const DIFFICULTY_MODULE_INTRO =
  'Resumen de lo que marcaste en el bloque de sombra del cuestionario. Cada fila suma nueve respuestas: Sí vale 2, Más o menos 1, No 0.';

export const SHADOW_BLOCK_COPY = {
  interferenceTitle: 'Bloqueos que reconoces',
  interferenceNote:
    'Cuatro familias de sombra. Un puntaje más alto en una fila indica que reconociste más conductas de ese tipo en ti (máximo 18 por fila).',
  integrationTitle: 'Capacidades que reconoces',
  integrationNote:
    'Límites, talento y manejo del error. Un puntaje más alto indica que te ves con más recursos conscientes en esas áreas (máximo 18 en total).',
  integrationRowLabel: 'Puntaje del bloque',
} as const;

export type DifficultyKind = 'interferencia' | 'recurso';

export function difficultyLevel(value: number, kind: DifficultyKind): string {
  if (kind === 'recurso') {
    if (value <= 5) return 'Pocos recursos declarados';
    if (value <= 12) return 'Recursos en rango medio';
    return 'Muchos recursos declarados';
  }
  if (value <= 5) return 'Poca sombra declarada en este bloque';
  if (value <= 12) return 'Sombra moderada en este bloque';
  return 'Mucha sombra declarada en este bloque';
}

export function difficultyFigure(part: { value?: number | null; calculable?: boolean } | undefined, kind: DifficultyKind): string {
  if (!part?.calculable || part.value == null) return 'Pendiente';
  return `${part.value} de 18. ${difficultyLevel(part.value, kind)}.`;
}

export function shadowTotalsCopy(interference: number, integration: number): string {
  return `Bloqueos sumados: ${interference} de 72 posibles. Recursos sumados: ${integration} de 18 posibles.`;
}
