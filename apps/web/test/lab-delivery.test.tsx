import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ComposeAcceptedChanges } from '@/components/admin/lab/compose-accepted';
import { KeepCandidateButton } from '@/components/admin/lab/keep-candidate';

describe('LAB-040 keep button', () => {
  it('disables keep while worsens have no verdict', () => {
    const blocked = renderToStaticMarkup(
      <KeepCandidateButton blocked worsensWithoutVerdict={2} onKeep={() => undefined} />,
    );
    expect(blocked).toContain('Hay 2 casos que empeoran sin veredicto.');
    expect(blocked).toContain('disabled');
    const open = renderToStaticMarkup(
      <KeepCandidateButton blocked={false} worsensWithoutVerdict={0} onKeep={() => undefined} />,
    );
    expect(open).toContain('Sí, mantener este cambio');
    expect(open).not.toContain('disabled');
  });
});

describe('LAB-042 compose without IDs', () => {
  it('renders checkboxes for accepted changesets', () => {
    const markup = renderToStaticMarkup(
      <ComposeAcceptedChanges
        accepted={[
          {
            id: 'a',
            number: 1,
            reason: 'Subir el peso de Cuerpo',
            status: 'ACCEPTED',
            finding: null,
            candidate_ref: null,
            replay_id: null,
            operations: ['Cambiar el peso de AUD-CUE-01'],
          },
          {
            id: 'b',
            number: 2,
            reason: 'Cambiar el desempate',
            status: 'ACCEPTED',
            finding: null,
            candidate_ref: null,
            replay_id: null,
            operations: ['Cambiar una regla de interpretación'],
          },
        ]}
        selected={['a']}
        reason="Combinar los dos"
        busy={false}
        onToggle={() => undefined}
        onReason={() => undefined}
        onCompose={() => undefined}
      />,
    );
    expect(markup).toContain('Subir el peso de Cuerpo');
    expect(markup).toContain('Cambiar el desempate');
    expect(markup).toContain('type="checkbox"');
    expect(markup).not.toContain('IDs de cambios');
  });
});
