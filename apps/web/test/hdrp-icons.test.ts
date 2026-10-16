import { describe, expect, it } from 'vitest';
import { moduleIntroIcon } from '@/components/diagnostico/module-intro-icon';
import { SHEET_ANCHORS } from '@/components/journey/ContractSections';
import { DOMAINS } from '@/lib/mk-system';
import { HDRP_BLOCKS, MARCO_CARDS } from '@/lib/marco-central';

const icon = (label: string) => SHEET_ANCHORS.find((row) => row.label === label)?.icon;

describe('iconos de la hoja de ruta', () => {
  it('repite la marca del cuestionario y del marco para cada parte', () => {
    expect(icon('Origen')).toBe(moduleIntroIcon('e-per-origen', null));
    expect(icon('Origen')).toBe(MARCO_CARDS.find((card) => card.num === '01')?.icon);

    expect(icon('Identidad')).toBe(moduleIntroIcon('e-per-identidad', null));
    expect(icon('Identidad')).toBe(MARCO_CARDS.find((card) => card.title === 'Identidad')?.icon);

    expect(icon('Dirección')).toBe(moduleIntroIcon('e-per-vision', null));
    expect(icon('Dirección')).toBe(HDRP_BLOCKS.find((block) => block.title === 'Dirección')?.icon);
    expect(icon('Dirección')).toBe(MARCO_CARDS.find((card) => card.title === 'Visión')?.icon);

    expect(icon('Relaciones')).toBe(DOMAINS.find((domain) => domain.key === 'relaciones')?.icon);
    expect(icon('Relaciones')).toBe(moduleIntroIcon('e-aud-s5', null));

    expect(icon('Finanzas')).toBe(DOMAINS.find((domain) => domain.key === 'financiero')?.icon);
    expect(icon('Finanzas')).toBe(moduleIntroIcon('e-aud-s4', null));

    expect(icon('Ratificación')).toBe('circle-check');
  });
});
