import { describe, expect, it } from 'vitest';
import {
  buildConfirmableSources,
  buildExplorationSynthesis,
  defaultExplorationDraft,
  directionSourcesFromDraft,
  explorationPair,
  looksLikePlaceholder,
  mergeExplorationDraft,
  readExplorationDraft,
  proposeLearning,
  recognizedLine,
} from '../src/journey/direction-exploration';

describe('direction-exploration', () => {
  it('reads draft from purpose content', () => {
    const draft = defaultExplorationDraft();
    draft.step = 'experience';
    draft.experience = 'Ayudé a un compañero';
    const read = readExplorationDraft({ directionExplorationDraft: draft });
    expect(read?.experience).toBe('Ayudé a un compañero');
  });

  it('builds confirmable sources from facts', () => {
    const sources = buildConfirmableSources(
      {
        vision: 'Un mundo más justo',
        values: ['Honestidad', 'Cuidado'],
        heritage: 'Mi abuela enseñaba',
        seal: 'Dejar huella en jóvenes',
      },
      { synthesis: { purpose: { edited: 'Unir enseñanza y cuidado' } } },
    );
    expect(sources.map((s) => s.id)).toEqual(['vision', 'values', 'ikigai', 'heritage', 'seal']);
  });

  it('shows what the person wrote and pairs two answers without composing a sentence', () => {
    const draft = mergeExplorationDraft(null, {
      step: 'synthesis',
      experience: 'Ayudé a un compañero a entender un problema',
      whyImportant: 'Me importó que después pudiera resolverlo solo',
      contribution: 'Querría hacer eso con personas que están empezando',
    });
    const synthesis = buildExplorationSynthesis(draft);
    expect(synthesis.insufficient).toBe(false);
    expect(synthesis.shared.map((row) => row.text)).toEqual([
      'Ayudé a un compañero a entender un problema',
      'Me importó que después pudiera resolverlo solo',
      'Querría hacer eso con personas que están empezando',
    ]);
    expect(synthesis.pair?.from.text).toBe('Me importó que después pudiera resolverlo solo');
    expect(synthesis.pair?.to.text).toBe('Querría hacer eso con personas que están empezando');
    expect(synthesis.pair?.rule).toMatch(/No sabemos si se relacionan/);
    expect(JSON.stringify(synthesis)).not.toMatch(/autonom/i);
  });

  it('falls back to the lived moment when what mattered is empty', () => {
    const pair = explorationPair(mergeExplorationDraft(null, { experience: 'Cociné con mis hijos', contribution: 'Más tiempo en casa' }));
    expect(pair?.from.id).toBe('experience');
  });

  it('does not pair test text, but keeps it as written', () => {
    const draft = mergeExplorationDraft(null, { experience: 'asdf', whyImportant: 'qwerty', contribution: 'test test' });
    const synthesis = buildExplorationSynthesis(draft);
    expect(synthesis.pair).toBeNull();
    expect(synthesis.insufficient).toBe(true);
    expect(synthesis.reason).toBe('TOO_LITTLE');
    expect(synthesis.shared.map((row) => row.text)).toEqual(['asdf', 'qwerty', 'test test']);
  });

  it('accepts short personal expressions as content', () => {
    for (const text of ['Mi familia', 'Enseñar', 'Cuidar a mamá', 'Paz']) expect(looksLikePlaceholder(text)).toBe(false);
    for (const text of ['asdf', 'sdfghjkl', 'aaaa', '1234', '...', 'test', 'lorem ipsum', 'xxx']) expect(looksLikePlaceholder(text)).toBe(true);
    const pair = explorationPair(mergeExplorationDraft(null, { whyImportant: 'Mi familia', contribution: 'Enseñar' }));
    expect(pair).not.toBeNull();
  });

  it('marks synthesis insufficient without inputs', () => {
    const synthesis = buildExplorationSynthesis(defaultExplorationDraft());
    expect(synthesis.insufficient).toBe(true);
    expect(synthesis.reason).toBe('NO_ANSWERS');
    expect(synthesis.pair).toBeNull();
  });

  it('a rejected pair stays rejected, and the person’s own connection needs no proposal', () => {
    const base = { whyImportant: 'Estar presente', contribution: 'Acompañar a quienes empiezan' };
    expect(buildExplorationSynthesis(mergeExplorationDraft(null, { ...base, connectionRejected: true })).reason).toBe('REJECTED');
    const own = buildExplorationSynthesis(mergeExplorationDraft(null, { ...base, connection: 'Las dos son sobre no dejar a nadie solo' }));
    expect(own.ownConnection).toBe('Las dos son sobre no dejar a nadie solo');
    expect(own.insufficient).toBe(false);
  });

  it('only the person’s own phrase becomes the direction, whatever they answered about the pair', () => {
    const base = { whyImportant: 'Estar presente', contribution: 'Acompañar a quienes empiezan' };
    expect(recognizedLine(mergeExplorationDraft(null, { ...base, recognition: 'represents' }))).toBeNull();
    expect(recognizedLine(mergeExplorationDraft(null, { ...base, recognition: 'partial', provisionalDirection: 'Acompañar sin cargar con todo' }))).toBe('Acompañar sin cargar con todo');
    expect(recognizedLine(mergeExplorationDraft(null, { ...base, recognition: 'unseen' }))).toBeNull();
  });

  it('freezes the answers and kept sources a saved direction came from', () => {
    const sources = buildConfirmableSources({ vision: 'Un mundo más justo', values: ['Honestidad'] }, {});
    const draft = mergeExplorationDraft(null, {
      whyImportant: 'Estar presente',
      contribution: 'Acompañar',
      sourceConfirmations: { vision: 'yes', values: 'skip' },
    });
    expect(directionSourcesFromDraft(draft, sources)).toEqual([
      { id: 'important', label: 'Lo que te importó', text: 'Estar presente' },
      { id: 'contribution', label: 'Lo que te gustaría aportar o cuidar', text: 'Acompañar' },
      { id: 'source:vision', label: 'Tu respuesta sobre visión', text: 'Un mundo más justo' },
    ]);
  });

  it('proposes a presence question and a trial the person controls', () => {
    const draft = mergeExplorationDraft(null, {
      step: 'trial',
      experience: 'Cociné con mis hijos',
      whyImportant: 'Estar presente con ellos, sin apuro',
      recognition: 'represents',
      provisionalDirection: 'Estar presente con ellos, sin apuro',
      questionAccepted: '¿Qué me ayuda a estar presente con ellos, sin apuro?',
    });
    const learning = proposeLearning(draft);
    expect(learning.question).toMatch(/presente/i);
    expect(learning.trial).toMatch(/momento compartido/i);
    expect(learning.trial).not.toMatch(/cocinar|tienen que/i);
    expect(learning.observe).toMatch(/presente/i);
    expect(learning.observe).not.toMatch(/caus/i);
  });

  it('does not prescribe walking unless they recognized it', () => {
    const draft = mergeExplorationDraft(null, {
      step: 'trial',
      experience: 'Volví a caminar y noté que descansé mejor',
      whyImportant: 'Cuidar el bienestar sin convertirlo en una obligación enorme',
      recognition: 'represents',
      provisionalDirection: 'Cuidar el bienestar sin convertirlo en una obligación enorme',
      questionAccepted: '¿Qué forma pequeña de cuidarme me gustaría conservar?',
    });
    const learning = proposeLearning(draft);
    expect(learning.question).toMatch(/forma pequeña de cuidarme/i);
    expect(learning.trial).not.toMatch(/camin/i);
    expect(learning.observe).not.toMatch(/causó|caminar caus/i);
  });

  it('does not invent a question or a trial from an ordinary phrase', () => {
    const draft = mergeExplorationDraft(null, {
      step: 'trial',
      experience: 'El perro vuela los martes',
      whyImportant: 'Quiero pizza los viernes',
      contribution: 'Coleccionar tapas',
      recognition: 'represents',
      provisionalDirection: 'Quiero pizza los viernes con quien esté',
      questionAccepted: '¿Qué me ayuda a querer pizza los viernes?',
    });
    const learning = proposeLearning(draft);
    expect(learning.question).toBeNull();
    expect(learning.trial).toBeNull();
    expect(learning.recognized).toMatch(/pizza/i);
  });

  it('labels a generated IKIGAI sentence as a template, not a confirmed purpose', () => {
    const sources = buildConfirmableSources({}, {
      synthesis: { purpose: { generated: 'Mi propósito es poner mi enseñar y mi talento en cuidar al servicio de la familia, generando valor a través de clases.' } },
    });
    expect(sources.find((row) => row.id === 'ikigai')?.origin).toMatch(/No es un propósito confirmado/);
  });

  it('does not invent a proposal from a thin note', () => {
    const draft = mergeExplorationDraft(null, {
      step: 'trial',
      experience: 'asdf',
      whyImportant: 'no se',
      recognition: 'represents',
      provisionalDirection: 'asdf',
    });
    const learning = proposeLearning(draft);
    expect(learning.question).toBeNull();
    expect(learning.trial).toBeNull();
    expect(learning.contextual).toMatch(/qué parte/i);
  });

  it('keeps the original note when the relation is unseen', () => {
    const draft = mergeExplorationDraft(null, {
      step: 'synthesis',
      experience: 'Cociné con mis hijos',
      recognition: 'unseen',
      connectionRejected: true,
    });
    expect(draft.experience).toMatch(/Cociné/);
    expect(proposeLearning(draft).trial).toBeNull();
    expect(proposeLearning(draft).recognized).toBeNull();
  });
});
