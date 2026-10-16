/** @vitest-environment jsdom */
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuestionCard, buildInitialSelection } from '@/components/diagnostico/QuestionCard';
import { IkigaiCross } from '@/components/journey/IkigaiCross';
import type { QuestionDto } from '@/lib/api';
import type { SynthesisPayload } from '@/lib/journey-api';

const question = {
  id: 'q',
  type: 'FREE_TEXT',
  textEs: 'Actividad de profesión',
  contextEs: null,
  maxSelections: null,
  scaleType: null,
  reasonPromptEs: null,
  reasonThreshold: null,
  options: [],
  allowedExceptions: ['UNKNOWN'],
  capture: {
    kind: 'activity',
    field: 'profesion',
    ambits: [
      { label: 'Consultoría y Asesoría Técnica', options: ['Diagnóstico de problemas'] },
      { label: 'Ejecución y Operaciones', options: ['Coordinar un equipo'] },
    ],
  },
} as QuestionDto;

function Player() {
  const [selection, setSelection] = useState(buildInitialSelection(question));
  return <QuestionCard question={question} selection={selection} onChange={setSelection} />;
}

const synthesis = {
  version: 'cruce-cualitativo@1',
  activities: [
    { sourceRef: 'R220', field: 'pasion', ambit: 'Creación y Expresión', option: 'Escribir', answer: 'Escribir ensayos' },
    { sourceRef: 'R241', field: 'profesion', ambit: 'Consultoría y Asesoría Técnica', option: 'Diagnóstico', answer: 'Diagnosticar un proceso' },
  ],
  links: [],
  combinations: [],
  purpose: { status: 'UNWORKED', parts: {}, generated: '', edited: null, open: [] },
  catalog: {
    pasion: { sourceName: 'Pasión', question: 'Lo que te gusta', ambits: [] },
    profesion: { sourceName: 'Profesión', question: 'Por lo que podrían pagarte', ambits: [] },
  },
  values: [],
  standards: [],
  purposeRevisionId: null,
  revision: null,
} as SynthesisPayload;

describe('player and cross without a browser', () => {
  it('keeps the personal text when the ambit changes and asks for another option', async () => {
    const user = userEvent.setup();
    render(<Player />);
    await user.type(screen.getByLabelText('La actividad es'), 'Diagnosticar un proceso');
    await user.click(screen.getByRole('option', { name: 'Consultoría y Asesoría Técnica' }));
    await user.click(screen.getByRole('option', { name: 'Diagnóstico de problemas' }));
    await user.click(screen.getByRole('option', { name: 'Ejecución y Operaciones' }));
    expect((screen.getByLabelText('La actividad es') as HTMLTextAreaElement).value).toBe('Diagnosticar un proceso');
    expect(screen.queryByRole('option', { name: 'Diagnóstico de problemas', selected: true })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Revisa el desarrollo de idea');
    expect(screen.queryByText('Medir la integridad')).toBeNull();
  });

  it('creates a combination from the keyboard and keeps a free edit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<IkigaiCross data={synthesis} saving={false} onSave={onSave} />);
    const origin = screen.getByRole('button', { name: /Escribir ensayos/ });
    origin.focus();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: /Diagnosticar un proceso/ }));
    expect(screen.getByRole('heading', { name: /Combinación 1/ })).toBeTruthy();
    await user.type(screen.getByLabelText(/Edición libre/), 'Mi frase');
    await user.click(screen.getByRole('button', { name: 'Guardar cruce' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      purpose: expect.objectContaining({ edited: 'Mi frase' }),
    }));
    const saved = onSave.mock.calls[0][0] as SynthesisPayload;
    expect(saved.links).toHaveLength(1);
    expect(saved.links[0]?.fromRef).not.toBe(saved.links[0]?.toRef);
  });
});
