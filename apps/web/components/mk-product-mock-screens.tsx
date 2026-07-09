import { AppIcon } from '@/components/app-icon';
import { ARCHETYPES } from '@/lib/archetypes';

const REY = ARCHETYPES.rey;

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

function MkArchetypeBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mk-mock-archetype-banner${compact ? ' mk-mock-archetype-banner--compact' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={REY.image}
        alt=""
        className="mk-mock-archetype-banner__img"
        decoding="async"
      />
      <div className="mk-mock-archetype-banner__copy">
        <p className="mk-mock-archetype-banner__roman">{REY.roman.split(' · ')[0]}</p>
        <p className="mk-mock-archetype-banner__name">{REY.label}</p>
        <p className="mk-mock-archetype-banner__tagline">{REY.tagline}</p>
      </div>
    </div>
  );
}

// ── Diagnóstico — matches the real chrome-less /diagnostico question flow ────

const DIAGNOSTICO_SCALE_OPTIONS = [
  { order: 1, text: 'Una historia de víctima o resignación.' },
  { order: 3, text: 'Una historia mixta; a veces asumo responsabilidad, a veces culpo al contexto.' },
  { order: 5, text: 'Una historia de responsabilidad, crecimiento y dominio personal.' },
] as const;

export function MkDiagnosticoScreen() {
  return (
    <div className="mk-mock-diagnostico">
      <div className="mk-mock-diagnostico__rail">
        <div className="mk-mock-diagnostico__rail-info">
          <span>Mentalidad e Identidad</span>
          <span>6 / 6</span>
        </div>
        <div className="mk-mock-diagnostico__rail-track">
          <div className="mk-mock-diagnostico__rail-fill" style={{ width: '24%' }} />
        </div>
      </div>
      <p className="mk-mock-diagnostico__badge">
        <AppIcon name="brain" size={8} />
        Mentalidad e Identidad
      </p>
      <p className="mk-mock-diagnostico__question">
        ¿Qué historia me cuento a mí mismo cuando las cosas se ponen difíciles?
      </p>
      <p className="mk-mock-diagnostico__context">
        Cuando todo se complica, ¿qué historia te cuentas: de víctima o de responsable?
      </p>
      <ul className="mk-mock-diagnostico__options">
        {DIAGNOSTICO_SCALE_OPTIONS.map((opt) => (
          <li key={opt.order} className={opt.order === 5 ? 'is-selected' : undefined}>
            <span className="mk-mock-diagnostico__option-num">{opt.order}</span>
            <span className="mk-mock-diagnostico__option-text">{opt.text}</span>
            <span className="mk-mock-diagnostico__option-check" aria-hidden>
              ✓
            </span>
          </li>
        ))}
      </ul>
      <div className="mk-mock-diagnostico__cta">Continuar →</div>
      <p className="mk-mock-diagnostico__exit">Guardar y salir</p>
    </div>
  );
}

// ── Inicio — matches the real /panel archetype-ready state ───────────────────

export function MkOverviewScreen() {
  return (
    <div className="mk-mock-overview">
      <p className="mk-mock-eyebrow">TU ARQUETIPO</p>
      <MkArchetypeBanner />
      <div className="mk-app-ui__stats">
        <article className="mk-app-ui__stat mk-app-ui__stat--accent">
          <p className="mk-app-ui__stat-label">Global MK</p>
          <p className="mk-app-ui__stat-value">78</p>
        </article>
        <article className="mk-app-ui__stat">
          <p className="mk-app-ui__stat-label">Claridad</p>
          <p className="mk-app-ui__stat-value">74</p>
        </article>
        <article className="mk-app-ui__stat">
          <p className="mk-app-ui__stat-label">Ejecución</p>
          <p className="mk-app-ui__stat-value">61</p>
        </article>
        <article className="mk-app-ui__stat">
          <p className="mk-app-ui__stat-label">Estabilidad</p>
          <p className="mk-app-ui__stat-value">68</p>
        </article>
      </div>
      <p className="mk-mock-cta">Ver mi perfil completo →</p>
    </div>
  );
}

// ── Ruta MK — matches the real /ruta system of sequential auditorías ─────────

const RUTA_MODULES = [
  { icon: 'brain', name: 'Mentalidad e Identidad', status: '✓' },
  { icon: 'activity', name: 'Hábitos y Acciones', status: '62%' },
  { icon: 'target', name: 'Soberanía Financiera', status: '—' },
] as const;

export function MkRutaScreen() {
  return (
    <div className="mk-mock-ruta">
      <p className="mk-mock-eyebrow">SISTEMA DE AUDITORÍAS</p>
      <div className="mk-mock-ruta-card">
        <div className="mk-mock-ruta-card__head">
          <div>
            <p className="mk-mock-ruta-card__id">E-AUD-001</p>
            <p className="mk-mock-ruta-card__name">Auditoría Inicial</p>
          </div>
          <span className="mk-mock-ruta-card__badge">En progreso</span>
        </div>
        <ul className="mk-mock-ruta-card__modules">
          {RUTA_MODULES.map((mod) => (
            <li key={mod.name}>
              <AppIcon name={mod.icon} size={8} />
              <span>{mod.name}</span>
              <span>{mod.status}</span>
            </li>
          ))}
        </ul>
        <div className="mk-mock-ruta-card__track">
          <div className="mk-mock-ruta-card__fill" style={{ width: '48%' }} />
        </div>
      </div>
      <div className="mk-mock-ruta-card mk-mock-ruta-card--locked">
        <div className="mk-mock-ruta-card__head">
          <div>
            <p className="mk-mock-ruta-card__id">E-AUD-002</p>
            <p className="mk-mock-ruta-card__name">Auditoría II</p>
          </div>
          <span className="mk-mock-ruta-card__badge mk-mock-ruta-card__badge--locked">Bloqueada</span>
        </div>
      </div>
    </div>
  );
}

// ── Mi Perfil — matches the real /perfil archetype + radar + sombra dashboard ─

export function MkPerfilScreen() {
  return (
    <div className="mk-mock-perfil">
      <MkArchetypeBanner compact />
      <p className="mk-mock-eyebrow">DIMENSIONES · RADAR</p>
      <div className="mk-mock-perfil-radar-row">
        <MkRadarChart />
        <div className="mk-mock-perfil-scores">
          <span>Identidad · 74</span>
          <span>Hábitos · 61</span>
          <span>Relaciones · 68</span>
        </div>
      </div>
      <div>
        <div className="mk-mock-perfil-shadow-head">
          <p className="mk-mock-eyebrow" style={{ color: 'rgba(255,90,90,0.75)', margin: 0 }}>
            LA SOMBRA
          </p>
          <span className="mk-mock-perfil-shadow-score">31</span>
        </div>
        <p className="mk-mock-perfil-shadow-text">
          {REY.shadow.label}: domina en vez de sostener.
        </p>
      </div>
    </div>
  );
}
