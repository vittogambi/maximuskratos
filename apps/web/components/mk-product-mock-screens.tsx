import { AppIcon } from '@/components/app-icon';
import { ARCHETYPES } from '@/lib/archetypes';
import { PILLARS, type PillarKey } from '@/lib/mk-system';

const REY = ARCHETYPES.rey;

/**
 * Puntajes ilustrativos para las mockups de marketing (no provienen de un usuario real).
 * Usan exactamente la taxonomía del método: los tres pilares del Marco Central.
 */
const MOCK_ALIGNMENT_SCORE = 78;
const MOCK_PILLAR_SCORES: Record<PillarKey, number> = {
  espiritu: 82,
  mente: 74,
  cuerpo: 65,
};

// Triángulo de 3 ejes (Espíritu / Mente / Cuerpo) a partir de MOCK_PILLAR_SCORES.
const RADAR_FULL_MARK = '50,8 78,56 22,56';
const RADAR_DATA_POINTS: ReadonlyArray<[number, number]> = [
  [50, 14],
  [71, 52],
  [32, 50],
];

export function MkRadarChart() {
  const dataPoints = RADAR_DATA_POINTS.map(([x, y]) => `${x},${y}`).join(' ');
  const grid = [0.35, 0.55, 0.75, 1];

  return (
    <svg className="mk-mock-radar" viewBox="0 0 100 80" aria-hidden>
      {grid.map((scale) => (
        <polygon
          key={scale}
          points={RADAR_FULL_MARK}
          transform={`translate(50 40) scale(${scale}) translate(-50 -40)`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.6"
        />
      ))}
      <polygon points={dataPoints} fill="rgba(192,1,0,0.22)" stroke="#c00100" strokeWidth="1.2" />
      {RADAR_DATA_POINTS.map(([cx, cy], i) => (
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
          <p className="mk-app-ui__stat-label">Alineación general</p>
          <p className="mk-app-ui__stat-value">{MOCK_ALIGNMENT_SCORE}</p>
        </article>
        {PILLARS.map((pillar) => (
          <article key={pillar.key} className="mk-app-ui__stat">
            <p className="mk-app-ui__stat-label">{pillar.label}</p>
            <p className="mk-app-ui__stat-value">{MOCK_PILLAR_SCORES[pillar.key]}</p>
          </article>
        ))}
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
            <p className="mk-mock-ruta-card__id">Auditoría I</p>
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
            <p className="mk-mock-ruta-card__id">Auditoría II</p>
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
      <p className="mk-mock-eyebrow">PILARES · RADAR</p>
      <div className="mk-mock-perfil-radar-row">
        <MkRadarChart />
        <div className="mk-mock-perfil-scores">
          {PILLARS.map((pillar) => (
            <span key={pillar.key}>
              {pillar.label} · {MOCK_PILLAR_SCORES[pillar.key]}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div className="mk-mock-perfil-shadow-head">
          <p className="mk-mock-eyebrow" style={{ color: 'rgba(255,90,90,0.75)', margin: 0 }}>
            TENSIÓN DOMINANTE
          </p>
          <span className="mk-mock-perfil-shadow-score">{REY.shadow.label}</span>
        </div>
        <p className="mk-mock-perfil-shadow-text">{REY.shadow.description}</p>
      </div>
    </div>
  );
}
