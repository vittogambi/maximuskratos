'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { LabCard } from '@/components/admin/lab/primitives';
import { labApi, type LabCaseRow, type LabWorkSession } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';

export default function LabSessionPage() {
  const [cases, setCases] = useState<LabCaseRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [closeObservation, setCloseObservation] = useState(true);
  const [session, setSession] = useState<LabWorkSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([labApi.cases(), labApi.currentSession().catch(() => null)])
      .then(([rows, current]) => {
        setCases(rows);
        setSession(current);
        if (current?.casebookKeys.length) setSelected(current.casebookKeys);
        else {
          setSelected(
            rows
              .filter((item) => item.casebook_key && !item.matrix_review_complete)
              .map((item) => item.casebook_key as string),
          );
        }
        if (current) setCloseObservation(current.closeObservationBeforeChanges);
      })
      .catch((err) => setError(humanError(err, 'No pudimos cargar la tanda.').message));
  }, []);

  function toggle(key: string) {
    setSelected((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <p className="lab-eyebrow">Opcional</p>
        <h1 className="admin-page-header__title">Seleccionar casos para revisar</h1>
        <p className="lab-lead">Crea una tanda de revisión si quieres acotar la biblioteca. No es necesario para abrir un caso.</p>
      </header>
      {error ? (
        <div className="lab-alert lab-alert--danger">
          <p className="lab-alert__title">{error}</p>
        </div>
      ) : null}
      <div className="lab-stack">
        <LabCard title="Casos de esta tanda">
          <div className="lab-filters">
            {cases
              .filter((item) => item.casebook_key)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selected.includes(item.casebook_key!) ? 'lab-chip is-active' : 'lab-chip'}
                  aria-pressed={selected.includes(item.casebook_key!)}
                  onClick={() => toggle(item.casebook_key!)}
                >
                  {item.label}
                </button>
              ))}
          </div>
          <label className="lab-check" style={{ marginTop: '1rem' }}>
            <input
              type="checkbox"
              checked={closeObservation}
              onChange={(event) => setCloseObservation(event.target.checked)}
            />
            Cerrar observación antes de probar cambios
          </label>
          <div className="lab-actions">
            <button
              type="button"
              className="lab-btn"
              disabled={busy || selected.length === 0}
              onClick={() => {
                setBusy(true);
                labApi
                  .createSession({
                    title: 'Tanda de revisión',
                    casebook_keys: selected,
                    close_observation_before_changes: closeObservation,
                  })
                  .then(setSession)
                  .catch((err) => setError(humanError(err, 'No pudimos completar esta acción.').message))
                  .finally(() => setBusy(false));
              }}
            >
              Crear tanda
            </button>
            <Link className="lab-btn lab-btn--ghost" href="/admin/lab">
              Ir a casos
            </Link>
          </div>
        </LabCard>
        {session ? (
          <LabCard title="Tanda abierta">
            <p className="lab-muted">{session.casebookKeys.join(', ')}</p>
            <button
              type="button"
              className="lab-btn"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                labApi
                  .closeSession(session.id)
                  .then(setSession)
                  .catch((err) => setError(humanError(err, 'No pudimos completar esta acción.').message))
                  .finally(() => setBusy(false));
              }}
            >
              Cerrar tanda
            </button>
          </LabCard>
        ) : null}
        {session?.summary ? (
          <LabCard title="Lo que registramos">
            <ul className="lab-muted" style={{ paddingLeft: '1.1rem' }}>
              <li>Casos revisados: {session.summary.cases_reviewed}</li>
              <li>Coincidencias: {session.summary.matches}</li>
              <li>Desacuerdos parciales: {session.summary.partial}</li>
              <li>Desacuerdos importantes: {session.summary.important}</li>
              <li>Hallazgos nuevos: {session.summary.findings_new}</li>
              <li>Hallazgos reforzados: {session.summary.findings_reinforced}</li>
              <li>Preguntas abiertas: {session.summary.open_questions}</li>
              <li>Cambios que vale la pena probar: {session.summary.worth_testing}</li>
            </ul>
          </LabCard>
        ) : null}
      </div>
    </div>
  );
}
