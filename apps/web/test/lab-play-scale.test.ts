import { describe, expect, it } from 'vitest';
import {
  filterDecimalInput,
  formatNumericLabel,
  numberLayout,
  parseBoundedNumber,
  serializeFieldMap,
} from '@/lib/lab-ui/play-scale';

describe('numeric play fields', () => {
  it('drops letters from a sleep hours field', () => {
    expect(filterDecimalInput('adadada')).toBe('');
    expect(filterDecimalInput('7a5')).toBe('75');
    expect(filterDecimalInput('7,5')).toBe('7,5');
    expect(filterDecimalInput('7.5')).toBe('7,5');
  });

  it('only accepts sleep hours between 0 and 24', () => {
    const layout = numberLayout({ id: 'D-CUE-07', scale_id: 'SLEEP_HOURS', scale: null });
    expect(layout).toEqual({ type: 'single', unit: 'horas', min: 0, max: 24 });
    expect(parseBoundedNumber('7,5', 0, 24)).toBe(7.5);
    expect(parseBoundedNumber('adadada', 0, 24)).toBeNull();
    expect(parseBoundedNumber('30', 0, 24)).toBeNull();
    expect(formatNumericLabel({ id: 'D-CUE-07', scale_id: 'SLEEP_HOURS', scale: null }, 7.5)).toBe(
      '7,5 horas',
    );
  });

  it('keeps basal data as labeled fields, not a blob of text', () => {
    const layout = numberLayout({ id: 'D-CUE-06', scale_id: 'NUMERIC', scale: null });
    expect(layout?.type).toBe('fields');
    if (layout?.type !== 'fields') throw new Error('expected fields');
    expect(serializeFieldMap(layout.fields, { edad: '42', estatura_cm: '178', peso_kg: '80', cintura_cm: '' })).toBe(
      JSON.stringify({ edad: 42, estatura_cm: 178, peso_kg: 80 }),
    );
    expect(serializeFieldMap(layout.fields, { edad: 'hola', estatura_cm: '178', peso_kg: '80', cintura_cm: '' })).toBeNull();
    expect(
      formatNumericLabel(
        { id: 'D-CUE-06', scale_id: 'NUMERIC', scale: null },
        JSON.stringify({ edad: 42, estatura_cm: 178, peso_kg: 80 }),
      ),
    ).toBe('42 años, 178 cm, 80 kg');
  });
});
