'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard } from '@/components/admin/lab/primitives';
import { labApi } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { POLICY } from '@/lib/lab-ui/labels';

export default function CreateCasePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [policy, setPolicy] = useState('FULL-v1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <Link className="lab-btn lab-btn--ghost" href="/admin/lab">
          Volver a casos
        </Link>
        <h1 className="admin-page-header__title">Crear un caso</h1>
      </header>
      <LabCard title="Información básica">
        <label className="lab-field">
          <span className="lab-label">Nombre o alias</span>
          <input className="lab-input" value={name} placeholder="Carlos" onChange={(event) => setName(event.target.value)} />
          <span className="lab-hint">Puedes usar un alias. Solo tú lo verás en el Lab.</span>
        </label>
        <label className="lab-field">
          <span className="lab-label">Contexto breve</span>
          <span className="lab-hint">
            Describe únicamente lo que necesitas recordar de esta persona. No intentes interpretar todavía el caso.
          </span>
          <textarea className="lab-textarea" value={context} onChange={(event) => setContext(event.target.value)} />
        </label>
        <label className="lab-field">
          <span className="lab-label">Preguntas que se presentan</span>
          <select className="lab-select" value={policy} onChange={(event) => setPolicy(event.target.value)}>
            {Object.entries(POLICY).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <span className="lab-hint">
            Evaluación completa presenta todas. Cambia esto solo para probar un recorte.
          </span>
        </label>
        {error ? <p className="lab-error">{error}</p> : null}
        <div className="lab-actions">
          <button
            type="button"
            className="lab-btn"
            disabled={busy || !name.trim()}
            onClick={() => {
              setBusy(true);
              labApi
                .createMethodologyCase({
                  name: name.trim(),
                  context: context.trim() || undefined,
                  kind: 'SELF',
                  policy_id: policy,
                })
                .then((created) => router.push(`/admin/lab/runs/${created.run.id}?step=responses`))
                .catch((err) => setError(humanError(err, 'No pudimos crear el caso.').message))
                .finally(() => setBusy(false));
            }}
          >
            Crear y empezar a responder
          </button>
        </div>
      </LabCard>
    </div>
  );
}
