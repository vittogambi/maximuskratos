import { useState, type KeyboardEvent } from 'react';
import { AppIcon } from '@/components/app-icon';
import { ContractSections, SHEET_ANCHORS } from '@/components/journey/ContractSections';
import sheetStyles from '@/components/journey/RoadmapContract.module.css';
import type { AdminAlertPage, AdminJourney, AdminResponsePage } from '@/lib/api';
import { formatAlignmentDate, formatAlignmentValue } from '@/lib/journey-api';
import { formatMethodVersionLabel } from '@/lib/method-version-label';
import {
  SHADOW_BLOCK_COPY,
  difficultyLevel,
  shadowTotalsCopy,
  type DifficultyKind,
} from '@/lib/difficulty-copy';
import { PERSONALITY_FACTOR_ROWS, formatPersonalityAverage } from '@/lib/personality-copy';
import styles from './recorrido.module.css';
import {
  apartadoFrom,
  answerStatusLabel,
  cellLabel,
  directionLabel,
  fieldLabel,
  kindLabel,
  onboardingLabel,
  presentReading,
  questionStem,
  sheetHeading,
  presentActivity,
  alertModuleContext,
  alertRuleConditionLabel,
  presentCrossReading,
  questionTypeLabel,
  roleLabel,
  sessionStatusLabel,
  vistaFrom,
  type Apartado,
  type SheetItem,
  type Vista,
} from './recorrido-reading';

const VISTA_LABEL = {
  resumen: 'Resumen',
  respuestas: 'Respuestas',
  perfil: 'Perfil e índices',
  proposito: 'Propósito y hoja',
  alertas: 'Alertas',
} as const;

const APARTADO_LABEL = {
  direccion: 'Dirección',
  actividades: 'Actividades IKIGAI',
  cruce: 'Cruce',
  hoja: 'Hoja de ruta',
} as const;

const DIFFICULTY: Array<[string, string, 'interferencia' | 'recurso']> = [
  ['PR', 'Patrones repetitivos', 'interferencia'],
  ['ER', 'Emociones rechazadas', 'interferencia'],
  ['PY', 'Proyección', 'interferencia'],
  ['D', 'Excusas y autoengaño', 'interferencia'],
  ['IN', 'Recursos de integración', 'recurso'],
];

function questionnaireStatusLabel(journey: AdminJourney): string {
  const finished = journey.sessions.some(
    (item) => item.definitionRef === 'formulario-completo' && item.status === 'COMPLETED',
  );
  if (finished) return sessionStatusLabel('COMPLETED');
  const selected = journey.sessions.find((item) => item.id === journey.selectedSessionId);
  if (selected) return sessionStatusLabel(selected.status);
  return 'Sin cuestionario activo';
}

export function RecorridoView({
  journey,
  responses,
  error,
  vista,
  apartado,
  modulo,
  pagina,
  onVista,
  onApartado,
  onModule,
  onPage,
  responsesError = '',
  responsesLoading = false,
  onRetryResponses,
  onRetryJourney,
}: {
  journey: AdminJourney | null;
  responses: AdminResponsePage | null;
  alerts?: AdminAlertPage | null;
  error: string;
  vista: Vista;
  apartado: Apartado;
  modulo: string | null;
  pagina: number;
  onVista: (vista: Vista) => void;
  onApartado: (apartado: Apartado) => void;
  onModule: (slug: string) => void;
  onPage: (page: number) => void;
  onRetryAlerts?: () => void;
  responsesError?: string;
  responsesLoading?: boolean;
  onRetryResponses?: () => void;
  onRetryJourney?: () => void;
}) {
  if (error) return <div className={styles.page}><div className={styles.errorState} role="alert"><h1 className={styles.viewTitle}>No se pudo abrir el recorrido</h1><p>{error}</p><div className={styles.pager}><a className={styles.retry} href="/admin/users">Volver a usuarios</a>{onRetryJourney ? <button type="button" className={styles.retry} onClick={onRetryJourney}>Reintentar</button> : null}</div></div></div>;
  if (!journey) return <div className={styles.page}><p className={styles.emptyState} role="status">Leyendo el recorrido.</p></div>;
  const questionnaireStatus = questionnaireStatusLabel(journey);
  const name = journey.direction?.name || journey.signed?.name || 'Sin nombre';
  return (
    <div className={styles.page}>
      <a className={styles.back} href="/admin/users">Volver a usuarios</a>
      <header className={styles.context}>
        <div className={styles.identity}>
          <p className={styles.kicker}>Recorrido de la cuenta. Solo lectura</p>
          <h1 className={styles.title}>{name}</h1>
          <p className={styles.quiet}>{journey.account.email}</p>
        </div>
        <dl className={styles.metaRow}>
          <div><dt>Rol</dt><dd>{roleLabel(journey.account.role)}</dd></div>
          <div><dt>Onboarding</dt><dd>{onboardingLabel(journey.account.onboardingStep)}</dd></div>
          <div><dt>Cuestionario</dt><dd>{questionnaireStatus}</dd></div>
        </dl>
      </header>
      <nav className={styles.tabs} role="tablist" aria-label="Vista del recorrido" onKeyDown={(event) => moveTab(event, vista, Object.keys(VISTA_LABEL) as Vista[], onVista)}>
        {(Object.keys(VISTA_LABEL) as Vista[]).map((item) => (
          <button key={item} type="button" className={styles.tab} role="tab" id={`recorrido-tab-${item}`} aria-controls="recorrido-panel" tabIndex={vista === item ? 0 : -1} aria-selected={vista === item} onClick={() => onVista(item)}>{VISTA_LABEL[item]}</button>
        ))}
      </nav>
      <div className={`${styles.field} ${styles.viewSelect}`}>
        <label className={styles.label} htmlFor="vista-select">Vista del recorrido</label>
        <select id="vista-select" className={styles.select} value={vista} onChange={(event) => onVista(vistaFrom(event.target.value))}>
          {(Object.keys(VISTA_LABEL) as Vista[]).map((item) => <option key={item} value={item}>{VISTA_LABEL[item]}</option>)}
        </select>
      </div>
      <section id="recorrido-panel" role="tabpanel" aria-labelledby={`recorrido-tab-${vista}`} className={styles.viewBody}>
      {vista === 'resumen' ? <Summary journey={journey} sessionId={journey.selectedSessionId} onVista={onVista} /> : null}
      {vista === 'respuestas' ? <Answers key={`${journey.account.id}:${journey.selectedSessionId}`} journey={journey} responses={responses} modulo={modulo} pagina={pagina} onModule={onModule} onPage={onPage} error={responsesError} loading={responsesLoading} onRetry={onRetryResponses} /> : null}
      {vista === 'perfil' ? <Profile journey={journey} /> : null}
      {vista === 'proposito' ? <Purpose journey={journey} apartado={apartado} onApartado={onApartado} /> : null}
      {vista === 'alertas' ? <Alerts journey={journey} /> : null}
      </section>
    </div>
  );
}

function Summary({ journey, sessionId, onVista }: { journey: AdminJourney; sessionId: string | null; onVista: (vista: Vista) => void }) {
  const reading = journey.alignment.find((row) => row.sessionId === sessionId) ?? null;
  const covered = journey.modules.reduce((sum, module) => sum + module.answered, 0);
  const required = journey.modules.reduce((sum, module) => sum + module.total, 0);
  const rules = journey.rules ?? [];
  const firedCount = rules.filter((rule) => rule.status === 'FIRED').length;
  return (
    <div className={styles.dashboard}>
      <header className={styles.sectionHead}><div><h2 className={styles.viewTitle}>Resumen</h2><p className={styles.note}>Avance del cuestionario, dirección y firma vigentes de la cuenta.</p></div><span className={styles.badge}>Solo lectura</span></header>
      <div className={styles.overviewGrid}>
        <section className={styles.panel}>
          <div className={styles.sectionHead}><h3 className={styles.subTitle}>Índice de alineación MK</h3><button type="button" className={styles.linkish} onClick={() => onVista('perfil')}>Ver lecturas</button></div>
          {reading ? <ReadingCard row={reading} /> : <p className={styles.emptyState}>No hay una lectura guardada del cuestionario.</p>}
        </section>
        <section className={styles.panel}>
          <h3 className={styles.subTitle}>Estado del recorrido</h3>
          <dl className={styles.statusList}>
            <Pair label="Respuestas guardadas" value={required > 0 ? `${covered} de ${required}` : 'Sin preguntas en el cuestionario'} />
            <Pair label="Dirección de la cuenta" value={directionLabel(journey.direction?.status)} />
            <Pair label="Hoja de ruta" value={journey.signed ? 'Firmada' : 'Sin firma'} note={journey.draftIsLater ? 'Hay un borrador posterior a la firma.' : null} />
            <Pair label="Alertas de auditoría" value={rules.length === 0 ? 'Sin respuestas evaluadas' : `${firedCount} gatilladas de ${rules.length} evaluadas`} />
          </dl>
          <button type="button" className={styles.retry} onClick={() => onVista('alertas')}>Revisar alertas</button>
        </section>
      </div>
      <section className={styles.panel}>
        <div className={styles.sectionHead}><h3 className={styles.subTitle}>Diagnósticos del cuestionario</h3><button type="button" className={styles.linkish} onClick={() => onVista('respuestas')}>Ver respuestas</button></div>
        <dl className={styles.metricGrid}>{profileReadings(journey.profile ?? {}).map((row) => <Pair key={row.label} label={row.label} value={row.figure} note={row.note} />)}</dl>
      </section>
    </div>
  );
}

function Answers({ journey, responses, modulo, pagina, onModule, onPage, error, loading, onRetry }: { journey: AdminJourney; responses: AdminResponsePage | null; modulo: string | null; pagina: number; onModule: (slug: string) => void; onPage: (page: number) => void; error?: string; loading?: boolean; onRetry?: () => void }) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = journey.modules.filter((module) => !needle || `${module.title} ${sheetHeading(module)}`.toLowerCase().includes(needle));
  const groups = new Map<string, AdminJourney['modules']>();
  for (const module of visible) {
    const key = sheetHeading(module);
    groups.set(key, [...(groups.get(key) ?? []), module]);
  }
  const selected = journey.modules.find((module) => module.slug === modulo) ?? null;
  const selectedAt = journey.modules.findIndex((module) => module.slug === modulo);
  const previous = selectedAt > 0 ? journey.modules[selectedAt - 1] : null;
  const following = selectedAt >= 0 && selectedAt < journey.modules.length - 1 ? journey.modules[selectedAt + 1] : null;
  const pageMatches = Boolean(responses && selected && responses.module.slug === selected.slug && responses.page === pagina);
  const shownPage = pageMatches ? responses : null;
  const size = shownPage?.pageSize ?? 30;
  const from = shownPage ? (shownPage.page - 1) * size + 1 : 0;
  const to = shownPage ? Math.min(shownPage.page * size, shownPage.total) : 0;
  return (
    <div className={`${styles.panel} ${styles.answersPanel}`}>
      <div className={styles.sectionHead}><h2 className={styles.viewTitle}>Respuestas</h2><span className={styles.badge}>Solo lectura</span></div>
      <div className={styles.reader}>
        <nav className={styles.moduleNav} aria-label="Módulos">
          <h3 className={styles.navTitle}>Módulos</h3>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="module-search">Buscar módulo</label>
            <input id="module-search" className={styles.select} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {[...groups.entries()].map(([stage, modules]) => (
            <div key={stage}>
              <p className={styles.stageName}>{stage}</p>
              {modules.map((module) => (
                <button key={module.slug} type="button" className={styles.moduleRow} aria-current={module.slug === modulo ? 'true' : undefined} onClick={() => onModule(module.slug)}>
                  <span className={styles.moduleName}>{module.title}</span>
                  <span className={styles.coverage}>{module.answered}/{module.total}</span>
                </button>
              ))}
            </div>
          ))}
          {visible.length === 0 ? <p className={styles.note}>Ningún módulo coincide.</p> : null}
        </nav>
        <div className={styles.reading}>
          <div className={`${styles.field} ${styles.moduleSelect}`}>
            <label className={styles.label} htmlFor="module-select">Módulo</label>
            <select id="module-select" className={styles.select} value={modulo ?? ''} onChange={(event) => onModule(event.target.value)}>
              <option value="">Elige un módulo</option>
              {[...moduleGroups(journey.modules).entries()].map(([stage, modules]) => (
                <optgroup key={stage} label={stage}>
                  {modules.map((module) => <option key={module.slug} value={module.slug}>{module.title} ({module.answered}/{module.total})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {selected ? (
            <header className={styles.readingHead}>
              <p className={styles.stage}>{sheetHeading(selected)}</p>
              <h3 className={styles.moduleTitle}>{selected.title}</h3>
              {selected.intro ? <p className={styles.objective}>{selected.intro}</p> : null}
            </header>
          ) : <p className={styles.note}>Elige un módulo.</p>}
          {shownPage ? <p className={styles.count}>{questionCount(shownPage.total, from, to, size)}</p> : null}
          {shownPage?.module.intro && shownPage.module.intro !== selected?.intro ? <p className={styles.objective}>{shownPage.module.intro}</p> : null}
          {selected && error ? <div className={styles.errorState} role="alert"><p>{error}</p>{onRetry ? <button type="button" className={styles.retry} onClick={onRetry}>Reintentar módulo</button> : null}</div> : null}
          {selected && !error && !shownPage ? <p className={styles.emptyState} role="status">{loading ? 'Cargando respuestas.' : 'Preparando el módulo.'}</p> : null}
          <div className={styles.stack} aria-busy={Boolean(loading)}>
            {shownPage?.items.map((item, index) => {
              const reading = presentReading(item);
              const number = (shownPage.page - 1) * size + index + 1;
              const excelCell = cellLabel(item.sourceRef);
              const ends = reading.marks && !reading.longScale ? endpointNotes(item.anchors) : [];
              return (
                <article key={item.questionId} id={`pregunta-${item.questionId}`} className={styles.question}>
                  <p className={styles.metaLine}>
                    Pregunta {number}. {questionTypeLabel(item.type)}. {answerStatusLabel(item.status)}
                    {excelCell ? `. Celda ${excelCell}` : ''}
                  </p>
                  <h4 className={reading.plainTitle ? styles.plainPrompt : styles.prompt}>{reading.title}</h4>
                  {reading.headline ? <p className={styles.savedLine}>{reading.headline}</p> : reading.lines.length > 0 ? <p className={styles.metaLine}>Respuesta guardada</p> : null}
                  {reading.lines.map((line) => <p key={line} className={styles.answerText}>{line}</p>)}
                  {reading.fields.map((field) => <p key={field.label} className={styles.note}>{field.label}: {field.value}</p>)}
                  {reading.marks ? (
                    <div className={styles.meter}>
                      {reading.marks.map((mark, markIndex) => <span key={`${mark.token}-${markIndex}`} aria-label={mark.chosen ? `${mark.token}, elegida` : mark.token} data-chosen={mark.chosen ? 'true' : undefined}>{mark.token}</span>)}
                    </div>
                  ) : null}
                  {ends.map((line) => <p key={line} className={styles.note}>{line}</p>)}
                  {reading.longScale ? (
                    <details className={styles.scale}>
                      <summary>Ver escala completa</summary>
                      <ol>
                        {reading.options.map((option) => <li key={option.label} data-chosen={option.chosen ? 'true' : undefined}>{option.chosen ? `${option.label}. Elegida` : option.label}</li>)}
                      </ol>
                    </details>
                  ) : null}
                  {reading.limitation ? <p className={styles.note}>{reading.limitation}</p> : null}
                </article>
              );
            })}
          </div>
          <div className={styles.pager}>
            {previous ? <button type="button" className={styles.retry} onClick={() => onModule(previous.slug)}>Módulo anterior</button> : null}
            {shownPage && shownPage.total > size ? <button type="button" className={styles.retry} disabled={pagina <= 1} onClick={() => onPage(pagina - 1)}>Anterior</button> : null}
            {shownPage && shownPage.total > size ? <button type="button" className={styles.retry} disabled={pagina * size >= shownPage.total} onClick={() => onPage(pagina + 1)}>Siguiente</button> : null}
            {following ? <button type="button" className={styles.retry} onClick={() => onModule(following.slug)}>Módulo siguiente</button> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function moduleGroups(modules: AdminJourney['modules']) {
  const groups = new Map<string, AdminJourney['modules']>();
  for (const module of modules) {
    const key = sheetHeading(module);
    groups.set(key, [...(groups.get(key) ?? []), module]);
  }
  return groups;
}

function questionCount(total: number, from: number, to: number, size: number): string {
  if (total === 0) return 'Sin preguntas.';
  if (total <= size) return total === 1 ? '1 pregunta' : `${total} preguntas`;
  return `Preguntas ${from} a ${to} de ${total}`;
}

function endpointNotes(anchors: { label: string; value: string }[]): string[] {
  if (anchors.length < 2) return [];
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  return [endpointNote(first), endpointNote(last)].filter((line): line is string => Boolean(line));
}

function endpointNote(anchor: { label: string; value: string }): string | null {
  const label = anchor.label.trim();
  if (!label || label === anchor.value.trim() || label.length > 42) return null;
  const token = /^\d+$/.test(anchor.value.trim()) ? anchor.value.trim() : label;
  if (label === token) return null;
  return `${token}. ${label}`;
}

function coachShadowHeading(text: string): { title: string; body: string } {
  const trimmed = text.trim();
  if (/^sin desarrollo$/i.test(trimmed)) return { title: 'Sin desarrollo', body: '' };
  const colon = trimmed.indexOf(':');
  if (colon > 0 && colon < 64) {
    return { title: trimmed.slice(0, colon).trim(), body: trimmed.slice(colon + 1).trim() };
  }
  return { title: trimmed, body: '' };
}

function PersonalityPanel({
  personality,
  overall,
}: {
  personality: Record<string, { value?: number | null; calculable?: boolean; descriptor?: string | null }>;
  overall: unknown;
}) {
  const global = typeof overall === 'number' ? overall : null;
  return (
    <section className={styles.panel}>
      <h3 className={styles.subTitle}>Factores de la personalidad (OCEAN)</h3>
      <p className={styles.note}>E-PER-007. Tres preguntas por factor, escala 1 a 5. Ítems 2, 5, 8, 11 y 14 con escala inversa.</p>
      {global != null ? (
        <p className={styles.copy}>Promedio global {formatPersonalityAverage(global)} de 5.</p>
      ) : (
        <p className={styles.note}>Promedio global pendiente hasta completar los 15 ítems.</p>
      )}
      {PERSONALITY_FACTOR_ROWS.map(({ key, title }) => {
        const part = personality[key];
        const value = part?.calculable && typeof part.value === 'number'
          ? `${formatPersonalityAverage(part.value)} de 5`
          : 'Pendiente';
        const band = part?.descriptor?.trim() ?? null;
        return (
          <div key={key}>
            <div className={styles.scoreLine}>
              <span>{title}</span>
              <span>{value}</span>
            </div>
            {band && part?.calculable ? <p className={styles.note}>{band}</p> : null}
          </div>
        );
      })}
    </section>
  );
}

function ShadowDiagnosticPanel({ profile }: { profile: Record<string, unknown> }) {
  const coach = typeof profile.shadowDiagnosticCoach === 'string' ? profile.shadowDiagnosticCoach.trim() : '';
  const interference = typeof profile.shadowInterferenceTotal === 'number' ? profile.shadowInterferenceTotal : null;
  const integration = typeof profile.shadowIntegrationTotal === 'number' ? profile.shadowIntegrationTotal : null;
  if (!coach) {
    return (
      <section className={styles.panel}>
        <h3 className={styles.subTitle}>Diagnóstico sombra (coach)</h3>
        <p className={styles.note}>Pendiente. Hace falta cerrar los cinco bloques PR, ER, PY, D e IN.</p>
      </section>
    );
  }
  const reading = coachShadowHeading(coach);
  const totals = interference != null && integration != null
    ? `${shadowTotalsCopy(interference, integration)} Referencia hoja: G177 ${interference}, F177 ${integration}.`
    : null;
  return (
    <section className={styles.panel}>
      <h3 className={styles.subTitle}>Diagnóstico sombra (coach)</h3>
      {totals ? <p className={styles.note}>{totals}</p> : null}
      <p className={styles.copy}><strong>{reading.title}</strong></p>
      {reading.body ? <p className={styles.copy}>{reading.body}</p> : null}
    </section>
  );
}

function Profile({ journey }: { journey: AdminJourney }) {
  const profile = journey.profile ?? {};
  const difficulties = (profile.difficulties ?? {}) as Record<string, { value?: number | null; calculable?: boolean; descriptor?: string | null }>;
  const personality = (profile.personality ?? {}) as Record<string, { value?: number | null; calculable?: boolean; descriptor?: string | null }>;
  const known = new Set(DIFFICULTY.map(([key]) => key));
  const unknown = Object.keys(difficulties).filter((key) => !known.has(key)).sort();
  const readings = profileReadings(profile);
  return (
    <div className={styles.dashboard}>
      <header className={styles.sectionHead}><h2 className={styles.viewTitle}>Perfil e índices</h2><span className={styles.badge}>Lecturas guardadas</span></header>
      <section className={styles.panel}>
      <h3 className={styles.subTitle}>Índice de alineación MK</h3>
      {journey.alignment.length === 0 ? <p className={styles.note}>No hay una lectura guardada.</p> : journey.alignment.map((row) => <ReadingCard key={row.id} row={row} />)}
      </section><section className={styles.panel}>
      <h3 className={styles.subTitle}>Diagnósticos del cuestionario</h3>
      <p className={styles.note}>Totales parciales y bandas según las hojas E-AUD-001, F-RAD-002 y evaluación cuantitativa.</p>
      <div className={styles.scoreList}>
        {readings.map((row) => (
          <div key={row.label}>
            <div className={styles.scoreLine}>
              <span>{row.label}</span>
              <span>{row.figure}</span>
            </div>
            {row.note ? <p className={styles.note}>{row.note}</p> : null}
          </div>
        ))}
      </div>
      </section><div className={styles.overviewGrid}><section className={styles.panel}>
      <h3 className={styles.subTitle}>{SHADOW_BLOCK_COPY.interferenceTitle}</h3>
      <p className={styles.note}>{SHADOW_BLOCK_COPY.interferenceNote}</p>
      <div className={styles.scoreList}>
        {DIFFICULTY.filter(([, , kind]) => kind === 'interferencia').map(([key, label]) => (
          <Difficulty key={key} label={label} part={difficulties[key]} kind="interferencia" />
        ))}
      </div>
      </section><section className={styles.panel}>
      <h3 className={styles.subTitle}>{SHADOW_BLOCK_COPY.integrationTitle}</h3>
      <p className={styles.note}>{SHADOW_BLOCK_COPY.integrationNote}</p>
      <Difficulty label={SHADOW_BLOCK_COPY.integrationRowLabel} part={difficulties.IN} kind="recurso" />
      {unknown.map((key) => <Difficulty key={key} label={key} part={difficulties[key]} kind="interferencia" />)}
      </section></div>
      <ShadowDiagnosticPanel profile={profile} />
      <PersonalityPanel personality={personality} overall={profile.personalityOverall} />
      <section className={styles.panel}>
      <h3 className={styles.subTitle}>Alineación declarada</h3>
      {journey.declared && journey.declared.status !== 'none' ? (
        <p className={styles.copy}>{journey.declared.status === 'partial' ? 'Parcial' : 'Guardada'}. Total {shown(journey.declared.total)}. Cobertura {journey.declared.coverage.answered} de {journey.declared.coverage.required}. Revisión {journey.declared.revision ?? 'No disponible'}.</p>
      ) : <p className={styles.note}>No hay ficha declarada. El índice de arriba no la reemplaza.</p>}
      </section>
    </div>
  );
}

function ReadingCard({ row }: { row: AdminJourney['alignment'][number] }) {
  const output = row.output as { general?: number | null; pillars?: { ESPIRITU?: number | null; MENTE?: number | null; CUERPO?: number | null }; coverage?: { eligible?: number; scored?: number; required?: number } };
  const shownGeneral = shown(output.general);
  const covered = output.coverage?.eligible ?? output.coverage?.scored;
  return (
    <article className={styles.readingCard}>
      <p className={styles.metaLine}>{kindLabel(row.kind)}. {formatAlignmentDate(row.computedAt)}.</p>
      <div className={styles.indexGrid}>
        <div className={styles.general}><span className={styles.label}>General</span><p className={styles.figure}>{shownGeneral}</p></div>
        <dl className={styles.pillars}>
          <Pair label="Espíritu" value={shown(output.pillars?.ESPIRITU)} />
          <Pair label="Mente" value={shown(output.pillars?.MENTE)} />
          <Pair label="Cuerpo" value={shown(output.pillars?.CUERPO)} />
        </dl>
      </div>
      <p className={styles.note}>Cobertura {covered ?? 'No disponible'} de {output.coverage?.required ?? 'No disponible'}.</p>
      <details className={styles.scale}>
        <summary>Detalle de la lectura</summary>
        <p className={styles.note}>{formatMethodVersionLabel(row.methodVersion)}.</p>
      </details>
    </article>
  );
}

function Purpose({ journey, apartado, onApartado }: { journey: AdminJourney; apartado: Apartado; onApartado: (apartado: Apartado) => void }) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.viewTitle}>Propósito y hoja</h2>
      <div className={`${styles.tabs} ${styles.subTabs}`} role="tablist" aria-label="Apartado" onKeyDown={(event) => moveTab(event, apartado, Object.keys(APARTADO_LABEL) as Apartado[], onApartado)}>
        {(Object.keys(APARTADO_LABEL) as Apartado[]).map((item) => (
          <button key={item} type="button" className={styles.subTab} role="tab" id={`proposito-tab-${item}`} aria-controls="proposito-panel" tabIndex={apartado === item ? 0 : -1} aria-selected={apartado === item} onClick={() => onApartado(item)}>{APARTADO_LABEL[item]}</button>
        ))}
      </div>
      <div className={`${styles.field} ${styles.viewSelect}`}>
        <label className={styles.label} htmlFor="apartado-select">Apartado</label>
        <select id="apartado-select" className={styles.select} value={apartado} onChange={(event) => onApartado(apartadoFrom(event.target.value))}>
          {(Object.keys(APARTADO_LABEL) as Apartado[]).map((item) => <option key={item} value={item}>{APARTADO_LABEL[item]}</option>)}
        </select>
      </div>
      <div id="proposito-panel" role="tabpanel" aria-labelledby={`proposito-tab-${apartado}`} className={styles.purposeBody}>
      {apartado === 'direccion' ? (
        <div>
          <p className={styles.copy}>Dirección: {directionLabel(journey.direction?.status)}. Revisión {journey.direction?.revision ?? 'No disponible'}.</p>
          {journey.direction?.statement ? <p className={styles.answer}>{journey.direction.statement}</p> : <p className={styles.note}>Sin formulación guardada.</p>}
          {journey.draftIsLater ? <p className={styles.note}>Hay un borrador posterior. No reemplaza lo firmado.</p> : null}
        </div>
      ) : null}
      {apartado === 'actividades' ? (
        <div className={styles.activityGroups}>
          {journey.ikigai.activities.length === 0 ? <p className={styles.note}>Sin actividades en esta sesión.</p> : null}
          {[...activityGroups(journey.ikigai.activities).entries()].map(([field, items]) => (
            <section key={field} className={styles.activityGroup}>
              <h3 className={styles.subTitle}>{field}</h3>
              <div className={styles.stack}>
                {items.map((shown, index) => (
                  <article key={`${shown.answer}-${index}`} className={styles.activity}>
                    <p className={styles.answerText}>{shown.answer}</p>
                    {shown.ambit && shown.ambit !== 'Sin ámbito' ? <p className={styles.note}>Ámbito: {shown.ambit}</p> : null}
                    {shown.option && shown.option !== 'Sin opción' ? <p className={styles.note}>Opción: {shown.option}</p> : null}
                    {shown.raw ? <p className={styles.note}>Registro original: {shown.raw}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      {apartado === 'cruce' ? <Cruce synthesis={journey.ikigai.synthesis} activities={journey.ikigai.activities} experiments={journey.ikigai.experiments} /> : null}
      {apartado === 'hoja' ? <Sheet journey={journey} /> : null}
      </div>
    </div>
  );
}

function Cruce({
  synthesis,
  activities,
  experiments,
}: {
  synthesis: unknown;
  activities: AdminJourney['ikigai']['activities'];
  experiments: AdminJourney['ikigai']['experiments'];
}) {
  const cross = presentCrossReading(
    synthesis,
    activities.map((item) => ({ sourceRef: item.sourceRef, answer: item.answer })),
  );
  const hasCrosses = cross.combinations.some((combo) => combo.links.length > 0) || cross.orphanLinks.length > 0;
  return (
    <div className={styles.stack}>
      {!hasCrosses && cross.combinations.length === 0 ? (
        <p className={styles.note}>Sin cruces guardados. La persona aún no enlazó actividades entre columnas.</p>
      ) : null}
      {cross.purposeDraft ? (
        <section className={styles.panel}>
          <h3 className={styles.subTitle}>Borrador de propósito</h3>
          <p className={styles.answerText}>{cross.purposeDraft}</p>
        </section>
      ) : null}
      {cross.combinations.map((combo) => (
        <article key={combo.id} className={styles.activity}>
          <h3 className={styles.subTitle}>{combo.title}</h3>
          {combo.links.length === 0 ? <p className={styles.note}>Sin enlaces en esta combinación.</p> : (
            <ul className={styles.crossLinks}>
              {combo.links.map((link) => (
                <li key={link.id} className={styles.crossLink}>
                  <p className={styles.answerText}>{link.from} con {link.to}</p>
                  <p className={styles.metaLine}>{link.statusLabel}{link.reason ? `. ${link.reason}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
          {combo.reason ? <p className={styles.copy}>Motivo de la combinación. {combo.reason}</p> : null}
          {combo.valuation ? <p className={styles.copy}>Valoración. {valuationLabel(combo.valuation)}</p> : null}
          {combo.valuationReason ? <p className={styles.copy}>Razón de la valoración. {combo.valuationReason}</p> : null}
          {combo.fieldStance.map((row) => (
            <p key={row.field} className={styles.copy}>{row.label}. {row.stance}</p>
          ))}
          {combo.unknownNote ? <p className={styles.copy}>Qué falta por saber. {combo.unknownNote}</p> : null}
          {combo.learningQuestion ? <p className={styles.copy}>Pregunta de aprendizaje. {combo.learningQuestion}</p> : null}
          {combo.experiment ? <p className={styles.copy}>Experimento propuesto. {combo.experiment}</p> : null}
          {combo.observed ? <p className={styles.copy}>Observado. {combo.observed}</p> : null}
        </article>
      ))}
      {cross.orphanLinks.length > 0 ? (
        <section className={styles.panel}>
          <h3 className={styles.subTitle}>Enlaces sin combinación</h3>
          <ul className={styles.crossLinks}>
            {cross.orphanLinks.map((link) => (
              <li key={link.id} className={styles.crossLink}>
                <p className={styles.answerText}>{link.from} con {link.to}</p>
                <p className={styles.metaLine}>{link.statusLabel}{link.reason ? `. ${link.reason}` : ''}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <h3 className={styles.subTitle}>Evidencia del experimento</h3>
      {experiments.length === 0 ? <p className={styles.note}>Sin registro de experimento en el plan.</p> : experiments.map((item) => (
        <article key={item.id} className={styles.activity}>
          <p className={styles.copy}>Estado. {item.status}</p>
          <p className={styles.copy}>Hipótesis. {item.hypothesis ?? 'Sin hipótesis.'}</p>
          {item.sample ? <p className={styles.copy}>Muestra. {item.sample}</p> : null}
          {item.opportunity ? <p className={styles.copy}>Oportunidad. {item.opportunity}</p> : null}
          {item.missing ? <p className={styles.copy}>Falta. {item.missing}</p> : null}
        </article>
      ))}
    </div>
  );
}

function Sheet({ journey }: { journey: AdminJourney }) {
  return (
    <div className={styles.stack}>
      {journey.draftIsLater ? <p className={styles.note}>Hay un borrador posterior. No reemplaza lo firmado.</p> : null}
      {journey.signed ? (
        <div>
          <h3 className={styles.subTitle}>Versión firmada</h3>
          <p className={styles.note}>Revisión {journey.signed.revision}. {journey.signed.confirmedAt ? formatAlignmentDate(journey.signed.confirmedAt) : 'Sin fecha'}. {journey.signed.name ?? 'Sin nombre'}.</p>
          <Contract view={journey.signed.contractView} text={journey.signed.contract} name={journey.signed.name} confirmedAt={journey.signed.confirmedAt} />
        </div>
      ) : <p className={styles.note}>Sin firma.</p>}
      {journey.draftIsLater && journey.direction?.statement ? (
        <div>
          <h3 className={styles.subTitle}>Borrador posterior</h3>
          <p className={styles.answer}>{journey.direction.statement}</p>
        </div>
      ) : null}
    </div>
  );
}

const MANIFESTO = 'La exploración de su historia, su mente y sus aspiraciones';

function withoutManifesto(text: string): string {
  return text
    .split(/\n+/)
    .filter((line) => !line.includes(MANIFESTO))
    .join('\n')
    .trim();
}

function Contract({ view, text, name, confirmedAt }: { view: unknown; text: string | null; name: string | null; confirmedAt: string | null }) {
  const stored = view && typeof view === 'object' ? view as Record<string, unknown> : null;
  const articles = Array.isArray(stored?.articles)
    ? (stored.articles as { title?: string; items?: SheetItem[] }[]).map((article) => ({
      title: article.title ?? '',
      items: (article.items ?? []).map((item) => ({
        label: item.label ?? '',
        text: item.text ?? '',
        category: item.category,
        descriptor: item.descriptor,
        commitment: item.commitment,
        kind: item.kind,
      })),
    }))
    : null;
  if (!articles) return <p className={sheetStyles.copy}>{withoutManifesto(text ?? '') || 'Sin texto firmado.'}</p>;
  const who = name?.trim() || '';
  const lead = typeof stored?.lead === 'string' && !stored.lead.includes(MANIFESTO) ? stored.lead : '';
  const opening = lead || `Yo, ${who}, consciente de mi historia, dueño de mi presente y arquitecto de mi destino, declaro solemnemente los pilares que rigen y regirán mi existencia a partir de este momento.`;
  const closing = typeof stored?.closing === 'string' ? stored.closing : '';
  const ratification = SHEET_ANCHORS.find((link) => link.href === '#ratificacion');
  return (
    <div className={sheetStyles.page}>
      <article className={sheetStyles.sheet}>
        <header className={sheetStyles.mast}>
          <h3 className={sheetStyles.title}>Hoja de ruta de propósito</h3>
          <p className={sheetStyles.subtitle}>Contrato de compromiso soberano y propósito de vida</p>
        </header>
        <nav className={sheetStyles.toc} aria-label="Contenido">
          {SHEET_ANCHORS.map((link) => (
            <a key={link.href} href={link.href}>
              <AppIcon name={link.icon} size={16} />
              {link.label}
            </a>
          ))}
        </nav>
        <p className={sheetStyles.opening}>{opening}</p>
        <ContractSections articles={articles} />
        <section id="ratificacion" className={sheetStyles.chapter}>
          <h4 className={sheetStyles.chapterTitle}>
            {ratification ? <AppIcon name={ratification.icon} size={22} /> : null}
            <span>Ratificación del compromiso</span>
          </h4>
          {closing ? <p className={sheetStyles.copy}>{closing}</p> : null}
          <div className={sheetStyles.metadata}>
            <p className={sheetStyles.meta}>Fecha: {confirmedAt ? formatAlignmentDate(confirmedAt) : 'Sin fecha'}</p>
            <p className={sheetStyles.meta}>{who ? `Firmado por ${who}.` : 'Sin nombre.'}</p>
          </div>
        </section>
      </article>
    </div>
  );
}

function Alerts({ journey }: { journey: AdminJourney }) {
  const rules = journey.rules ?? [];
  const fired = rules.filter((rule) => rule.status === 'FIRED');
  const clear = rules.filter((rule) => rule.status === 'NOT_FIRED');
  return (
    <div className={styles.dashboard}>
      <header className={styles.sectionHead}>
        <div>
          <h2 className={styles.viewTitle}>Alertas de auditoría</h2>
          <p className={styles.note}>Qué respuestas cumplen la condición de alerta en el cuestionario actual. Solo administración.</p>
        </div>
        <a href="/admin/alertas" className={styles.retry}>Historial registrado</a>
      </header>
      {rules.length === 0 ? <p className={styles.emptyState}>No hay respuestas de auditoría evaluadas en el cuestionario.</p> : <>
        <div className={styles.alertSummary}>
          <span><strong>{fired.length}</strong> alertas gatilladas</span>
          <span><strong>{clear.length}</strong> evaluadas sin alerta</span>
          <span><strong>{rules.length}</strong> preguntas revisadas</span>
        </div>
        {fired.length === 0 ? <p className={styles.emptyState}>Ninguna alerta se gatilló con las respuestas guardadas.</p> : (
          <section className={styles.stack} aria-label="Alertas gatilladas">
            <h3 className={styles.subTitle}>Gatilladas ahora</h3>
            {fired.map((rule) => <RuleCard key={rule.questionRef} rule={rule} modules={journey.modules} tone="fired" />)}
          </section>
        )}
        {clear.length > 0 ? (
          <details className={`${styles.panel} ${styles.scale}`}>
            <summary>Ver {clear.length} preguntas evaluadas sin alerta</summary>
            <div className={styles.stack}>{clear.map((rule) => <RuleCard key={rule.questionRef} rule={rule} modules={journey.modules} tone="clear" />)}</div>
          </details>
        ) : null}
      </>}
      <p className={styles.note}>Esta pantalla no registra ni cierra alertas. Para ocurrencias guardadas y procedencia, usa el historial registrado.</p>
    </div>
  );
}

function RuleCard({
  rule,
  modules,
  tone,
}: {
  rule: AdminJourney['rules'][number];
  modules: AdminJourney['modules'];
  tone: 'fired' | 'clear';
}) {
  const context = alertModuleContext(rule.moduleSlug, modules);
  const condition = alertRuleConditionLabel(rule.rule);
  const answer = rule.value?.trim() || 'Sin respuesta guardada';
  return (
    <article id={`pregunta-${rule.questionId ?? rule.questionRef}`} className={tone === 'fired' ? styles.fired : styles.clear}>
      <div className={styles.alertCardHead}>
        <span className={tone === 'fired' ? styles.badgeAlert : styles.badgeMuted}>
          {tone === 'fired' ? 'Alerta gatillada' : 'Sin alerta'}
        </span>
        {context ? <p className={styles.note}>{context}</p> : null}
      </div>
      <h4 className={styles.prompt}>{questionStem(rule.text, rule.questionRef)}</h4>
      <dl className={styles.alertFacts}>
        <div>
          <dt>Respuesta guardada</dt>
          <dd className={styles.answerText}>{answer}</dd>
        </div>
        <div>
          <dt>Condición</dt>
          <dd>{condition}</dd>
        </div>
        <div>
          <dt>Resultado</dt>
          <dd>{tone === 'fired' ? 'La respuesta cumple la condición.' : 'La respuesta no cumple la condición.'}</dd>
        </div>
      </dl>
    </article>
  );
}

function activityGroups(activities: AdminJourney['ikigai']['activities']) {
  const groups = new Map<string, ReturnType<typeof presentActivity>[]>();
  for (const activity of activities) {
    const shown = presentActivity(activity);
    groups.set(shown.field, [...(groups.get(shown.field) ?? []), shown]);
  }
  return groups;
}

function personalityText(name: string, descriptor?: string | null): string | null {
  const text = descriptor?.trim();
  if (!text) return null;
  const prefix = `${name}:`;
  if (!text.startsWith(prefix)) return text;
  const rest = text.slice(prefix.length).trim();
  if (!rest) return text;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

function profileReadings(profile: Record<string, unknown>): Array<{ label: string; figure: string; note: string | null }> {
  const text = (key: string) => typeof profile[key] === 'string' && profile[key] ? profile[key] as string : null;
  const num = (key: string) => typeof profile[key] === 'number' ? profile[key] as number : null;
  const coverage = profile.auditCoverage as { answered?: number; required?: number } | null;
  const coverageNote = coverage && typeof coverage.answered === 'number' && typeof coverage.required === 'number'
    ? `${coverage.answered} de ${coverage.required} ítems`
    : null;
  const auditTotal = num('auditTotal');
  const auditPartial = num('auditPartial');
  const auditFigure = auditTotal != null
    ? `${auditTotal} de ${num('auditMax') ?? 115}`
    : auditPartial != null
      ? `${auditPartial} de ${num('auditMax') ?? 115}, parcial${coverageNote ? `. ${coverageNote}` : ''}`
      : (coverageNote ? `Pendiente. ${coverageNote}` : 'No disponible');
  const auditNote = text('auditDiagnostic') ?? text('auditNote') ?? (text('auditBand') ? bandLabel(text('auditBand') as string) : null);
  const relationTotal = num('relationTotal');
  const relationPartial = num('relationPartial');
  const relationNote = text('relationNote');
  const partnerOut = Boolean(relationNote) && relationTotal == null && relationPartial == null;
  const relationPending = profile.relationBandPending === true && relationPartial == null;
  const relationFigure = partnerOut
    ? 'No se calcula'
    : relationTotal != null
      ? `${relationTotal} de 60`
      : relationPartial != null
        ? `${relationPartial} de 60, parcial`
        : relationPending
          ? 'No disponible'
          : 'No disponible';
  const relationShown = partnerOut
    ? relationNote
    : text('relationDiagnostic')
      ?? (relationPending ? 'Banda pendiente' : text('relationBand') ? bandLabel(text('relationBand') as string) : null);
  const financeTotal = num('financeTotal');
  const financePartial = num('financePartial');
  const financeFigure = financeTotal != null
    ? `${financeTotal} de 60`
    : financePartial != null
      ? `${financePartial} de 60, parcial`
      : 'No disponible';
  const financeNote = text('financeDiagnostic') ?? (text('financeBand') ? bandLabel(text('financeBand') as string) : null);
  const identityTotal = num('identityTotal');
  const senseTotal = num('senseTotal');
  return [
    { label: 'E-AUD-001', figure: auditFigure, note: auditNote },
    { label: 'F-RAD-002', figure: relationFigure, note: relationShown },
    { label: 'Evaluación cuantitativa', figure: financeFigure, note: financeNote },
    { label: 'Identidad', figure: identityTotal == null ? 'No disponible' : `${identityTotal} de ${num('identityMax') ?? 40}`, note: text('identityNote') },
    { label: 'Desarrollo y sentido', figure: senseTotal == null ? 'No disponible' : `${senseTotal} de 50`, note: senseTotal == null ? null : 'Lectura aparte de la auditoría' },
  ];
}

function bandLabel(band: string): string {
  const known: Record<string, string> = {
    SOLIDO: 'Sólido',
    'SÓLIDO': 'Sólido',
    DOMINANTE: 'Dominante',
    INESTABLE: 'Inestable',
    CRITICO: 'Crítico',
    'CRÍTICO': 'Crítico',
    ALERTA: 'Calibración',
    OPTIMO: 'Óptimo',
    'ÓPTIMO': 'Óptimo',
    DETRIMENTO: 'Detrimento',
    PROPULSOR: 'Propulsor',
  };
  return known[band] ?? band;
}

function Difficulty({
  label,
  part,
  kind,
}: {
  label: string;
  part?: { value?: number | null; calculable?: boolean };
  kind: DifficultyKind;
}) {
  return (
    <div>
      <div className={styles.scoreLine}>
        <span>{label}</span>
        <span>{part?.calculable && part.value != null ? `${part.value} de 18` : 'Pendiente'}</span>
      </div>
      {part?.calculable && part.value != null ? (
        <p className={styles.note}>{difficultyLevel(part.value, kind)}</p>
      ) : null}
    </div>
  );
}

function Pair({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div className={styles.pair}>
      <dt className={styles.label}>{label}</dt>
      <dd><span>{value}</span>{note ? <p className={styles.note}>{note}</p> : null}</dd>
    </div>
  );
}

function shown(value: number | null | undefined): string {
  if (typeof value !== 'number') return 'No disponible';
  return formatAlignmentValue(value);
}

function valuationLabel(value: string): string {
  if (value === 'RECOGNIZED') return 'Reconocido';
  if (value === 'PARTIAL') return 'Parcial';
  if (value === 'NOT_RECOGNIZED') return 'No reconocido';
  if (value === 'INSUFFICIENT') return 'Insuficiente';
  return value;
}

function stanceLabel(value: string): string {
  if (value === 'RECOGNIZE') return 'Lo reconoce';
  if (value === 'DOUBT') return 'Lo duda';
  if (value === 'UNKNOWN') return 'Sin información';
  return value;
}

function moveTab<T extends string>(event: KeyboardEvent<HTMLElement>, selected: T, order: T[], onSelect: (value: T) => void) {
  const index = order.indexOf(selected);
  const next = event.key === 'ArrowRight' ? (index + 1) % order.length
    : event.key === 'ArrowLeft' ? (index - 1 + order.length) % order.length
    : event.key === 'Home' ? 0 : event.key === 'End' ? order.length - 1 : null;
  if (next == null) return;
  event.preventDefault();
  onSelect(order[next]);
  event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
}
