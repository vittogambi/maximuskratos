/** User-facing labels for internal method version ids. DB values stay unchanged. */
const LABELS: Record<string, string> = {
  'ia-mk-cuest@0.1': 'Índice de alineación MK, versión 0.1',
  'profundidad-mk@0.1': 'Profundidad MK, versión 0.1',
  'iad-mk-0.1-borrador': 'Ficha de alineación MK, borrador 0.1',
  'cruce-cualitativo@2': 'Cruce cualitativo, versión 2',
};

export function formatMethodVersionLabel(version: string | null | undefined): string {
  const trimmed = version?.trim();
  if (!trimmed) return 'Sin versión de método';
  if (LABELS[trimmed]) return LABELS[trimmed];
  const at = /@(.+)$/.exec(trimmed);
  if (at) {
    const slug = trimmed.slice(0, trimmed.length - at[0].length).replace(/^ia-/, '').replace(/-/g, ' ');
    return `${slug}, versión ${at[1]}`;
  }
  return trimmed.replace(/^ia-/, '').replace(/^iad-mk-/, 'ficha MK ').replace(/-/g, ' ');
}
