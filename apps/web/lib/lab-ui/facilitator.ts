export const FACILITATOR_HEADINGS = [
  'Lo que estamos poniendo a prueba',
  'Lo que hace la Matriz actual',
  'La decisión que queremos revisar',
  'Por qué importa',
] as const;

export type FacilitatorBlock = {
  heading: string;
  body: string;
};

export function parseFacilitatorBrief(note: string): FacilitatorBlock[] | null {
  const parts = note
    .split(/^##\s+/m)
    .map((part) => part.trim())
    .filter(Boolean);
  const blocks = parts.map((part) => {
    const breakAt = part.indexOf('\n');
    if (breakAt === -1) return { heading: part, body: '' };
    return { heading: part.slice(0, breakAt).trim(), body: part.slice(breakAt).trim() };
  });
  if (
    blocks.length === FACILITATOR_HEADINGS.length &&
    FACILITATOR_HEADINGS.every((heading, index) => blocks[index]?.heading === heading)
  ) {
    return blocks;
  }
  return null;
}
