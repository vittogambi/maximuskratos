import { describe, expect, it } from 'vitest';
import { devolutionOf, standardCriterion } from '../src/journey/accompaniment/devolution';
import { draftAccompanimentHelp } from '../src/journey/accompaniment/help';
import { proposeAccompaniment, type AccompanimentInput } from '../src/journey/accompaniment/rules';

function goal(over: Partial<AccompanimentInput> = {}): AccompanimentInput {
  return {
    goalText: 'Escribir una guía breve.',
    goalKind: 'ENTREGAR',
    interest: null,
    territory: 'MENTALIDAD',
    situation: null,
    occasions: 2,
    weeklyMinutes: 90,
    minutesPerOccasion: 45,
    reviewMinutes: 0,
    general: 54,
    ...over,
  };
}

describe('devolución después del cuestionario', () => {
  it('1 sin dirección y con una actividad conocida ofrece un experimento reconocible', () => {
    const reading = devolutionOf({
      direction: 'EXPLORANDO', visionDay: null, visionPhrase: null, valueDefended: null, weeklyStandard: null, postpone: null,
      ikigaiActivity: 'Explicar una tarea del oficio', goalText: null, goalKind: null,
    });
    const explore = reading.paths.find((path) => path.id === 'EXPLORAR');
    expect(explore?.personalized).toBe(true);
    expect(explore?.firstStep).toMatch(/oficio/);
  });

  it('2 sin datos suficientes la exploración se declara general', () => {
    const reading = devolutionOf({
      direction: 'EXPLORANDO', visionDay: null, visionPhrase: null, valueDefended: null, weeklyStandard: null, postpone: null,
      ikigaiActivity: null, goalText: null, goalKind: null,
    });
    const explore = reading.paths.find((path) => path.id === 'EXPLORAR');
    expect(explore?.personalized).toBe(false);
    expect(explore?.title).toMatch(/general/i);
  });

  it('3 una meta clara se conserva y se prepara', () => {
    const reading = devolutionOf({
      direction: 'PROVISIONAL', visionDay: null, visionPhrase: 'Contribuir al equipo', valueDefended: 'Servicio', weeklyStandard: null, postpone: null,
      ikigaiActivity: null, goalText: 'Escribir una guía', goalKind: 'ENTREGAR',
    });
    expect(reading.paths.some((path) => path.id === 'PREPARAR' && path.evidence[0]?.text === 'Escribir una guía')).toBe(true);
    const proposal = proposeAccompaniment(goal());
    expect(proposal.familyId).toBe('MEN-EST');
    expect(proposal.indexUsed).toBe(false);
  });

  it('4 un plan propio no recibe una guía obligatoria', () => {
    const proposal = proposeAccompaniment(goal({ helpPreference: 'PROPIO' }));
    expect(proposal.requiresAction).toBe(false);
    expect(proposal.suggestion).toBe('OFF');
    expect(draftAccompanimentHelp(proposal, goal()).action).toBeNull();
  });

  it('5 el mismo núcleo con metas distintas no comparte la ayuda', () => {
    const write = proposeAccompaniment(goal());
    const teach = proposeAccompaniment(goal({ goalKind: 'ENSENAR_O_CONTRIBUIR', goalText: 'Explicar el oficio.' }));
    expect(write.familyId).not.toBe(teach.familyId);
    expect(write.indexUsed).toBe(false);
    expect(teach.indexUsed).toBe(false);
  });

  it('6 el mismo entregable con otro estándar cambia el criterio', () => {
    const open = proposeAccompaniment(goal({ weeklyStandard: null }));
    const cited = proposeAccompaniment(goal({ weeklyStandard: 'Completar un avance verificable del trabajo.' }));
    expect(open.familyId).toBe(cited.familyId);
    expect(cited.criterionNote).toMatch(/avance verificable/);
    expect(draftAccompanimentHelp(cited, goal()).doneWhen).toMatch(/avance verificable/);
    const tight = proposeAccompaniment(goal({
      occasions: 1, weeklyMinutes: 45, minutesPerOccasion: 45,
      weeklyStandard: 'Familia, amistad, trabajo y trascendencia, cada uno esta semana.',
    }));
    expect(tight.missing.some((row) => row.key === 'standard')).toBe(true);
    expect(tight.criterionNote).toBeNull();
  });

  it('7 una postergación no confirmada pregunta y no cambia la preparación', () => {
    const proposal = proposeAccompaniment(goal({ postpone: 'SI' }));
    expect(proposal.missing.some((row) => row.key === 'postpone')).toBe(true);
    expect(draftAccompanimentHelp(proposal, goal({ postpone: 'SI' })).action).not.toMatch(/momento perfecto/);
  });

  it('8 rechazar la espera deja de atribuirla', () => {
    const proposal = proposeAccompaniment(goal({
      postpone: 'SI',
      barrier: { kind: 'ESPERAR_EL_MOMENTO', choice: 'REJECT' },
    }));
    expect(proposal.reasons.some((row) => row.text.includes('Dejo de atribuírtela'))).toBe(true);
    expect(draftAccompanimentHelp(proposal, goal()).action).not.toMatch(/momento perfecto/);
  });

  it('9 reconocer la espera cambia la preparación y no el índice', () => {
    const proposal = proposeAccompaniment(goal({
      postpone: 'SI',
      barrier: { kind: 'ESPERAR_EL_MOMENTO', choice: 'RECOGNIZE' },
      general: 80,
    }));
    expect(draftAccompanimentHelp(proposal, goal()).action).toMatch(/se pueda leer/);
    expect(proposal.indexUsed).toBe(false);
    expect(JSON.stringify(proposal.reasons)).not.toContain('80');
  });

  it('10 capacidad cero permite pausar', () => {
    const proposal = proposeAccompaniment(goal({ occasions: 0, weeklyMinutes: 0 }));
    expect(proposal.situation).toBe('PAUSE');
    expect(proposal.requiresAction).toBe(false);
  });

  it('11 sin general igual hay una ayuda', () => {
    const proposal = proposeAccompaniment(goal({ general: null }));
    expect(proposal.requiresAction).toBe(true);
    expect(proposal.familyId).toBe('MEN-EST');
  });

  it('12 el origen desconocido no entra en la razón', () => {
    const proposal = proposeAccompaniment(goal());
    expect(JSON.stringify(proposal.reasons)).not.toMatch(/linaje|genealog/i);
  });

  it('13 un estándar que no cabe en una ocasión se muestra como tensión, no como obligación', () => {
    const fitted = standardCriterion({
      standard: 'Cuatro fuentes cada semana.',
      choice: null,
      occasions: 1,
    });
    expect(fitted?.tension).toMatch(/una parte/);
  });

  it('14 y 17 la guía se puede dejar apagada sin tarea nueva', () => {
    const proposal = proposeAccompaniment(goal({ helpPreference: 'PROPIO', helpRequested: false }));
    expect(proposal.suggestion).toBe('OFF');
    expect(proposal.requiresAction).toBe(false);
  });

  it('16 el retorno sin otro tipo recupera la meta y no es contención', () => {
    const proposal = proposeAccompaniment(goal({
      situation: 'RETURN',
      goalKind: null,
      goalText: null,
      interest: 'RETOMAR',
      goalSource: 'RECOVERED',
      recoveredGoal: { text: 'Escribir una guía breve.', kind: 'ENTREGAR', territory: 'MENTALIDAD' },
    }));
    expect(proposal.situation).toBe('RETURN');
    expect(proposal.mode).not.toBe('CONTENCION');
    expect(proposal.familyId).toBe('MEN-EST');
  });
});
