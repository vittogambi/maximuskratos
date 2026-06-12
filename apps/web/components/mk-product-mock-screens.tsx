function MkSegmentProgress({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="mk-mock-segments" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`mk-mock-segments__cell${i < filled ? ' is-filled' : ''}`} />
      ))}
    </div>
  );
}

export function MkProfileProgress({ label, filled, total = 5 }: { label: string; filled: number; total?: number }) {
  return (
    <div className="mk-mock-profile-progress">
      <span className="mk-mock-profile-progress__label">{label}</span>
      <MkSegmentProgress filled={filled} total={total} />
    </div>
  );
}

export function MkRadarChart() {
  const points = '50,8 78,28 72,58 48,68 22,52';
  const grid = [0.35, 0.55, 0.75, 1];

  return (
    <svg className="mk-mock-radar" viewBox="0 0 100 80" aria-hidden>
      {grid.map((scale) => (
        <polygon
          key={scale}
          points={points}
          transform={`translate(50 40) scale(${scale}) translate(-50 -40)`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.6"
        />
      ))}
      <polygon points={points} fill="rgba(192,1,0,0.22)" stroke="#c00100" strokeWidth="1.2" />
      {[
        [50, 8],
        [78, 28],
        [72, 58],
        [48, 68],
        [22, 52],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.8" fill="#c00100" />
      ))}
    </svg>
  );
}

export function MkRealmSidebar({ activeRealm = 'espiritu' }: { activeRealm?: 'espiritu' | 'mente' | 'fisico' }) {
  const espirituItems = ['Visión', 'Valores', 'Estándares', 'La Sombra', 'Ikigai', 'Huella Personal'];

  return (
    <nav className="mk-mock-realms" aria-hidden>
      <p className="mk-mock-realms__menu">Menú</p>
      <div className={`mk-mock-realms__group${activeRealm === 'espiritu' ? ' is-active' : ''}`}>
        <p className="mk-mock-realms__realm">
          <span className="mk-mock-realms__icon">◆</span> Espíritu
        </p>
        {activeRealm === 'espiritu' ? (
          <ul className="mk-mock-realms__sub">
            {espirituItems.map((item, i) => (
              <li key={item} className={i === 0 ? 'is-active' : undefined}>
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className={`mk-mock-realms__realm${activeRealm === 'mente' ? ' is-active' : ''}`}>
        <span className="mk-mock-realms__icon">◆</span> Mente
      </p>
      <p className={`mk-mock-realms__realm${activeRealm === 'fisico' ? ' is-active' : ''}`}>
        <span className="mk-mock-realms__icon">◆</span> Físico
      </p>
    </nav>
  );
}

export function MkDiagnosticoScreen() {
  return (
    <div className="mk-mock-diagnostico">
      <div className="mk-mock-diagnostico__card">
        <div className="mk-mock-diagnostico__head">
          <span className="mk-mock-diagnostico__title">Visión</span>
          <MkProfileProgress label="Avance de diagnóstico 68%" filled={3} />
        </div>
        <p className="mk-mock-diagnostico__section">Sección 1 · Mentalidad e Identidad</p>
        <p className="mk-mock-diagnostico__question">
          ¿Mis decisiones diarias reflejan al hombre que digo que quiero llegar a ser?
        </p>
        <ul className="mk-mock-diagnostico__options">
          <li>Casi nunca</li>
          <li>A veces</li>
          <li className="is-selected">Casi siempre</li>
        </ul>
        <div className="mk-mock-diagnostico__foot">
          <span className="mk-mock-diagnostico__pager" aria-hidden>
            <span />
            <span />
            <span className="is-active" />
            <span />
            <span />
          </span>
          <span className="mk-mock-diagnostico__accept">Aceptar</span>
        </div>
      </div>
    </div>
  );
}

export function MkBlueprintScreen() {
  return (
    <div className="mk-mock-blueprint">
      <div className="mk-mock-blueprint__grid">
        <article className="mk-mock-tile">
          <MkProfileProgress label="Visión 100%" filled={5} />
          <p className="mk-mock-tile__quote">Lo que desearía ser en 5 años es…</p>
          <p className="mk-mock-tile__value">Un médico profesional</p>
        </article>

        <article className="mk-mock-tile">
          <MkProfileProgress label="Valores 50%" filled={2} />
          <div className="mk-mock-tags">
            <span>Determinación</span>
            <span>Responsabilidad</span>
            <span>Valentía</span>
          </div>
        </article>

        <article className="mk-mock-tile mk-mock-tile--radar">
          <MkProfileProgress label="La Sombra 80%" filled={4} />
          <div className="mk-mock-tile__split">
            <ul className="mk-mock-shadow-list">
              <li>A. 90% Patrones</li>
              <li>B. 70% Emociones</li>
              <li>C. 80% Proyección</li>
            </ul>
            <MkRadarChart />
          </div>
        </article>

        <article className="mk-mock-tile mk-mock-tile--accent">
          <MkProfileProgress label="Huella Personal 0%" filled={0} />
          <p className="mk-mock-tile__banner">
            Yo, [Nombre], he venido al mundo para dejar sello en quienes toco.
          </p>
        </article>
      </div>
    </div>
  );
}

export function MkEjecucionScreen() {
  return (
    <div className="mk-mock-ejecucion">
      <div className="mk-mock-ejecucion__head">
        <MkProfileProgress label="Estándares 42%" filled={2} />
        <span className="mk-mock-ejecucion__streak">Racha · 12 días</span>
      </div>
      <div className="mk-mock-ejecucion__grid">
        <div className="mk-mock-mini">
          <span>Mis Valores</span>
          <strong>Determinación</strong>
        </div>
        <div className="mk-mock-mini">
          <span>Mis Acciones</span>
          <strong>3 hoy</strong>
        </div>
        <div className="mk-mock-mini">
          <span>Mis Hábitos</span>
          <strong>5 activos</strong>
        </div>
        <div className="mk-mock-mini">
          <span>5 Reglas</span>
          <strong>2 cumplidas</strong>
        </div>
      </div>
      <ul className="mk-mock-diagnostico__options mk-mock-ejecucion__missions">
        <li className="is-selected">Revisión matutina · Espíritu</li>
        <li>Bloque de enfoque · 90 min</li>
        <li>Entrenamiento · Cuerpo</li>
      </ul>
    </div>
  );
}

export function MkOverviewScreen() {
  return (
    <div className="mk-mock-overview">
      <div className="mk-mock-overview__head">
        <MkProfileProgress label="Avance de perfil 68%" filled={3} />
        <span className="mk-mock-overview__index">Índice 78%</span>
      </div>
      <div className="mk-mock-blueprint mk-mock-blueprint--compact">
        <div className="mk-mock-blueprint__grid">
          <article className="mk-mock-tile">
            <MkProfileProgress label="Visión" filled={5} />
            <p className="mk-mock-tile__value">Arquetipo Rey</p>
          </article>
          <article className="mk-mock-tile mk-mock-tile--radar">
            <MkProfileProgress label="La Sombra" filled={4} />
            <MkRadarChart />
          </article>
          <article className="mk-mock-tile mk-mock-tile--accent">
            <p className="mk-mock-tile__banner">Plano de Vida activo</p>
          </article>
          <article className="mk-mock-tile">
            <MkProfileProgress label="Misiones hoy" filled={2} />
            <p className="mk-mock-tile__value">3 pendientes</p>
          </article>
        </div>
      </div>
    </div>
  );
}
