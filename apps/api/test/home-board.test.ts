import { describe, expect, it } from 'vitest';
import type { IndexCard } from '../src/instrumentos/core-reading';
import { homeBoard, homeSituation, type HomeFacts } from '../src/journey/home-board';

function card(partial: Partial<IndexCard> = {}): IndexCard {
  return {
    name: 'Índice de alineación MK',
    methodVersion: 'ia-mk-cuest@0.1',
    kind: 'INITIAL',
    general: 40,
    partial: null,
    pillars: { espiritu: 30, mente: 40, cuerpo: 50 },
    coverage: { eligible: 20, required: 20 },
    pending: [],
    answeredAt: '2026-10-01T12:00:00.000Z',
    computedAt: '2026-10-01T15:00:00.000Z',
    explanation: 'Índice de alineación MK. Lectura inicial del cuestionario. Método en revisión.',
    delta: null,
    ...partial,
  };
}

const closed: Partial<HomeFacts> = { formularioCompleted: true, hasActiveSession: false };

describe('tablero de inicio', () => {
  it('separa el cuestionario abierto, el cierre, la exploración y los planes', () => {
    expect(homeSituation({ ...closed, formularioCompleted: false } as HomeFacts)).toBe('QUESTIONNAIRE');
    expect(homeSituation({ ...closed, hasActiveSession: true } as HomeFacts)).toBe('QUESTIONNAIRE');
    expect(homeSituation(closed as HomeFacts)).toBe('JUST_CLOSED');
    expect(homeSituation({ ...closed, directionStatus: 'EXPLORANDO' } as HomeFacts)).toBe('EXPLORING');
    expect(homeSituation({ ...closed, preference: 'GUIADA' } as HomeFacts)).toBe('GUIDED');
    expect(homeSituation({ ...closed, preference: 'PROPIO' } as HomeFacts)).toBe('OWN');
    expect(homeSituation({ ...closed, headSituation: 'PAUSE' } as HomeFacts)).toBe('PAUSED');
    expect(homeSituation({ ...closed, headSituation: 'RETURN', preference: 'GUIADA' } as HomeFacts)).toBe('RETURN');
  });

  it('una medición queda como estado inicial y la revisión no cambia el índice', () => {
    const index = card();
    const before = homeBoard({ ...closed, index, history: [index] });
    const after = homeBoard({
      ...closed,
      index,
      history: [index],
      review: { weekStart: '2026-10-12', note: 'Hecho', changes: ['La ocasión futura cambia de título.'] },
    });
    expect(before.evolution.status).toBe('INITIAL');
    expect(after.reading?.general).toBe(40);
    expect(after.reading?.general).toBe(before.reading?.general);
    expect(after.review?.changes).toEqual(['La ocasión futura cambia de título.']);
  });

  it('dos lecturas comparables muestran la diferencia y un general vacío no es cero', () => {
    const initial = card({ general: 40, computedAt: '2026-10-01T15:00:00.000Z' });
    const later = card({ kind: 'REMEASURE', general: 55, delta: 15, computedAt: '2026-11-01T15:00:00.000Z' });
    const comparable = homeBoard({ ...closed, index: later, history: [initial, later] });
    expect(comparable.evolution.status).toBe('COMPARABLE');
    expect(comparable.evolution.delta).toBe(15);
    const partial = card({ general: null, pillars: { espiritu: 30, mente: null, cuerpo: null }, coverage: { eligible: 4, required: 20 }, delta: null });
    const open = homeBoard({ ...closed, index: partial, history: [partial] });
    expect(open.reading?.general).toBeNull();
    expect(open.evolution.status).toBe('INITIAL');
    const incomparable = homeBoard({
      ...closed,
      index: card({ delta: null, kind: 'REMEASURE' }),
      history: [initial, card({ kind: 'REMEASURE', general: 55, delta: null, computedAt: '2026-11-01T15:00:00.000Z' })],
    });
    expect(incomparable.evolution.status).toBe('NOT_COMPARABLE');
  });

  it('los ámbitos conservan el valor original y no reciben el índice del pilar', () => {
    const board = homeBoard({
      ...closed,
      index: card(),
      signals: [{ id: 'E7', sourceRef: 'formulario-v1:E-AUD-001!R7', raw: 3 }],
    });
    const mind = board.territories.items.find((item) => item.territory === 'MENTALIDAD');
    expect(board.territories.figure).toBeNull();
    expect(board.territories.method).toBeNull();
    expect(mind?.readings).toEqual([{ id: 'E7', raw: 3, scale: 'de 1 a 5' }]);
    expect(JSON.stringify(mind)).not.toContain('"raw":40');
  });

  it('la pausa no anuncia una ocasión y el texto editado sigue siendo la síntesis', () => {
    const board = homeBoard({
      ...closed,
      headSituation: 'PAUSE',
      pausedPlan: {
        id: 'plan-1', title: 'Escribir', outcome: 'Hay un párrafo.', priorityNote: 'Lo hago el lunes.', linkKind: 'DIRECT', status: 'PAUSED', guided: true,
      },
      occasion: { day: '2026-10-13', title: 'Escribir', criterion: 'Hay un párrafo.' },
      synthesis: { text: 'Lo escribo a mi modo.', source: 'EDITED' },
    });
    expect(board.situation).toBe('PAUSED');
    expect(board.occasion).toBeNull();
    expect(board.plan?.title).toBe('Escribir');
    expect(board.synthesis).toEqual({ text: 'Lo escribo a mi modo.', source: 'EDITED' });
  });
});
