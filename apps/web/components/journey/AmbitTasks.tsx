'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  addDomainAction,
  journeyDomain,
  saveRecord,
  type ActionDomainName,
  type DomainView,
} from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';
import { ContentClarification } from './ContentClarification';
import { ContentMarks } from './ContentMarks';
import { TaskRow } from './TaskRow';
import { JourneyNotice, noticeFrom, type JourneyNoticeState } from './JourneyNotice';

const NAMES: Record<ActionDomainName, string> = {
  MENTE: 'Mente',
  ESPIRITU: 'Espíritu',
  CUERPO: 'Cuerpo',
};

export function AmbitTasks({ domain }: { domain: ActionDomainName }) {
  const [view, setView] = useState<DomainView | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [doneWhen, setDoneWhen] = useState('');
  const [marks, setMarks] = useState<string[]>([]);
  const [notice, setNotice] = useState<JourneyNoticeState>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const ready = title.trim().length > 0 && doneWhen.trim().length > 0;

  useEffect(() => {
    if (notice) noticeRef.current?.scrollIntoView({ block: 'center' });
  }, [notice]);

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    setView(await journeyDomain(token, domain));
  }

  useEffect(() => {
    void load().catch((err) => setNotice(noticeFrom(err, 'No pudimos cargar las tareas.')));
  }, [domain]);

  async function save(extra?: { healthLimit?: string; conversation?: string }) {
    const token = getAccessToken();
    if (!token || !ready) return;
    setNotice(null);
    try {
      await addDomainAction(token, domain, { title, doneWhen, contentTags: marks, ...extra });
      setTitle('');
      setDoneWhen('');
      setMarks([]);
      setOpen(false);
      await load();
    } catch (err) {
      // The draft stays in the form so the member can answer or choose another task.
      setNotice(noticeFrom(err, 'No se pudo guardar la tarea.'));
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    await save();
  }

  async function mark(actionId: string, status: 'DONE' | 'SKIPPED' | 'NOT_APPLICABLE' | 'PENDING') {
    const token = getAccessToken();
    if (!token || !view) return;
    setNotice(null);
    try {
      await saveRecord(token, { actionId, day: view.today, status });
      await load();
    } catch (err) {
      setNotice(noticeFrom(err, 'No se pudo registrar.'));
    }
  }

  return (
    <div className="mk-ambit-page">
      <Link href="/panel" className="mk-ambit-page__back">Volver al panel</Link>
      <div>
        <header className="mk-ambit-page__head">
          <div>
            <p className="mk-ambit-page__mark">{NAMES[domain]}</p>
            <h1 className="mk-page-title">Tareas de {NAMES[domain].toLowerCase()}</h1>
          </div>
          {open ? null : (
            <button type="button" className="mk-member-btn" onClick={() => setOpen(true)}>
              Agregar una tarea
            </button>
          )}
        </header>
        {open ? null : <JourneyNotice notice={notice} />}
        {(view?.actions ?? []).map((action) => (
          <TaskRow
            key={action.id}
            title={action.title}
            detail={action.doneWhen}
            pillar={NAMES[domain]}
            status={action.todayStatus}
            disabled={view?.weekClosed}
            disabledReason="Esta semana ya está cerrada."
            onStatus={(status) => mark(action.id, status)}
          />
        ))}
        {(view?.actions.length ?? 0) === 0 && !open ? <p>Todavía no hay tareas en este ámbito.</p> : null}
        {open ? (
          <form onSubmit={onCreate} className="mk-form">
            <label>
              Tarea
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Criterio
              <input value={doneWhen} onChange={(event) => setDoneWhen(event.target.value)} />
            </label>
            <ContentMarks legend="Esta tarea implica" selected={marks} onChange={setMarks} />
            <div ref={noticeRef}>
              <JourneyNotice notice={notice} />
              {notice?.code === 'CLARIFICATION_REQUIRED' && notice.scope ? (
                <ContentClarification scope={notice.scope} onChoose={(value) => {
                  void save(notice.scope === 'HEALTH' ? { healthLimit: value } : { conversation: value });
                }} />
              ) : null}
            </div>
            <button type="submit" className="mk-member-btn" disabled={!ready} aria-describedby={ready ? undefined : 'ambit-save-hint'}>
              Guardar tarea
            </button>
            {!ready ? <p id="ambit-save-hint">Escribe la tarea y el criterio para guardarla.</p> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
