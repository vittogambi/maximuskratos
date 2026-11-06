import { describe, expect, it } from 'vitest';
import { buildPurposeEvidence, type EvidenceInput } from '../src/journey/purpose-evidence';
import { snapshotSources } from '../src/journey/member-direction';

const questions: EvidenceInput['questions'] = [
  { moduleSlug: 'e-per-vision', order: 6, sourceRef: 'formulario-v1:E-PER-000!R33', textEs: 'Resuma su visión personal en una frase central (máx. 5 líneas)' },
  { moduleSlug: 'e-per-vision', order: 7, sourceRef: 'formulario-v1:E-PER-000!R34', textEs: 'Si tuvieses 6 meses de vida, ¿qué priorizaría hacer?' },
  { moduleSlug: 'e-per-valores', order: 3, sourceRef: 'formulario-v1:E-PER-000!R51', textEs: 'De los anteriores, selecciona 3 valores esenciales' },
];

describe('lo que Propósito puede consultar del cuestionario', () => {
  it('sin cuestionario no hay respuestas y la entrada es empezar', () => {
    const sections = buildPurposeEvidence({ sessionStatus: null, moduleStatus: {}, questions, responses: [], activities: [] });
    expect(sections.map((row) => [row.id, row.answered, row.access, row.href])).toEqual([
      ['vision', 0, 'NOT_STARTED', '/diagnostico?alcance=general'],
      ['values', 0, 'NOT_STARTED', '/diagnostico?alcance=general'],
      ['ikigai', 0, 'NOT_STARTED', '/diagnostico?alcance=general'],
    ]);
  });

  it('muestra la respuesta literal, las opciones en su orden y la excepción que eligió la persona', () => {
    const [vision, values, ikigai] = buildPurposeEvidence({
      sessionStatus: 'ACTIVE',
      moduleStatus: { 'e-per-vision': 'COMPLETE', 'e-per-valores': 'COMPLETE', 'e-per-ikigai': 'LOCKED' },
      questions,
      responses: [
        { sourceRef: 'formulario-v1:E-PER-000!R33', moduleSlug: 'e-per-vision', freeText: 'Vivir cerca de mi familia', options: [], exceptionKind: null, skipped: false },
        { sourceRef: 'formulario-v1:E-PER-000!R34', moduleSlug: 'e-per-vision', freeText: null, options: [], exceptionKind: 'DECLINED', skipped: false },
        {
          sourceRef: 'formulario-v1:E-PER-000!R51', moduleSlug: 'e-per-valores', freeText: null, exceptionKind: null, skipped: false,
          options: [{ order: 9, textEs: 'Familia' }, { order: 2, textEs: 'Honestidad' }, { order: 5, textEs: 'Libertad' }],
        },
      ],
      activities: [],
    });
    expect(vision!.groups.map((group) => group.items[0])).toEqual([
      { status: 'ANSWERED', texts: ['Vivir cerca de mi familia'] },
      { status: 'DECLINED', texts: [] },
    ]);
    expect(vision!.answered).toBe(1);
    expect(values!.groups[0]!.items[0]!.texts).toEqual(['Honestidad', 'Libertad', 'Familia']);
    expect(ikigai).toMatchObject({ answered: 0, access: 'LATER', href: '/diagnostico' });
  });

  it('IKIGAI se muestra por los cuatro campos del cuestionario, sin cruce ni puntaje', () => {
    const ikigai = buildPurposeEvidence({
      sessionStatus: 'COMPLETED',
      moduleStatus: {},
      questions: [],
      responses: [],
      activities: [
        { sourceRef: 'r220', field: 'pasion', ambit: '', option: '', answer: 'Cocinar' },
        { sourceRef: 'r234', field: 'mision', ambit: '', option: '', answer: 'Acompañar a jóvenes' },
      ],
    })[2]!;
    expect(ikigai.groups.map((group) => group.title)).toEqual(['Pasión', 'Vocación', 'Misión', 'Profesión']);
    expect(ikigai.groups[1]!.items).toEqual([{ status: 'EMPTY', texts: [] }]);
    expect(ikigai).toMatchObject({ answered: 2, total: 4, access: 'ANSWERED', href: null });
  });
});

describe('fuentes usadas al guardar una dirección', () => {
  it('copia el texto desde el servidor y descarta lo que no existe', () => {
    const rows = snapshotSources({ vision: 'Un hogar tranquilo', values: ['Familia'], ikigaiPurpose: null }, ['vision', 'ikigaiPurpose', 'inventada']);
    expect(rows).toEqual([{ id: 'vision', label: 'Tu respuesta sobre visión', text: 'Un hogar tranquilo' }]);
  });
});
