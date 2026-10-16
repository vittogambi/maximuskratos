import { describe, expect, it } from 'vitest';
import { formatMethodVersionLabel } from '@/lib/method-version-label';

describe('formatMethodVersionLabel', () => {
  it('maps known methods without internal ia ids', () => {
    expect(formatMethodVersionLabel('ia-mk-cuest@0.1')).toBe('Índice de alineación MK, versión 0.1');
    expect(formatMethodVersionLabel('profundidad-mk@0.1')).toBe('Profundidad MK, versión 0.1');
    expect(formatMethodVersionLabel('iad-mk-0.1-borrador')).toBe('Ficha de alineación MK, borrador 0.1');
  });

  it('never surfaces ia-mk in output', () => {
    const label = formatMethodVersionLabel('ia-mk-cuest@0.1');
    expect(label.toLowerCase()).not.toMatch(/\bia\b/);
    expect(label).not.toContain('ia-mk');
  });
});
