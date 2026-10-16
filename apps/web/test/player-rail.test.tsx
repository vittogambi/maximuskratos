/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PlayerStage } from '@/components/diagnostico/PlayerStage';
import { presentProgress, ProgressRail, questionnaireStageLabel } from '@/components/diagnostico/ProgressRail';

afterEach(() => cleanup());

describe('progreso total', () => {
  it.each([
    [0, 0, 'Progreso total: 0 %', '0 %'],
    [0.42, 0.42, 'Progreso total: 0,4 %', '0,4 %'],
    [0.04, 0.04, 'Progreso total: 0,1 %', '0,1 %'],
    [37.26, 37.26, 'Progreso total: 37,3 %', '37,3 %'],
    [99.96, 99.96, 'Progreso total: 99,9 %', '99,9 %'],
    [100, 100, 'Progreso total: 100 %', '100 %'],
    [Number.NaN, 0, 'Progreso total: 0 %', '0 %'],
    [-4, 0, 'Progreso total: 0 %', '0 %'],
  ])('formatea %s', (pct, width, text, amount) => {
    expect(presentProgress(pct)).toEqual({ width, text, amount });
  });

  it('deja la salida fuera del indicador y muestra la pregunta local aparte', () => {
    render(
      <ProgressRail
        pct={0.42}
        questionIndex={2}
        questionTotal={5}
        moduleTitle="Mentalidad e identidad"
        contextLabel="Auditoría inicial"
        exitLabel="Guardar y salir"
        onExit={() => undefined}
      />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Progreso total: 0,4 %');
    expect(bar.getAttribute('aria-valuenow')).toBe('0.42');
    expect(bar.contains(screen.getByRole('button', { name: 'Guardar y salir' }))).toBe(false);
    expect(screen.getByText('Progreso total')).toBeTruthy();
    expect(screen.getByText('0,4 %')).toBeTruthy();
    expect(screen.queryByText('Pregunta 2 de 5')).toBeNull();
  });

  it('no llama auditoría a una radiografía ni al perfil', () => {
    expect(questionnaireStageLabel('e-aud-s3')).toBe('Auditoría inicial');
    expect(questionnaireStageLabel('f-rad-002-s1')).toBe('Radiografía');
    expect(questionnaireStageLabel('e-per-ikigai')).toBe('Perfil');
    expect(questionnaireStageLabel(null)).toBe('Cuestionario inicial');
  });
});

describe('barra de navegación', () => {
  it('deja Continuar a todo el ancho y pone Anterior en la cabecera', () => {
    render(
      <PlayerStage header={null} primary={{ label: 'Continuar', onClick: () => undefined }} note="Tu respuesta se guarda al continuar.">
        <p>Pregunta</p>
      </PlayerStage>,
    );
    const primary = screen.getByRole('button', { name: 'Continuar' });
    expect(primary.className).toContain('ag-btn-cta');
    expect(primary.parentElement?.className).toContain('dk-stage__nav');
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull();
    expect(screen.getByText('Tu respuesta se guarda al continuar.')).toBeTruthy();
    cleanup();
    render(
      <ProgressRail
        pct={0}
        contextLabel="Auditoría inicial"
        back={{ onClick: () => undefined }}
        exitLabel="Guardar y salir"
        onExit={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar y salir' }).textContent).toContain('Salir');
  });
});
