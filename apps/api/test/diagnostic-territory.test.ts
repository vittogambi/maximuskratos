import { describe, expect, it } from 'vitest';
import {
  moduleFullySettled,
  moduleMatchesTerritory,
  parseTerritoryParam,
  questionMatchesTerritory,
  readFocusTerritory,
  selectPlayable,
  territoryQuestionsSettled,
  withFocusTerritory,
  withoutFocusTerritory,
} from '../src/diagnostic/diagnostic-territory';

describe('diagnostic-territory', () => {
  it('parses known territories', () => {
    expect(parseTerritoryParam('finanzas')).toBe('FINANZAS');
  });

  it('matches audit rows to salud', () => {
    expect(
      moduleMatchesTerritory(
        [{ sourceRef: 'formulario-v1:E-AUD-001!R16' }],
        'SALUD_FISICA',
      ),
    ).toBe(true);
    expect(questionMatchesTerritory('formulario-v1:E-AUD-001!R6', 'FINANZAS')).toBe(false);
  });

  it('does not finish a shared module when only one territory is settled', () => {
    const shared = {
      status: 'IN_PROGRESS',
      outroSeen: false,
      module: {
        questions: [
          { id: 's16', sourceRef: 'formulario-v1:E-AUD-001!R16' },
          { id: 's17', sourceRef: 'formulario-v1:E-AUD-001!R17' },
          { id: 's18', sourceRef: 'formulario-v1:E-AUD-001!R18' },
          { id: 'm19', sourceRef: 'formulario-v1:E-AUD-001!R19' },
          { id: 'm20', sourceRef: 'formulario-v1:E-AUD-001!R20' },
        ],
      },
    };
    const saludSettled = new Set(['s16', 's17', 's18']);
    expect(moduleFullySettled(shared.module.questions, saludSettled)).toBe(false);
    expect(territoryQuestionsSettled([shared], saludSettled, 'SALUD_FISICA')).toBe(true);
    expect(selectPlayable([shared], saludSettled, 'SALUD_FISICA')).toBeNull();
    expect(selectPlayable([shared], saludSettled, 'MENTALIDAD')?.module.questions.map((q) => q.id)).toEqual([
      's16', 's17', 's18', 'm19', 'm20',
    ]);
    const both = new Set(['s16', 's17', 's18', 'm19', 'm20']);
    expect(moduleFullySettled(shared.module.questions, both)).toBe(true);
    expect(selectPlayable([shared], both, 'MENTALIDAD')).toBe(shared);
  });

  it('keeps an exception settled and a pending answer open', () => {
    const shared = {
      status: 'COMPLETE',
      outroSeen: true,
      module: {
        questions: [
          { id: 'rel', sourceRef: 'formulario-v1:E-AUD-001!R28' },
          { id: 'men', sourceRef: 'formulario-v1:E-AUD-001!R26' },
        ],
      },
    };
    const settled = new Set(['rel']);
    expect(territoryQuestionsSettled([shared], settled, 'RELACIONES')).toBe(true);
    expect(selectPlayable([shared], settled, 'MENTALIDAD')).toBe(shared);
    expect(selectPlayable([shared], settled, 'RELACIONES')).toBeNull();
    expect(moduleFullySettled(shared.module.questions, settled)).toBe(false);
  });

  it('resumes the module that still has an open question after leaving', () => {
    const first = {
      status: 'IN_PROGRESS',
      outroSeen: false,
      module: { questions: [{ id: 'done', sourceRef: 'formulario-v1:E-AUD-001!R6' }] },
    };
    const second = {
      status: 'AVAILABLE',
      outroSeen: false,
      module: { questions: [{ id: 'open', sourceRef: 'formulario-v1:E-AUD-001!R7' }] },
    };
    expect(selectPlayable([first, second], new Set(['done']), 'MENTALIDAD')).toBe(second);
  });

  it('drops the territory focus without touching other metadata', () => {
    const focused = withFocusTerritory({ source: 'panel' }, 'MENTALIDAD');
    expect(readFocusTerritory(focused)).toBe('MENTALIDAD');
    const general = withoutFocusTerritory(focused);
    expect(readFocusTerritory(general)).toBeNull();
    expect(general.source).toBe('panel');
  });
});
