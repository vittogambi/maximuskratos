'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DomainChip } from '@/components/admin/lab/domain-chip';
import { LabNav } from '@/components/admin/lab/lab-nav';
import { Skeleton } from '@/components/admin/lab/primitives';
import { labApi, type LabObservationList } from '@/lib/lab-api';
import { humanDimensionLabel } from '@/lib/lab-ui/domain';
import { humanError } from '@/lib/lab-ui/format';
import { ASPECT_FILTER_LABEL, labUiLabels } from '@/lib/lab-ui/labels';

const ASPECT_KEYS = ['wording', 'scale', 'score', 'domain', 'dimension', 'weight', 'safety'] as const;

export default function FlaggedQuestionsPage() {
  const [data, setData] = useState<LabObservationList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState('');
  const [aspect, setAspect] = useState('');
  const [status, setStatus] = useState('');
  const [engineOnly, setEngineOnly] = useState(false);

  useEffect(() => {
    labApi
      .observations()
      .then(setData)
      .catch((err) => setError(humanError(err, 'No pudimos cargar las preguntas marcadas.').message));
  }, []);

  const questions = useMemo(() => {
    const rows = data?.questions ?? [];
    return rows.filter((item) => {
      if (domain && item.domain !== domain) return false;
      if (status && item.status !== status) return false;
      if (engineOnly && !item.engine_testable) return false;
      if (aspect && !(item.aspect_counts?.[aspect] ?? 0)) return false;
      return true;
    });
  }, [data, domain, aspect, status, engineOnly]);

  return (
    <div className="lab">
      <LabNav />
      <header className="lab-hero">
        <h1 className="admin-page-header__title">Preguntas observadas</h1>
        <p className="lab-lead">
          Aparecen cuando las marcas desde un caso. No hay que auditar las 187 para cerrar la Matriz.
        </p>
      </header>
      {data ? (
        <div className="lab-grid-4">
          <div className="lab-metric">
            <span className="lab-metric__value">{data.questions.length}</span>
            <span className="lab-metric__label">Observadas</span>
          </div>
          <div className="lab-metric">
            <span className="lab-metric__value">
              {data.questions.filter((item) => item.status === 'CONVERTED_TO_FINDING').length}
            </span>
            <span className="lab-metric__label">Con cambio</span>
          </div>
          <div className="lab-metric">
            <span className="lab-metric__value">
              {data.questions.filter((item) => item.status === 'RESOLVED').length}
            </span>
            <span className="lab-metric__label">Confirmadas</span>
          </div>
          <div className="lab-metric">
            <span className="lab-metric__value">
              {data.questions.filter((item) => item.status === 'NEEDS_MORE_CASES').length}
            </span>
            <span className="lab-metric__label">Necesitan más casos</span>
          </div>
        </div>
      ) : null}
      {error ? <p className="lab-error">{error}</p> : null}
      <div className="lab-filters" style={{ marginBottom: '1rem' }}>
        <select className="lab-select" value={domain} onChange={(event) => setDomain(event.target.value)}>
          <option value="">Ámbito</option>
          <option value="MENTALIDAD">Mentalidad</option>
          <option value="RELACIONES">Relaciones</option>
          <option value="FINANZAS">Finanzas</option>
          <option value="CUERPO">Cuerpo</option>
        </select>
        <select className="lab-select" value={aspect} onChange={(event) => setAspect(event.target.value)}>
          <option value="">Aspecto</option>
          {ASPECT_KEYS.map((key) => (
            <option key={key} value={key}>
              {ASPECT_FILTER_LABEL[key]}
            </option>
          ))}
        </select>
        <select className="lab-select" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Estado</option>
          <option value="PENDING">Pendiente</option>
          <option value="NEEDS_MORE_CASES">Necesita más casos</option>
          <option value="CONVERTED_TO_FINDING">Convertida en hallazgo</option>
          <option value="DISCARDED">Descartada</option>
          <option value="RESOLVED">Resuelta</option>
        </select>
        <button
          type="button"
          className={engineOnly ? 'lab-chip is-active' : 'lab-chip'}
          onClick={() => setEngineOnly((value) => !value)}
        >
          Se puede probar como cambio
        </button>
      </div>
      {!data ? (
        <Skeleton lines={5} />
      ) : questions.length === 0 ? (
        <div className="lab-empty">
          <p style={{ margin: 0 }}>
            Todavía no has revisado ninguna pregunta. Aparecen aquí cuando usas Revisar esta pregunta dentro de un
            caso.
          </p>
        </div>
      ) : (
        <div className="lab-caselist">
          {questions.map((item) => (
            <article key={item.question_id} className="lab-case">
              <div>
                <h2 className="lab-case__title">{item.text}</h2>
                <div className="lab-qrow__meta">
                  <DomainChip domain={item.domain} />
                  <span className="lab-dim">{humanDimensionLabel(item.dimension_label) || 'Sin dimensión'}</span>
                  <span className="lab-badge">{labUiLabels.observationStatus(item.status)}</span>
                </div>
                <p className="lab-muted">Revisada en {item.cases.length} casos</p>
                <div className="lab-filters">
                  {ASPECT_KEYS.filter((key) => item.aspect_counts?.[key]).map((key) => (
                    <span key={key} className="lab-badge">
                      {ASPECT_FILTER_LABEL[key]}: {item.aspect_counts?.[key]}
                    </span>
                  ))}
                </div>
                {item.cases.map((entry) =>
                  entry.proposal ? (
                    <p key={`${entry.case_id}-${entry.proposal}`} className="lab-muted">
                      {entry.label}: {entry.proposal}
                    </p>
                  ) : null,
                )}
              </div>
              <div className="lab-case__side">
                <Link className="lab-btn" href={`/admin/lab/findings/questions/${item.question_id}`}>
                  Crear hallazgo con esta pregunta
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
