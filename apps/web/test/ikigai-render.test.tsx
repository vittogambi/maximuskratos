import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/ikigai/empezar',
  useSearchParams: () => new URLSearchParams(),
}));
import { FieldStep } from '@/components/ikigai/field-step';
import { IkigaiHypothesisBuilder } from '@/components/ikigai/hypothesis-step';
import { IkigaiIdeaLibrary } from '@/components/ikigai/idea-library';
import { ResultView } from '@/components/ikigai/result-view';
import { IkigaiShell } from '@/components/ikigai/shell';
import { StartView } from '@/components/ikigai/start-view';
import type { IkigaiDefinition, IkigaiDraft, IkigaiResult } from '@/lib/ikigai-api';
import { emptyUiDraft, selectableByField } from '@/lib/ikigai-ui/format';

const definition: IkigaiDefinition = {
  definitionId: 'ikigai-v0.1',
  revision: 1,
  ref: 'ikigai-v0.1@1',
  status: 'DRAFT',
  publicName: 'IKIGAI · Tu mapa de dirección',
  examplesDisclaimer: 'Los ejemplos solo muestran el tipo de respuesta. No necesitas elegir ninguno.',
  hypothesis: {
    label: '¿Qué dirección aparece al unir estas piezas?',
    help: 'Puedes pensar en qué quieres hacer o aportar',
    examples: ['Ayudar a equipos pequeños a ordenar su forma de trabajar.'],
    noHypothesisLabel: 'Todavía no veo una dirección clara',
  },
  likertAnchors: [
    { value: 1, label: 'Nada de acuerdo' },
    { value: 2, label: 'Poco de acuerdo' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'De acuerdo' },
    { value: 5, label: 'Muy de acuerdo' },
  ],
  skipCriterionLabel: 'Prefiero no responder',
  fields: [
    {
      key: 'PASION',
      title: 'Lo que te mueve',
      prompt: '¿Qué actividades te hacen sentir interesado, energizado o con ganas de seguir mejorando?',
      help: 'Ayuda de campo',
      examples: ['Enseñar'],
      placeholder: 'Por ejemplo: explicar',
      evidencePrompt: '¿Qué experiencia tienes con esto?',
      evidenceOptions: [{ key: 'SOSTENIDO', label: 'Lo hago de forma sostenida' }],
    },
  ],
  criteria: [
    {
      key: 'DISFRUTE_SOSTENIBLE',
      label: 'Disfrute sostenible',
      text: 'Esta hipótesis utiliza actividades que podría sostener durante años.',
      matrixId: 'P-PRO-071',
    },
  ],
  nextExperiment: {
    focusLabel: '¿Qué necesitarías descubrir para saber si esta dirección merece seguir creciendo?',
    horizonLabel: 'Durante:',
    horizons: [30, 60, 90],
    actionLabel: 'Voy a:',
    signalLabel: 'Sabré algo nuevo si:',
  },
};

const result: IkigaiResult = {
  definitionRef: 'ikigai-v0.1@1',
  engineVersion: '0.1.0',
  generatedAt: '2026-01-01T00:00:00.000Z',
  selectedHypothesisId: null,
  fieldClarity: {
    PASION: 'ANSWERED',
    CAPACIDAD: null,
    NECESIDAD: null,
    VALOR: null,
  },
  material: {
    fields: [
      {
        key: 'PASION',
        title: 'Lo que te mueve',
        items: [
          {
            id: 'p1',
            text: 'enseñar',
            evidence: 'SOSTENIDO',
            evidenceLabel: 'Lo hago de forma sostenida',
            classification: 'backed',
          },
        ],
        thin: true,
        untagged: false,
      },
    ],
  },
  convergences: { byHypothesis: [], recurring: [], unused: [], patternNote: null },
  tensions: [],
  hypotheses: [],
  evidence: { byHypothesis: [] },
  openQuestions: [],
  nextExperiment: null,
};

function text(markup: string) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('ikigai player copy', () => {
  it('renders start screen', () => {
    const html = renderToStaticMarkup(<StartView />);
    const body = text(html);
    expect(body).toContain('Construye una hipótesis de dirección.');
    expect(body).toContain('Empezar');
    expect(body).toContain('Salir');
    expect(body).toContain('MK');
    expect(body).toContain('Versión en revisión');
    expect(body).not.toContain('Antes de empezar');
    expect(body).not.toMatch(/purpose_score|este es tu propósito|Mi propósito es/i);
    expect(html).not.toMatch(/[—–]/);
  });

  it('renders a field as a list, not Elemento 1', () => {
    const html = renderToStaticMarkup(
      <FieldStep
        definition={definition}
        fieldKey="PASION"
        items={[]}
        clarity={null}
        onChange={() => undefined}
        onClarity={() => undefined}
      />,
    );
    const body = text(html);
    expect(body).toContain('¿Qué actividades te hacen sentir interesado, energizado o con ganas de seguir mejorando?');
    expect(body).toContain('Ayuda de campo');
    expect(body).toContain('Explorar ideas');
    expect(body).toContain('Añadir');
    expect(body).toContain('Todavía no tengo claro qué poner aquí');
    expect(body).not.toContain('Elemento 1');
    expect(body).not.toContain('Añade al menos 2');
    expect(html).not.toContain('textarea');
    expect(body).not.toMatch(/%|purpose_score|Vocación|Profesión/);
  });

  it('opens the idea library as exploration, not as a test', () => {
    const html = renderToStaticMarkup(
      <IkigaiIdeaLibrary
        open
        fieldKey="PASION"
        onClose={() => undefined}
        onAdopt={() => undefined}
      />,
    );
    const body = text(html);
    expect(body).toContain('Explorar ideas');
    expect(body).toContain('Cerrar');
    expect(body).toContain('Creación y expresión');
    expect(body).toContain('Enseñar');
    expect(body).toContain('Todas');
    expect(body).not.toMatch(/Vocación|Profesión|Project Management|purpose_score|%\b/);
  });

  it('never treats empty items or prompts as selectable chips', () => {
    const draft: IkigaiDraft = {
      ...emptyUiDraft(),
      items: {
        PASION: [
          { id: 'a', text: 'explicar cosas difíciles', evidence: null, order: 0 },
          { id: 'empty', text: '  ', evidence: null, order: 1 },
        ],
        CAPACIDAD: [
          {
            id: 'prompt',
            text: '',
            evidence: null,
            order: 0,
          },
        ],
        NECESIDAD: [],
        VALOR: [],
      },
    };
    const selectable = selectableByField(draft);
    expect(selectable.PASION.map((i) => i.text)).toEqual(['explicar cosas difíciles']);
    expect(selectable.CAPACIDAD).toEqual([]);
    const html = renderToStaticMarkup(
      <IkigaiHypothesisBuilder
        definition={definition}
        draft={draft}
        onChange={() => undefined}
        onContrast={() => undefined}
        onNoHypothesis={() => undefined}
      />,
    );
    expect(html).toContain('explicar cosas difíciles');
    expect(html).toContain('¿Qué piezas parecen pertenecer a una misma dirección?');
    expect(html).toContain('Toca las piezas que, para ti, parecen formar parte de una misma dirección.');
    expect(html).not.toContain('¿Qué actividades disfrutas');
    expect(html).not.toContain('Lo que te mueve: no');
    expect(html).not.toContain('Ayuda de campo');
    expect(html).not.toContain('3 de 4');
  });

  it('renders empty-hypothesis result without scores', () => {
    const html = renderToStaticMarkup(
      <ResultView
        result={result}
        revision={1}
        definition={definition}
        onReopen={() => undefined}
        onSaveExperiment={async () => undefined}
      />,
    );
    const body = text(html);
    expect(body).toContain('Todavía no aparece una dirección suficientemente clara.');
    expect(body).toContain('Volver a explorar');
    expect(body).not.toMatch(/purpose_score|%\b|nivel|badge|confetti/i);
    expect(body).not.toContain('poco material');
    expect(body).not.toContain('comprobado');
  });

  it('shows review label and tensions when they exist', () => {
    const html = renderToStaticMarkup(
      <IkigaiShell onExit={() => undefined}>
        <ResultView
          result={{
            ...result,
            tensions: [
              {
                ruleId: 'T_NO_HYPOTHESIS',
                text: 'Todavía no aparece una hipótesis suficientemente clara. Eso es un resultado válido.',
              },
            ],
          }}
          revision={1}
          definition={definition}
          onReopen={() => undefined}
          onSaveExperiment={async () => undefined}
        />
      </IkigaiShell>,
    );
    const body = text(html);
    expect(body).toContain('Versión en revisión');
    expect(body).toContain('Qué aparece al mirar el conjunto');
    expect(body).toContain('Todavía no aparece una hipótesis suficientemente clara. Eso es un resultado válido.');
    expect(body).not.toContain('Gate 0');
    expect(body).not.toContain('ikigai-v0.1@1');
    expect(html).not.toMatch(/Mi propósito es/);
  });
});
