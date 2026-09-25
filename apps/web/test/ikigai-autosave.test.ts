import { describe, expect, it, vi } from 'vitest';
import { DraftSaver } from '@/lib/ikigai-ui/autosave';
import { IkigaiApiError, type IkigaiDraft } from '@/lib/ikigai-api';

function draft(text = 'enseñar'): IkigaiDraft {
  return {
    items: {
      PASION: [{ id: 'p1', text, evidence: 'SOSTENIDO', order: 0 }],
      CAPACIDAD: [],
      NECESIDAD: [],
      VALOR: [],
    },
    patternNote: null,
    hypotheses: [],
    noHypothesisYet: false,
    nextExperiment: null,
    fieldClarity: { PASION: 'ANSWERED', CAPACIDAD: null, NECESIDAD: null, VALOR: null },
    selectedHypothesisId: null,
  };
}

describe('DraftSaver', () => {
  it('keeps text typed while a response is in flight and saves it next', async () => {
    const sent: string[] = [];
    const pending: Array<(value: { draftVersion: number; draft: IkigaiDraft; definitionSha256: string }) => void> = [];
    const send = vi.fn(
      (input: { patch: IkigaiDraft }) =>
        new Promise<{ draftVersion: number; draft: IkigaiDraft; definitionSha256: string }>((resolve) => {
          sent.push(input.patch.items.PASION[0]?.text ?? '');
          pending.push(resolve);
        }),
    );
    const saver = new DraftSaver(draft('a'), 'PASION', 0, 'sha', send);
    saver.note(draft('ab'), 'PASION');
    const flushing = saver.flush();
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    saver.note(draft('abc'), 'PASION');
    pending[0]({ draftVersion: 1, draft: draft('ab'), definitionSha256: 'sha' });
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    pending[1]({ draftVersion: 2, draft: draft('abc'), definitionSha256: 'sha' });
    const result = await flushing;
    expect(result.kind).toBe('saved');
    expect(sent).toEqual(['ab', 'abc']);
  });

  it('does not report success on a version conflict', async () => {
    const send = vi.fn(async () => {
      throw new IkigaiApiError('conflicto', 409, { reason: 'DRAFT_VERSION_CONFLICT', draftVersion: 4 });
    });
    const saver = new DraftSaver(draft(), 'PASION', 0, 'sha', send);
    saver.note(draft('nuevo'), 'PASION');
    const result = await saver.flush();
    expect(result.kind).toBe('conflict');
    if (result.kind === 'conflict') expect(result.serverVersion).toBe(4);
    expect(saver.local.items.PASION[0].text).toBe('nuevo');
  });

  it('does not report success when the request fails', async () => {
    const send = vi.fn(async () => {
      throw new IkigaiApiError('red', 0);
    });
    const saver = new DraftSaver(draft(), 'PASION', 0, 'sha', send);
    saver.note(draft('nuevo'), 'PASION');
    const result = await saver.flush();
    expect(result.kind).toBe('error');
    expect(saver.local.items.PASION[0].text).toBe('nuevo');
  });

  it('does not resend a draft the server rejected', async () => {
    const send = vi.fn(async () => {
      throw new IkigaiApiError('estructura rota', 422, { reason: 'INVALID_DRAFT' });
    });
    const saver = new DraftSaver(draft(), 'PASION', 0, 'sha', send);
    saver.note(draft('roto'), 'PASION');
    const first = await saver.flush();
    const second = await saver.flush();
    expect(first.kind).toBe('invalid');
    expect(second.kind).toBe('invalid');
    expect(send).toHaveBeenCalledTimes(1);
    expect(saver.local.items.PASION[0].text).toBe('roto');
  });
});
