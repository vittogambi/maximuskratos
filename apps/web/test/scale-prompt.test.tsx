/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuestionCard, ShadowResult, buildInitialSelection, isSelectionValid } from '@/components/diagnostico/QuestionCard';
import { ScaleOptions } from '@/components/diagnostico/options/ScaleOptions';
import type { AnswerOptionDto, QuestionDto } from '@/lib/api';
import { moduleIntroIcon } from '@/components/diagnostico/module-intro-icon';
import { SCALE_PROMPTS, WORKBOOK_ENDPOINTS, WORKBOOK_POINT_LABELS } from '@/lib/scale-prompts';

const catalog = JSON.parse(readFileSync(resolve(__dirname, '../../../packages/database/definitions/formulario-completo@6.json'), 'utf8')) as {
  modules: { questions: { sourceRef: string; type: string; textEs: string; options: { order: number; textEs: string }[] }[] }[];
};
const questions = catalog.modules.flatMap((mod) => mod.questions);
const daily = questions.find((question) => question.sourceRef === 'formulario-v1:E-AUD-001!R6');

function bareOptions(): AnswerOptionDto[] {
  return [1, 2, 3, 4, 5].map((order) => ({ id: `o${order}`, order, textEs: String(order), value: String(order) })) as AnswerOptionDto[];
}

afterEach(() => cleanup());

describe('anclas trazadas al reactivo', () => {
  it('conserva el enunciado y los extremos del catálogo, sin cortar en caliente', () => {
    expect(daily).toBeTruthy();
    const prompt = SCALE_PROMPTS['formulario-v1:E-AUD-001!R6'];
    expect(prompt.stem).toBe('¿Mis decisiones diarias reflejan al hombre que digo que quiero llegar a ser?');
    expect(prompt.low).toBe('Casi nunca; la mayoría de mis decisiones contradicen lo que digo querer.');
    expect(prompt.high).toBe('Casi siempre; mis decisiones reflejan claramente al hombre que quiero ser.');
    expect(daily?.textEs.includes(prompt.stem ?? '')).toBe(true);
    expect(daily?.textEs.includes(prompt.low)).toBe(true);
    expect(daily?.textEs.includes(prompt.high)).toBe(true);
    for (const [sourceRef, row] of Object.entries(SCALE_PROMPTS)) {
      const question = questions.find((item) => item.sourceRef === sourceRef);
      expect(question?.textEs.includes(row.stem ?? '')).toBe(true);
      expect(question?.textEs.includes(row.low)).toBe(true);
      expect(question?.textEs.includes(row.high)).toBe(true);
    }
  });

  it('los extremos de E-PER-000 vienen del workbook y no inventan los puntos 2 a 4', () => {
    const originRef = 'formulario-v1:E-PER-000!R10';
    const refs = Object.keys(WORKBOOK_ENDPOINTS).filter((item) => item !== originRef);
    expect(Object.keys(WORKBOOK_ENDPOINTS)).toHaveLength(16);
    expect(WORKBOOK_ENDPOINTS[originRef]).toEqual({ low: 'Nada alineado', high: 'Totalmente alineado' });
    for (const sourceRef of refs) {
      const question = questions.find((item) => item.sourceRef === sourceRef);
      expect(question?.type).toBe('SCALE_1_5');
      expect(question?.options.map((option) => option.textEs)).toEqual(['1', '2', '3', '4', '5']);
      expect(WORKBOOK_ENDPOINTS[sourceRef]).toEqual({ low: 'Totalmente en desacuerdo', high: 'Totalmente de acuerdo' });
    }
  });

  it('muestra el enunciado, los extremos y una sola cifra', async () => {
    const user = userEvent.setup();
    const question = {
      id: 'q1',
      type: 'SCALE_1_5',
      sourceRef: 'formulario-v1:E-AUD-001!R6',
      textEs: daily?.textEs ?? '',
      contextEs: null,
      maxSelections: null,
      scaleType: 'BEHAVIORAL',
      reasonPromptEs: null,
      reasonThreshold: null,
      options: bareOptions(),
      allowedExceptions: ['UNKNOWN', 'DECLINED', 'NOT_APPLICABLE'],
      answerRevision: 1,
    } as QuestionDto;
    render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
    expect(screen.getByRole('heading', { name: SCALE_PROMPTS['formulario-v1:E-AUD-001!R6'].stem })).toBeTruthy();
    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-labelledby')).toBe('dk-question-title');
    expect(group.getAttribute('aria-describedby')).toBe('dk-scale-anchors');
    expect(screen.getByRole('radio', { name: `1. ${SCALE_PROMPTS['formulario-v1:E-AUD-001!R6'].low}` })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '2' }).textContent).toBe('2');
    expect(screen.getByRole('radio', { name: '3' }).textContent).toBe('3');
    expect(screen.queryByRole('radio', { name: '2. 2' })).toBeNull();
    expect(screen.getByText(SCALE_PROMPTS['formulario-v1:E-AUD-001!R6'].high)).toBeTruthy();
    const details = screen.getByText('No puedo responder ahora').closest('details');
    expect(details?.open).toBe(false);
    await user.click(screen.getByText('No puedo responder ahora'));
    expect(screen.getByRole('button', { name: 'No lo sé' })).toBeTruthy();
  });

  it('mantiene visible la excepción elegida', async () => {
    const user = userEvent.setup();
    const question = {
      id: 'q-ex',
      type: 'SCALE_1_5',
      sourceRef: 'formulario-v1:E-AUD-001!R6',
      textEs: 'Pregunta corta.',
      contextEs: null,
      maxSelections: null,
      scaleType: 'BEHAVIORAL',
      reasonPromptEs: null,
      reasonThreshold: null,
      options: bareOptions(),
      allowedExceptions: ['UNKNOWN'],
      answerRevision: 1,
    } as QuestionDto;
    function Harness() {
      const [selection, setSelection] = useState(buildInitialSelection(question));
      return <QuestionCard question={question} selection={selection} onChange={setSelection} />;
    }
    render(<Harness />);
    await user.click(screen.getByText('No puedo responder ahora'));
    await user.click(screen.getByRole('button', { name: 'No lo sé' }));
    expect(screen.getByRole('status').textContent).toContain('No lo sé');
    expect(screen.getByRole('button', { name: 'Responder con un dato' })).toBeTruthy();
  });

  it('una pregunta larga y un texto libre siguen en el mismo flujo', () => {
    const longText = 'Cuando siento presión o una emoción intensa, ¿puedo reconocer lo que siento y elegir una respuesta coherente con mis principios?';
    const scale = {
      id: 'q-long',
      type: 'SCALE_1_5',
      sourceRef: 'formulario-v1:none',
      textEs: longText,
      contextEs: null,
      maxSelections: null,
      scaleType: 'BEHAVIORAL',
      reasonPromptEs: null,
      reasonThreshold: null,
      options: bareOptions(),
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    const { unmount } = render(<QuestionCard question={scale} selection={buildInitialSelection(scale)} onChange={() => undefined} />);
    expect(screen.getByRole('heading', { name: longText })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    unmount();
    const text = {
      id: 'q-text',
      type: 'FREE_TEXT',
      sourceRef: null,
      textEs: 'Escribe lo que observas.',
      contextEs: null,
      maxSelections: null,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: [],
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    render(<QuestionCard question={text} selection={buildInitialSelection(text)} onChange={() => undefined} />);
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('un ítem E-PER muestra sus extremos y deja 2 a 4 solo con la cifra', () => {
    const sourceRef = 'formulario-v1:E-PER-000!R187';
    const question = {
      id: 'q-per',
      type: 'SCALE_1_5',
      sourceRef,
      textEs: questions.find((item) => item.sourceRef === sourceRef)?.textEs ?? '',
      contextEs: null,
      maxSelections: null,
      scaleType: 'BEHAVIORAL',
      reasonPromptEs: null,
      reasonThreshold: null,
      options: bareOptions(),
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
    expect(screen.getByRole('heading', { name: question.textEs })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '1. Totalmente en desacuerdo' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '5. Totalmente de acuerdo' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '2' }).textContent).toBe('2');
    expect(screen.getByRole('radio', { name: '4' }).textContent).toBe('4');
  });

  it('F-RAD-002 con leyenda de frecuencia en el workbook muestra esa escala, no la de acuerdo', () => {
    const sourceRef = 'formulario-v1:F-RAD-002!R6';
    const item = questions.find((question) => question.sourceRef === sourceRef);
    expect(item).toBeTruthy();
    expect(Object.keys(WORKBOOK_POINT_LABELS).sort()).toEqual(
      ['R6', 'R8', 'R17', 'R25', 'R26', 'R27'].map((cell) => `formulario-v1:F-RAD-002!${cell}`).sort(),
    );
    const question = {
      id: 'q-f-rad-002',
      type: 'SCALE_1_5',
      sourceRef,
      textEs: item?.textEs ?? '',
      contextEs: null,
      maxSelections: null,
      scaleType: 'FREQUENCY',
      reasonPromptEs: null,
      reasonThreshold: null,
      options: (item?.options ?? []).map((option) => ({
        id: `a${option.order}`,
        order: option.order,
        textEs: option.textEs,
        value: String(option.order),
      })),
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
    expect(screen.getByRole('heading', { name: question.textEs })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '1. Nunca ocurre' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '3. Ocurre a veces' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '5. Ocurre siempre' })).toBeTruthy();
    expect(screen.queryByText('Totalmente de acuerdo')).toBeNull();
  });

  it('un punto con texto propio se muestra en filas con todas sus etiquetas', () => {
    const question = {
      id: 'q-freq',
      type: 'SCALE_1_5',
      sourceRef: 'formulario-v1:F-RAD-003!R7',
      textEs: 'Los ingresos estables que genero actualmente cubren con holgura todos mis costos.',
      contextEs: null,
      maxSelections: null,
      scaleType: 'FREQUENCY',
      reasonPromptEs: null,
      reasonThreshold: null,
      options: ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'].map((textEs, index) => ({
        id: `f${index + 1}`,
        order: index + 1,
        textEs,
        value: String(index + 1),
      })),
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
    expect(screen.getByRole('radio', { name: '2. Rara vez' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '4. Frecuentemente' })).toBeTruthy();
    expect(screen.getByText('A veces')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: '3' })).toBeNull();
  });

  it('el grupo de escala tiene una sola parada de tabulación y las flechas mueven la selección', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ScaleOptions options={bareOptions()} selected="o3" onSelect={onSelect} prompt={SCALE_PROMPTS['formulario-v1:E-AUD-001!R6']} />);
    const three = screen.getByRole('radio', { name: '3' });
    expect(three.getAttribute('aria-checked')).toBe('true');
    expect(three.getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('radio', { name: '2' }).getAttribute('tabindex')).toBe('-1');
    three.focus();
    await user.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenLastCalledWith('o4');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: '4' }));
  });

  it('control de deuda, ahorro, planificación e ingresos muestran la definición del comentario', () => {
    const cells = ['R37', 'R38', 'R39', 'R40'] as const;
    for (const cell of cells) {
      const sourceRef = `formulario-v1:E-AUD-001!${cell}`;
      const item = questions.find((question) => question.sourceRef === sourceRef);
      expect(item?.type).toBe('SCALE_1_5');
      const question = {
        id: `q-${cell}`,
        type: 'SCALE_1_5',
        sourceRef,
        textEs: item?.textEs ?? '',
        contextEs: null,
        maxSelections: null,
        scaleType: 'BEHAVIORAL',
        reasonPromptEs: null,
        reasonThreshold: null,
        options: (item?.options ?? []).map((option) => ({
          id: `${cell}-${option.order}`,
          order: option.order,
          textEs: option.textEs,
          value: String(option.order),
        })),
        allowedExceptions: [],
        answerRevision: 0,
      } as QuestionDto;
      const view = render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
      expect(screen.getAllByRole('radio')).toHaveLength(5);
      view.unmount();
    }

    const debt = questions.find((question) => question.sourceRef === 'formulario-v1:E-AUD-001!R37');
    const question = {
      id: 'q-debt',
      type: 'SCALE_1_5',
      sourceRef: 'formulario-v1:E-AUD-001!R37',
      textEs: debt?.textEs ?? '',
      contextEs: null,
      maxSelections: null,
      scaleType: 'BEHAVIORAL',
      reasonPromptEs: null,
      reasonThreshold: null,
      options: (debt?.options ?? []).map((option) => ({
        id: `d${option.order}`,
        order: option.order,
        textEs: option.textEs,
        value: String(option.order),
      })),
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
    expect(screen.getByRole('radio', { name: /1\. Sobreendeudado \/ Asfixiado\. No puedo cubrir regularmente/ })).toBeTruthy();
    expect(screen.getByText('Deuda controlada')).toBeTruthy();
    expect(screen.queryByText('Más de 50% o incumplimientos')).toBeNull();
    expect(question.options.map((option) => option.value)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('la fecha de nacimiento no muestra la edad y exige una respuesta', () => {
    const question = {
      id: 'q-age',
      type: 'FREE_TEXT',
      sourceRef: 'formulario-v1:F-RAD-001!R6',
      textEs: 'Edad',
      contextEs: null,
      maxSelections: null,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: [],
      capture: { kind: 'birthdate', minAge: 1, maxAge: 120 },
      allowedExceptions: ['UNKNOWN', 'DECLINED'],
      answerRevision: 0,
    } as QuestionDto;
    function Harness() {
      const [selection, setSelection] = useState(buildInitialSelection(question));
      return <QuestionCard question={question} selection={selection} onChange={setSelection} />;
    }
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Fecha de nacimiento' })).toBeTruthy();
    const field = screen.getByLabelText('Fecha de nacimiento') as HTMLInputElement;
    expect(field.type).toBe('date');
    expect(screen.getByText('Indica tu fecha de nacimiento para continuar.')).toBeTruthy();
    expect(screen.queryByText('No puedo responder ahora')).toBeNull();
    expect(isSelectionValid(question, { type: 'text', value: '' })).toBe(false);
    expect(isSelectionValid(question, { type: 'exception', kind: 'UNKNOWN' })).toBe(false);
    fireEvent.change(field, { target: { value: '1990-06-15' } });
    expect(field.value).toBe('1990-06-15');
    expect(screen.queryByText(/\d+ años/)).toBeNull();
    expect(screen.queryByText('Indica tu fecha de nacimiento para continuar.')).toBeNull();
  });

  it('la altura se elige en centímetros', () => {
    const question = {
      id: 'q-height',
      type: 'FREE_TEXT',
      sourceRef: 'formulario-v1:F-RAD-001!R8',
      textEs: 'Altura',
      contextEs: null,
      maxSelections: null,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: [],
      capture: { kind: 'number', unit: 'cm', min: 120, max: 230 },
      allowedExceptions: ['UNKNOWN', 'DECLINED'],
      answerRevision: 0,
    } as QuestionDto;
    function Harness() {
      const [selection, setSelection] = useState(buildInitialSelection(question));
      return <QuestionCard question={question} selection={selection} onChange={setSelection} />;
    }
    render(<Harness />);
    const picker = screen.getByRole('combobox', { name: 'Altura en cm' }) as HTMLSelectElement;
    expect(picker.value).toBe('');
    expect(screen.queryByRole('option', { name: '149 cm' })).toBeNull();
    expect(screen.getByRole('option', { name: '150 cm' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '210 cm' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: '211 cm' })).toBeNull();
    expect(screen.getByText('Elige la altura en cm para continuar.')).toBeTruthy();
    expect(screen.queryByText('No puedo responder ahora')).toBeNull();
    fireEvent.change(picker, { target: { value: '178' } });
    expect(picker.value).toBe('178');
    expect(screen.queryByText('Elige la altura en cm para continuar.')).toBeNull();
    expect(isSelectionValid(question, { type: 'text', value: '178' })).toBe(true);
    expect(isSelectionValid(question, { type: 'text', value: '' })).toBe(false);
    expect(isSelectionValid(question, { type: 'exception', kind: 'UNKNOWN' })).toBe(false);
  });

  it('el peso se elige en kilogramos y se puede saltar', () => {
    const question = {
      id: 'q-weight',
      type: 'FREE_TEXT',
      sourceRef: 'formulario-v1:F-RAD-001!R9',
      textEs: 'Peso actual',
      contextEs: null,
      maxSelections: null,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: [],
      capture: { kind: 'number', unit: 'kg', min: 35, max: 250 },
      allowedExceptions: ['UNKNOWN', 'DECLINED'],
      answerRevision: 0,
    } as QuestionDto;
    function Harness() {
      const [selection, setSelection] = useState(buildInitialSelection(question));
      return <QuestionCard question={question} selection={selection} onChange={setSelection} />;
    }
    render(<Harness />);
    const picker = screen.getByRole('combobox', { name: 'Peso en kg' }) as HTMLSelectElement;
    expect(picker.value).toBe('');
    expect(screen.queryByRole('option', { name: '44 kg' })).toBeNull();
    expect(screen.getByRole('option', { name: '45 kg' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '150 kg' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: '151 kg' })).toBeNull();
    expect(screen.getByText('Elige el peso en kg para continuar.')).toBeTruthy();
    expect(screen.getByText('No puedo responder ahora')).toBeTruthy();
    fireEvent.change(picker, { target: { value: '82' } });
    expect(picker.value).toBe('82');
    expect(isSelectionValid(question, { type: 'text', value: '82' })).toBe(true);
    expect(isSelectionValid(question, { type: 'exception', kind: 'DECLINED' })).toBe(true);
  });

  it('la grasa corporal se elige en un rango y se puede saltar', () => {
    const question = {
      id: 'q-fat',
      type: 'FREE_TEXT',
      sourceRef: 'formulario-v1:F-RAD-001!R10',
      textEs: 'Grasa corporal, si la conoces',
      contextEs: null,
      maxSelections: null,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: [],
      capture: { kind: 'number', unit: '%', min: 0, max: 100 },
      allowedExceptions: ['UNKNOWN', 'DECLINED'],
      answerRevision: 0,
    } as QuestionDto;
    function Harness() {
      const [selection, setSelection] = useState(buildInitialSelection(question));
      return <QuestionCard question={question} selection={selection} onChange={setSelection} />;
    }
    render(<Harness />);
    const picker = screen.getByRole('combobox', { name: 'Grasa corporal en porcentaje' }) as HTMLSelectElement;
    expect(screen.queryByRole('option', { name: '4 %' })).toBeNull();
    expect(screen.getByRole('option', { name: '5 %' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '50 %' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: '51 %' })).toBeNull();
    expect(screen.getByText('No puedo responder ahora')).toBeTruthy();
    expect(isSelectionValid(question, { type: 'exception', kind: 'UNKNOWN' })).toBe(true);
    expect(isSelectionValid(question, { type: 'text', value: '' })).toBe(false);
    fireEvent.change(picker, { target: { value: '18' } });
    expect(picker.value).toBe('18');
  });

  it('la cintura, el dolor, las comidas, los minutos y el sueño usan selector', () => {
    const cases = [
      { sourceRef: 'formulario-v1:F-RAD-001!R11', textEs: 'Circunferencia de cintura, si quieres registrarla', capture: { kind: 'number', unit: 'cm', min: 40, max: 200 }, name: 'Cintura en cm', present: '80 cm', absent: '40 cm' },
      { sourceRef: 'formulario-v1:F-RAD-001!R26', textEs: 'Si hay dolor, indica el nivel', capture: { kind: 'number', unit: 'nivel', min: 0, max: 10 }, name: 'Nivel de dolor', present: '0', absent: '11' },
      { sourceRef: 'formulario-v1:F-RAD-001!R35', textEs: 'Número aproximado de comidas al día:', capture: { kind: 'number', unit: 'comidas', min: 1, max: 10 }, name: 'Comidas al día', present: '3', absent: '9' },
      { sourceRef: 'formulario-v1:F-RAD-001!R53', textEs: 'Tiempo promedio por sesión', capture: { kind: 'number', unit: 'minutos', min: 10, max: 240 }, name: 'Minutos por sesión', present: '45 min', absent: '10 min' },
      { sourceRef: 'formulario-v1:F-RAD-001!R61', textEs: 'Horas promedio de sueño por noche:', capture: { kind: 'hours', min: 0, max: 14 }, name: 'Horas de sueño', present: '7 horas', absent: '3 horas' },
    ] as const;
    for (const item of cases) {
      const question = {
        id: item.sourceRef,
        type: 'FREE_TEXT',
        sourceRef: item.sourceRef,
        textEs: item.textEs,
        contextEs: null,
        maxSelections: null,
        scaleType: null,
        reasonPromptEs: null,
        reasonThreshold: null,
        options: [],
        capture: item.capture,
        allowedExceptions: ['UNKNOWN', 'DECLINED'],
        answerRevision: 0,
      } as QuestionDto;
      const view = render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
      expect(screen.getByRole('combobox', { name: item.name })).toBeTruthy();
      expect(screen.getByRole('option', { name: item.present })).toBeTruthy();
      expect(screen.queryByRole('option', { name: item.absent })).toBeNull();
      expect(screen.getByText('No puedo responder ahora')).toBeTruthy();
      view.unmount();
    }
  });

  it('sexo no se puede saltar y muestra hombre y mujer', () => {
    const question = {
      id: 'q-sex',
      type: 'SINGLE_CHOICE',
      sourceRef: 'formulario-v1:F-RAD-001!R7',
      textEs: 'Sexo',
      contextEs: null,
      maxSelections: null,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: [
        { id: 'h', order: 1, textEs: 'Hombre', value: 'Hombre' },
        { id: 'm', order: 2, textEs: 'Mujer', value: 'Mujer' },
      ],
      allowedExceptions: ['DECLINED'],
      answerRevision: 0,
    } as QuestionDto;
    render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
    expect(screen.getByRole('option', { name: 'Hombre' }).querySelector('.dk-choice-figure')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Mujer' }).querySelector('.dk-choice-figure')).toBeTruthy();
    expect(screen.queryByText('No puedo responder ahora')).toBeNull();
    expect(screen.queryByText('Prefiero no responder')).toBeNull();
    expect(isSelectionValid(question, { type: 'single', selected: null })).toBe(false);
    expect(isSelectionValid(question, { type: 'exception', kind: 'DECLINED' })).toBe(false);
    expect(isSelectionValid(question, { type: 'single', selected: 'h' })).toBe(true);
  });

  it('los valores piden al menos 4 y los esenciales solo 3 de esos', () => {
    const pool = {
      id: 'pool',
      type: 'MULTI_CHOICE',
      sourceRef: 'formulario-v1:E-PER-000!R40',
      textEs: 'Elija los valores',
      contextEs: null,
      maxSelections: 10,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: ['a', 'b', 'c', 'd', 'e'].map((id, index) => ({ id, order: index + 1, textEs: id, value: id })),
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    expect(isSelectionValid(pool, { type: 'multi', selected: ['a', 'b', 'c'] })).toBe(false);
    expect(isSelectionValid(pool, { type: 'multi', selected: ['a', 'b', 'c', 'd'] })).toBe(true);
    const core = {
      ...pool,
      id: 'core',
      sourceRef: 'formulario-v1:E-PER-000!R51',
      maxSelections: 3,
      options: pool.options.slice(0, 4),
    };
    expect(isSelectionValid(core, { type: 'multi', selected: ['a', 'b'] })).toBe(false);
    expect(isSelectionValid(core, { type: 'multi', selected: ['a', 'b', 'c'] })).toBe(true);
  });

  it('la pregunta de sombra no muestra el resultado', () => {
    const question = {
      id: 'q-shadow',
      type: 'SINGLE_CHOICE',
      sourceRef: 'formulario-v1:E-PER-000!R94',
      textEs: 'PR1. Atraigo constantemente socios.',
      contextEs: null,
      heading: 'A. Patrones repetitivos (la Sombra en acción). Ámbito: Relaciones interpersonales',
      maxSelections: null,
      scaleType: null,
      reasonPromptEs: null,
      reasonThreshold: null,
      options: [
        { id: 'si', order: 1, textEs: 'Sí', value: '2' },
        { id: 'mm', order: 2, textEs: 'Más o menos', value: '1' },
        { id: 'no', order: 3, textEs: 'No', value: '0' },
      ],
      allowedExceptions: [],
      answerRevision: 0,
    } as QuestionDto;
    const lines = [
      { label: 'A. Patrones repetitivos: «Miedo al éxito y la exposición»', detail: 'Ausente: comportamiento libre de bloqueos históricos.' },
      { label: 'Relaciones interpersonales', detail: 'Ausente: vínculos saludables.' },
      { label: 'Rendimiento laboral', detail: 'sin desarrollo' },
      { label: 'Gestión financiera', detail: 'sin desarrollo' },
    ];
    const view = render(<QuestionCard question={question} selection={buildInitialSelection(question)} onChange={() => undefined} />);
    expect(screen.queryByText('Resultado')).toBeNull();
    expect(screen.queryByText('Ausente')).toBeNull();
    view.unmount();
    render(<ShadowResult lines={[...lines, { label: 'Diagnóstico sombra', detail: 'Perfil libre y enfocado. Operas desde la transparencia y el liderazgo propio.' }]} showNotes />);
    expect(screen.getByText('Miedo al éxito y la exposición')).toBeTruthy();
    expect(screen.getByText('Comportamiento libre de bloqueos históricos.')).toBeTruthy();
    expect(screen.getByText('Vínculos saludables.')).toBeTruthy();
    expect(screen.getAllByText('Sin desarrollo')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Perfil libre y enfocado' })).toBeTruthy();
    expect(screen.getByText('Operas desde la transparencia y el liderazgo propio.')).toBeTruthy();
  });

  it('cada introducción de sección tiene su icono', () => {
    expect(moduleIntroIcon('e-aud-s1', 'columns')).toBe('brain');
    expect(moduleIntroIcon('f-rad-002-s1', 'columns')).toBe('heart');
    expect(moduleIntroIcon('e-per-vision', 'columns')).toBe('helm');
    expect(moduleIntroIcon('e-per-valores', 'columns')).toBe('columns');
    expect(moduleIntroIcon('e-per-estandares', 'columns')).toBe('laurel-wreath');
    expect(moduleIntroIcon('e-per-identidad', 'columns')).toBe('rubik');
    expect(moduleIntroIcon('e-per-ikigai', 'columns')).toBe('ikigai');
    expect(moduleIntroIcon('desconocido', 'columns')).toBe('columns');
    expect(moduleIntroIcon(null, null)).toBeNull();
  });
});
