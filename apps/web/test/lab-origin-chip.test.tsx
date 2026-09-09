import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OriginChip } from '@/components/admin/lab/origin-chip';
import { ExcelDecisionList, FidelityStep, excelRecapPhrase } from '@/components/admin/lab/fidelity-step';
import { ProvenanceCard } from '@/components/admin/lab/provenance-card';
import type { LabProvenanceItem } from '@/lib/lab-api';

function text(node: Parameters<typeof renderToStaticMarkup>[0]) {
  return renderToStaticMarkup(node).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

const item: LabProvenanceItem = {
  id: 'FID-BROOKS',
  subject_kind: 'transformation',
    origin_type: 'V2_UNDOCUMENTED_RESULT',
    change_kind: 'INTENTION_LOSS_RISK',
    title: 'Desarrollo y sentido',
    source_refs: [{ file: 'Excel original', sheet: 'E-AUD-001', id: 'Q24 a Q33', version: null }],
    previous_state: 'Incluía disfrute y sentido.',
    current_state: 'Estas preguntas no están en Matrix v2.',
    change_summary: 'v2 las sacó del diagnóstico.',
    rationale: 'Evitar mezclar estado con dirección.',
    why_pending: 'Hay que decidir dónde debería vivir esta intención.',
    documented_facts: ['Sabemos que no forman parte de Matrix v2.'],
    undocumented: ['No hay una decisión explícita de Matrix v2.'],
    decision_question: '¿Dónde debería vivir esta intención?',
    composition: null,
    card_kind: 'removed_content',
    decision_by: 'UNDOCUMENTED',
  decision_status: 'PENDING_RAFA',
  in_rafa_queue: true,
  blocks_matrix: false,
  affects_now: 'No cambia el cálculo.',
  affects_later: 'Dirección.',
  verdict_set: 'fidelity',
  rafa_verdict: null,
  rafa_note: null,
};

describe('origin chips', () => {
  it('renders three visually distinct origin classes', () => {
    const html = [
      renderToStaticMarkup(<OriginChip origin="EXCEL_SOURCE" />),
      renderToStaticMarkup(<OriginChip origin="MATRIX_V2" />),
      renderToStaticMarkup(<OriginChip origin="POST_V2_REFINEMENT" />),
    ].join(' ');
    expect(html).toContain('lab-ochip--excel');
    expect(html).toContain('lab-ochip--v2');
    expect(html).toContain('lab-ochip--post');
    expect(text(<OriginChip origin="EXCEL_SOURCE" />)).toContain('Excel original');
    expect(text(<OriginChip origin="MATRIX_V2" />)).toContain('Matriz v2');
    expect(text(<OriginChip origin="POST_V2_REFINEMENT" />)).toContain('Refinamiento posterior');
    expect(text(<OriginChip origin="V2_UNDOCUMENTED_RESULT" />)).toContain('no documentado');
  });
});

describe('fidelity card', () => {
  it('asks a human question and shows the four exits', () => {
    const body = text(<ProvenanceCard item={item} defaultOpen onSave={async () => undefined} />);
    expect(body).toContain('¿Dónde debería vivir esta intención?');
    expect(body).toContain('Queda fuera');
    expect(body).toContain('Matriz');
    expect(body).toContain('Dirección');
    expect(body).toContain('Más adelante');
    expect(body).not.toContain('Documentado en Matriz v2');
    expect(body).not.toMatch(/[–—]/);
  });
});

describe('excel change step', () => {
  it('shows the change as a decision, not a technical inventory', () => {
    const body = text(
      <FidelityStep item={item} index={1} total={6} onSave={async () => undefined} />,
    );
    expect(body).toContain('Cambio 1 de 6');
    expect(body).toContain('Desarrollo y sentido');
    expect(body).toContain('Origen: Excel original, E-AUD-001, Q24 a Q33');
    expect(body).toContain('Incluía disfrute y sentido.');
    expect(body).toContain('Estas preguntas no están en Matrix v2.');
    expect(body).toContain('No hay una decisión explícita de Matrix v2.');
    expect(body).toContain('Lo que necesitamos revisar');
    expect(body).toContain('¿Dónde debería vivir esta intención?');
    expect(body).not.toContain('Qué está documentado');
    expect(body).not.toContain('Qué no está documentado');
    expect(body).not.toContain('Ver fuente y detalle técnico');
    expect(body).not.toContain('Resultado de v2 no documentado');
  });

  it('briefs Ikigai as what was, what changed, then what Rafa decides', () => {
    const ikigai: LabProvenanceItem = {
      ...item,
      id: 'FID-IKIGAI',
      origin_type: 'V2_TRANSFORMATION',
      title: 'Ikigai',
      source_refs: [{ file: 'Excel original', sheet: 'E-PER-008', id: 'MIG-12', version: 'v2' }],
      previous_state:
        'En el Excel original, Ikigai pedía respuestas en cuatro áreas y después las combinaba según la posición en que habían sido escritas. Eso podía unir respuestas que no necesariamente tenían relación entre sí.',
      current_state:
        'En Matriz v2 se mantiene la idea de trabajar esas cuatro áreas, pero se elimina ese cruce automático. La persona construye primero una posible dirección y después la revisa usando seis criterios.',
      undocumented: [],
      decision_question:
        '¿Este cambio conserva lo importante del Ikigai original o se perdió algo que deberíamos recuperar?',
      composition: {
        from_v2: [],
        from_legacy: [],
        from_product: ['UX'],
        note: 'algunas ayudas, ejemplos y nombres que aparecen en la experiencia actual se definieron después de Matriz v2 para hacer el módulo más fácil de usar.',
      },
      card_kind: 'method_transform',
    };
    const body = text(
      <FidelityStep item={ikigai} index={6} total={6} onSave={async () => undefined} />,
    );
    expect(body).toContain('Origen: Excel original, E-PER-008, MIG-12');
    expect(body).toContain('según la posición en que habían sido escritas');
    expect(body).toContain('se elimina ese cruce automático');
    expect(body).toContain('Lo que necesitamos revisar');
    expect(body).toContain('¿Este cambio conserva lo importante del Ikigai original');
    expect(body).toContain(
      'Nota: algunas ayudas, ejemplos y nombres que aparecen en la experiencia actual se definieron después de Matriz v2',
    );
    expect(body).not.toContain('tipos de material');
    expect(body).not.toContain('dirección completa');
  });

  it('briefs Manifiesto as what was, what changed, what is unresolved, then what Rafa decides', () => {
    const manifiesto: LabProvenanceItem = {
      ...item,
      id: 'FID-MANIFIESTO',
      origin_type: 'V2_UNDOCUMENTED_RESULT',
      title: 'Manifiesto y ruta',
      source_refs: [{ file: 'Excel original', sheet: 'E-PER', id: 'MIG-02, MIG-13', version: 'v1 y v2' }],
      previous_state:
        'En el Excel original había un documento final que reunía lo que la persona había definido sobre sí misma, su dirección y lo que se comprometía a hacer después.',
      current_state:
        'En Matriz v2 ese documento deja de formar parte del diagnóstico. El relato personal se conserva separado del puntaje y de los estados de la Matriz.',
      undocumented: [
        'Lo que Matriz v2 no deja resuelto es en qué momento del proceso debería construirse ese documento: como parte de Dirección o más adelante, cuando ya se define qué hacer.',
      ],
      decision_question: '¿Dónde debería construirse este documento dentro del proceso de MK?',
      composition: null,
      card_kind: 'removed_content',
    };
    const body = text(
      <FidelityStep item={manifiesto} index={5} total={6} onSave={async () => undefined} />,
    );
    expect(body).toContain('Origen: Excel original, E-PER, MIG-02, MIG-13');
    expect(body).toContain('un documento final que reunía');
    expect(body).toContain('deja de formar parte del diagnóstico');
    expect(body).toContain('en qué momento del proceso debería construirse ese documento');
    expect(body).toContain('Lo que necesitamos revisar');
    expect(body).toContain('¿Dónde debería construirse este documento dentro del proceso de MK?');
    expect(body).not.toContain('¿Dónde debería vivir esta información?');
  });
});

describe('excel decisions recap', () => {
  it('turns each verdict into a readable phrase', () => {
    const body = text(
      <ExcelDecisionList
        items={[
          { ...item, rafa_verdict: 'RECOVER_DIRECTION' },
          {
            ...item,
            id: 'FID-FRAD003',
            title: 'Proyección financiera',
            rafa_verdict: 'ARCHIVE_LEGACY',
          },
          {
            ...item,
            id: 'FID-EPER006',
            title: 'Dificultades e integración',
            card_kind: 'method_transform',
            rafa_verdict: 'KEEP_V2_PARTIAL',
          },
          {
            ...item,
            id: 'FID-IKIGAI',
            title: 'Ikigai',
            card_kind: 'method_transform',
            rafa_verdict: 'KEEP_V2_PARTIAL',
          },
        ]}
      />,
    );
    expect(body).toContain('Resultado de la revisión');
    expect(body).toContain('Desarrollo y sentido');
    expect(body).toContain('→ Conservar en Dirección');
    expect(body).toContain('Proyección financiera');
    expect(body).toContain('→ Dejar para una etapa posterior');
    expect(body).toContain('Dificultades e integración');
    expect(body).toContain('→ Conservar, pero falta recuperar una parte');
    expect(body).toContain('Ikigai');
    expect(body).toContain('→ Falta recuperar una parte');
    expect(body).not.toContain('→ Dirección');
    expect(body).not.toContain('→ Más adelante');
    expect(body).not.toContain('Listo con los cambios desde los Excel');
  });

  it('phrases Dirección as a later decision, not a seventh Excel change', () => {
    expect(
      excelRecapPhrase({
        ...item,
        id: 'REF-DIRECTION-V01',
        title: 'Dirección en esta etapa',
        card_kind: 'refinement',
        rafa_verdict: 'CONFIRM',
      }),
    ).toBe(
      'Sí. Por ahora, Dirección registra y organiza lo que la persona expresa sin intentar definir automáticamente su propósito.',
    );
  });
});
