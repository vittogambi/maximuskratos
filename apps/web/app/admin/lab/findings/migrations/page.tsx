'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { ExcelDecisionList, FidelityStep, excelRecapPhrase } from '@/components/admin/lab/fidelity-step';
import { LabCard, RadioCards, Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabProvenanceItem, type LabReviewAgenda } from '@/lib/lab-api';
import { humanError } from '@/lib/lab-ui/format';
import { REFINEMENT_VERDICT_OPTIONS } from '@/lib/lab-ui/labels';

const LINAJE_HINTS = [/rey/i, /guerrero/i, /mago/i, /amante/i, /sombra/i, /antepasad/i, /cualidad/i];
const LAB_HOME = '/admin/lab';

export default function LabMigrationsPage() {
  const [agenda, setAgenda] = useState<LabReviewAgenda | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [directionVerdict, setDirectionVerdict] = useState('');
  const [directionBusy, setDirectionBusy] = useState(false);

  useEffect(() => {
    labApi
      .reviewAgenda()
      .then(setAgenda)
      .catch((err) => setError(humanError(err, 'No pudimos cargar las decisiones.').message));
  }, []);

  async function save(id: string, next: { rafa_verdict: string; rafa_note: string | null }) {
    const saved = (await labApi.patchMigration(id, next)) as LabProvenanceItem;
    setAgenda((current) => {
      if (!current) return current;
      const replace = (list: LabProvenanceItem[]) => list.map((item) => (item.id === saved.id ? saved : item));
      return {
        ...current,
        fidelity_queue: replace(current.fidelity_queue),
        refinements_queue: replace(current.refinements_queue),
        documented: replace(current.documented),
        later: replace(current.later),
      };
    });
  }

  const queue = agenda?.fidelity_queue ?? [];
  const pending = queue.filter((item) => !item.rafa_verdict);
  const current = pending[0] ?? null;
  const currentIndex = current ? queue.findIndex((item) => item.id === current.id) + 1 : queue.length;
  const catalogs = agenda?.legacy_catalogs ?? [];
  const related = useMemo(() => {
    if (current?.id !== 'FID-LINAJE') return [];
    const rows = catalogs.filter((item) => item.human_group === 'FID-LINAJE');
    return LINAJE_HINTS.map((pattern) => rows.find((item) => pattern.test(item.element)))
      .filter(Boolean)
      .map((item) => ({ element: item!.element, catalog: item!.catalog }));
  }, [catalogs, current?.id]);
  const direction = (agenda?.refinements_queue ?? []).find((item) => item.id === 'REF-DIRECTION-V01') ?? null;
  const showDirection = Boolean(agenda && pending.length === 0 && direction && !direction.rafa_verdict);
  const showRecap = Boolean(agenda && pending.length === 0);
  const showDirectionResult = Boolean(showRecap && direction?.rafa_verdict);
  const reviewClosed = Boolean(showRecap && !showDirection);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <h1 className="admin-page-header__title">Cambios desde los Excel</h1>
        <p className="lab-lead">{showRecap ? 'Revisión completada.' : 'Seis decisiones.'}</p>
        {showRecap ? (
          <p>Ya revisaste las 6 decisiones sobre lo que cambió entre los Excel originales y Matriz v2.</p>
        ) : null}
      </header>
      {error ? <p className="lab-error">{error}</p> : null}
      {!agenda ? (
        <Skeleton lines={6} />
      ) : (
        <div className="lab-stack">
          {current ? (
            <FidelityStep
              key={current.id}
              item={current}
              index={currentIndex}
              total={queue.length}
              related={related}
              onSave={(next) => save(current.id, next)}
            />
          ) : null}

          {showRecap ? <ExcelDecisionList items={queue} /> : null}

          {showDirection && direction ? (
            <LabCard title="Dirección en esta etapa">
              <div className="lab-stack lab-stack--tight">
                <p>Esta decisión es posterior a los cambios desde los Excel.</p>
                {direction.current_state ? <p>{direction.current_state}</p> : null}
                {(direction.undocumented ?? []).map((fact) => (
                  <p key={fact}>{fact}</p>
                ))}
                <div>
                  <p className="lab-h4">Lo que necesitamos revisar</p>
                  <p className="lab-h3">{direction.decision_question}</p>
                </div>
                <RadioCards
                  name="direction-stage"
                  value={directionVerdict}
                  options={REFINEMENT_VERDICT_OPTIONS}
                  columns={2}
                  onChange={setDirectionVerdict}
                />
                <div className="lab-actions">
                  <button
                    type="button"
                    className="lab-btn"
                    disabled={directionBusy || !directionVerdict}
                    onClick={() => {
                      if (!direction) return;
                      setDirectionBusy(true);
                      save(direction.id, { rafa_verdict: directionVerdict, rafa_note: null }).finally(() =>
                        setDirectionBusy(false),
                      );
                    }}
                  >
                    Guardar y continuar
                  </button>
                </div>
              </div>
            </LabCard>
          ) : null}

          {showDirectionResult && direction ? (
            <LabCard title="Dirección en esta etapa">
              <div className="lab-stack lab-stack--tight">
                <p>Esta decisión es posterior a los cambios desde los Excel.</p>
                <div>
                  <p className="lab-h4">Resultado:</p>
                  <p>→ {excelRecapPhrase(direction)}</p>
                </div>
              </div>
            </LabCard>
          ) : null}

          {reviewClosed ? (
            <div className="lab-actions">
              <Link className="lab-btn" href={LAB_HOME}>
                Volver al Lab
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
