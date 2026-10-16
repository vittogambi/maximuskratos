/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HelpDraftView } from '@/components/journey/HelpDraftView';

afterEach(() => cleanup());

describe('ayuda propuesta', () => {
  it('muestra la evidencia y lo que no incluye, sin un horario inventado', () => {
    render(<HelpDraftView help={{
      evidence: ['La planificación que declaraste es débil.'],
      action: 'Proteger las ocasiones declaradas y empezar por una parte revisable.',
      occasion: '2 ocasiones, 90 minutos en total. El día lo eliges tú.',
      criterion: 'La ocasión ocurrió y quedó algo que se puede revisar.',
      forbids: ['Un horario que no declaraste'],
    }} />);
    expect(screen.getByRole('region', { name: 'Ayuda propuesta' })).toBeTruthy();
    expect(screen.getByText(/planificación que declaraste/)).toBeTruthy();
    expect(screen.getByText(/El día lo eliges tú/)).toBeTruthy();
    expect(screen.getByText(/No incluye: Un horario que no declaraste/)).toBeTruthy();
    expect(screen.queryByText(/\d{1,2}:\d{2}/)).toBeNull();
  });

  it('la pausa no muestra una acción obligatoria', () => {
    render(<HelpDraftView help={{ evidence: ['Puedes pausar.'], action: null, occasion: null, criterion: 'No aparece una tarea nueva.', forbids: [] }} />);
    expect(screen.getByText('Sin acción obligatoria.')).toBeTruthy();
  });
});
