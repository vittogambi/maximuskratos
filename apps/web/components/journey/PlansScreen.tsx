'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { FORMULARIO_GUIDES, unfinishedHelp, valueHelpTemplate } from '@/lib/plan-guides';
import { addAction, createPlan, journeyContract, journeyPlans, journeySynthesis, type PlanRow, type SynthesisPayload } from '@/lib/journey-api';
import { getApiBaseUrl } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import { ContentClarification } from './ContentClarification';
import { ContentMarks } from './ContentMarks';
import { AccompanimentFlow } from './AccompanimentFlow';
import { DevolucionView } from './DevolucionView';
import { JourneyNotice, noticeFrom, type JourneyNoticeState } from './JourneyNotice';

export function PlansScreen({ embedded = false, territory }: { embedded?: boolean; territory?: string | null }) {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [title, setTitle] = useState('');
  const [outcome, setOutcome] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [doneWhen, setDoneWhen] = useState('');
  const [weekday, setWeekday] = useState('1');
  const [marks, setMarks] = useState<string[]>([]);
  const [actionGuideId, setActionGuideId] = useState('');
  const [help, setHelp] = useState(FORMULARIO_GUIDES[0].starter);
  const [valueDraft, setValueDraft] = useState('');
  const [valueRef, setValueRef] = useState('');
  const [bundle, setBundle] = useState<SynthesisPayload | null>(null);
  const [link, setLink] = useState('EXPLORATORY');
  const [guideId, setGuideId] = useState(FORMULARIO_GUIDES[0].id);
  const guide = FORMULARIO_GUIDES.find((item) => item.id === guideId) ?? FORMULARIO_GUIDES[0];
  const [notice, setNotice] = useState<JourneyNoticeState>(null);
  const [paths, setPaths] = useState<{ id: string; title: string; personalized: boolean; firstStep: string }[]>([]);
  const [chosenPath, setChosenPath] = useState('');
  const [preference, setPreference] = useState('');
  const [noticeOn, setNoticeOn] = useState<'plan' | 'action'>('plan');
  const [noticePlanId, setNoticePlanId] = useState<string | null>(null);

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const [rows, contract, synthesis] = await Promise.all([
      journeyPlans(token),
      journeyContract(token).catch(() => null),
      journeySynthesis(token).catch(() => null),
    ]);
    setPlans(rows);
    const devolution = await fetch(`${getApiBaseUrl()}/api/v1/journey/devolution`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : null).catch(() => null);
    setPaths(Array.isArray(devolution?.paths) ? devolution.paths : []);
    if (devolution?.saved?.path) setChosenPath(devolution.saved.path);
    if (devolution?.saved?.preference === 'PROPIO' || devolution?.saved?.preference === 'PUNTUAL' || devolution?.saved?.preference === 'GUIADA') {
      setPreference(devolution.saved.preference);
    }
    setBundle(synthesis);
    const draft = contract?.articles.flatMap((article) => article.items).find((item) => item.label === 'Valores' || item.label === 'Valor');
    setValueDraft(draft && !draft.text.toLowerCase().includes('pendiente') ? draft.text : '');
  }

  useEffect(() => { void load().catch((err) => setNotice(noticeFrom(err, 'No pudimos cargar tus planes.'))); }, []);

  async function onPlan(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    const pendingHelp = unfinishedHelp(help, valueRef);
    if (pendingHelp) {
      setNoticeOn('plan');
      setNotice({ message: pendingHelp, nextHref: null, alternatives: ['Completa el artefacto y vuelve a guardar'], code: null, scope: null });
      return;
    }
    setNotice(null);
    try {
      await createPlan(token, {
        title,
        outcome,
        priorityNote: help,
        linkKind: link,
        valueRef: valueRef || undefined,
        purposeRevisionId: bundle?.purposeRevisionId,
        territory: territory || undefined,
      });
      setTitle('');
      setOutcome('');
      await load();
    } catch (err) {
      // The draft stays in the form; the notice names the step that unblocks the plan.
      setNoticeOn('plan');
      setNotice(noticeFrom(err, 'No se pudo crear el plan.'));
    }
  }

  async function saveAction(planId: string, extra?: { healthLimit?: string; conversation?: string }) {
    const token = getAccessToken();
    if (!token) return;
    setNotice(null);
    try {
      await addAction(token, planId, {
        title: actionTitle,
        doneWhen,
        weekday: Number(weekday),
        guideId: actionGuideId || undefined,
        contentTags: marks,
        ...extra,
      });
      setActionTitle('');
      setDoneWhen('');
      setMarks([]);
      await load();
    } catch (err) {
      setNoticeOn('action');
      setNoticePlanId(planId);
      setNotice(noticeFrom(err, 'No se pudo agregar la acción.'));
    }
  }

  async function onAction(event: FormEvent, planId: string) {
    event.preventDefault();
    await saveAction(planId);
  }

  const active = plans.filter((plan) => plan.status === 'ACTIVE');

  return (
    <div className={embedded ? 'mk-design-embed' : 'mk-dashboard'}>
      {embedded ? null : (
        <>
          <p className="mk-section-eyebrow">PLANES</p>
          <h1 className="sys-header__title">Planes</h1>
        </>
      )}
      {territory ? <p className="mk-m-muted">Este plan queda en {territory.replaceAll('_', ' ').toLowerCase()}.</p> : null}
      <DevolucionView
        paths={paths}
        chosen={chosenPath}
        onChoose={(id) => {
          setChosenPath(id);
          setPreference(id === 'SEGUIR' ? 'PROPIO' : 'GUIADA');
        }}
      />
      <AccompanimentFlow initialPreference={preference} path={chosenPath} />
      <form onSubmit={onPlan} className="mk-form">
        <label>Resultado buscado<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label>Cómo sabrás que ocurrió<textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} required rows={3} /></label>
        <label>
          Vínculo con tu dirección
          <select value={link} onChange={(event) => setLink(event.target.value)}>
            <option value="DIRECT">Directo</option>
            <option value="ENABLING">Habilitante</option>
            <option value="PROTECTIVE">Protege algo</option>
            <option value="EXPLORATORY">Exploratorio</option>
          </select>
        </label>
        <label>
          Guía
          <select value={guideId} onChange={(event) => {
            const next = FORMULARIO_GUIDES.find((item) => item.id === event.target.value) ?? FORMULARIO_GUIDES[0];
            setGuideId(next.id);
            setHelp(next.id === 'estandar' && valueDraft
              ? `Valor: ${valueDraft}. Esta semana: [conducta]. Excepción: ninguna o cuál.`
              : next.starter);
          }}>
            {FORMULARIO_GUIDES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        {valueDraft ? <p>En la hoja, el borrador de valores es: {valueDraft}</p> : null}
        {(bundle?.purpose.edited || bundle?.purpose.generated) ? (
          <p>Referencia de propósito: {bundle.purpose.edited?.trim() || bundle.purpose.generated}</p>
        ) : null}
        <label>
          Valor o estándar que orienta esta decisión
          <select value={valueRef} onChange={(event) => {
            const next = event.target.value;
            setValueRef(next);
            if (!next) return;
            const filled = valueHelpTemplate(next);
            setHelp((current) => (current === guide.starter || current.startsWith('Valor:') ? filled : current));
          }}>
            <option value="">Sin un valor concreto</option>
            {(bundle?.values ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
            {(bundle?.standards ?? []).map((item) => (
              <option key={item.label} value={`${item.label}: ${item.text}`}>{item.label}: {item.text}</option>
            ))}
          </select>
        </label>
        <p>{guide.whenUseful}</p>
        <p>El texto de abajo es un ejemplo para preparar el artefacto. Lo que guardas tiene que quedar escrito por ti.</p>
        <ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <label>{guide.artifactLabel}<textarea value={help} onChange={(event) => setHelp(event.target.value)} required rows={3} /></label>
        <button className="mk-btn-primary" type="submit">Crear plan</button>
      </form>
      {noticeOn === 'plan' ? <JourneyNotice notice={notice} /> : null}
      {active.map((plan) => (
        <section key={plan.id} className="sys-index">
          <h2>{plan.title}</h2>
          <p>{plan.outcome}</p>
          {plan.valueRef ? <p>Esta decisión usa el valor: {plan.valueRef}</p> : null}
          {plan.linkKind ? <p>Vínculo con la dirección: {plan.linkKind === 'DIRECT' ? 'Directo' : plan.linkKind === 'ENABLING' ? 'Habilitante' : plan.linkKind === 'PROTECTIVE' ? 'Protege algo' : 'Exploratorio'}</p> : null}
          {plan.priorityNote ? <p>{plan.priorityNote}</p> : null}
          <ul>
            {plan.actions.map((action) => (
              <li key={action.id}>{action.title}. Hecho cuando: {action.doneWhen}</li>
            ))}
          </ul>
          <form onSubmit={(event) => onAction(event, plan.id)} className="mk-form">
            <label>Acción<input value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} required /></label>
            <label>Criterio<input value={doneWhen} onChange={(e) => setDoneWhen(e.target.value)} required /></label>
            <label>
              Día de la ocasión
              <select aria-label="Día de la ocasión" value={weekday} onChange={(event) => setWeekday(event.target.value)}>
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
                <option value="6">Sábado</option>
                <option value="0">Domingo</option>
              </select>
            </label>
            <ContentMarks legend="Esta acción implica" selected={marks} onChange={setMarks} />
            <label>
              Guía de origen (opcional)
              <select value={actionGuideId} onChange={(event) => setActionGuideId(event.target.value)}>
                <option value="">Sin guía</option>
                {FORMULARIO_GUIDES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            {noticeOn === 'action' && noticePlanId === plan.id ? <JourneyNotice notice={notice} /> : null}
            {noticeOn === 'action' && noticePlanId === plan.id && notice?.code === 'CLARIFICATION_REQUIRED' && notice.scope ? (
              <ContentClarification scope={notice.scope} onChoose={(value) => {
                void saveAction(plan.id, notice.scope === 'HEALTH' ? { healthLimit: value } : { conversation: value });
              }} />
            ) : null}
            <button className="mk-btn-ghost" type="submit">Agregar acción</button>
          </form>
        </section>
      ))}
      <Link href="/calendario" className="mk-btn-primary">Verlas en el calendario</Link>
    </div>
  );
}
