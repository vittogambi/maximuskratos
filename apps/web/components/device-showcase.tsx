import { AppIcon } from '@/components/app-icon';

const SHIELD_ASPECT = 131 / 123;

const DESKTOP_NAV = [
  { icon: 'layout-dashboard' as const, label: 'Panel', active: true },
  { icon: 'scan-line' as const, label: 'Diagnóstico', active: false },
  { icon: 'map' as const, label: 'Blueprint', active: false },
  { icon: 'calendar-check' as const, label: 'Misiones', active: false },
] as const;

const MOBILE_NAV = [
  { icon: 'layout-dashboard' as const, label: 'Inicio', active: true },
  { icon: 'calendar-check' as const, label: 'Hoy', active: false },
  { icon: 'map' as const, label: 'Plan', active: false },
  { icon: 'user-check' as const, label: 'Perfil', active: false },
] as const;

function MkAppBrand({ variant = 'sidebar' }: { variant?: 'sidebar' | 'mobile' }) {
  const height = variant === 'mobile' ? 18 : 22;
  const width = Math.round(height * SHIELD_ASPECT);

  return (
    <div className={`mk-app-brand mk-app-brand--${variant}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/mk-shield.png"
        alt=""
        width={width}
        height={height}
        className="mk-app-brand__shield"
        decoding="async"
      />
      {variant === 'sidebar' ? (
        <div className="mk-app-brand__text">
          <span className="mk-app-brand__name">MAXIMUS KRATOS</span>
        </div>
      ) : null}
    </div>
  );
}

function DesktopAppScreen() {
  return (
    <div className="mk-app-ui mk-app-ui--desktop">
      <header className="mk-app-ui__titlebar">
        <div className="mk-app-ui__traffic">
          <span className="mk-app-ui__traffic-dot mk-app-ui__traffic-dot--close" />
          <span className="mk-app-ui__traffic-dot mk-app-ui__traffic-dot--min" />
          <span className="mk-app-ui__traffic-dot mk-app-ui__traffic-dot--max" />
        </div>
        <div className="mk-app-ui__url">
          <AppIcon name="globe" size={11} />
          <span>app.maximuskratos.com</span>
        </div>
        <div className="mk-app-ui__titlebar-spacer" />
      </header>

      <div className="mk-app-ui__body">
        <aside className="mk-app-ui__sidebar">
          <MkAppBrand variant="sidebar" />
          <nav className="mk-app-ui__nav">
            {DESKTOP_NAV.map((item) => (
              <div
                key={item.label}
                className={`mk-app-ui__nav-item${item.active ? ' is-active' : ''}`}
              >
                <AppIcon name={item.icon} size={14} />
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </aside>

        <main className="mk-app-ui__main">
          <div className="mk-app-ui__topbar">
            <p className="mk-app-ui__eyebrow">Panel de control</p>
            <p className="mk-app-ui__sync">Sincronizado · Web</p>
          </div>

          <div className="mk-app-ui__stats">
            <article className="mk-app-ui__stat mk-app-ui__stat--accent">
              <p className="mk-app-ui__stat-label">Índice de alineación</p>
              <p className="mk-app-ui__stat-value">78%</p>
            </article>
            <article className="mk-app-ui__stat">
              <p className="mk-app-ui__stat-label">Racha activa</p>
              <p className="mk-app-ui__stat-value">12 días</p>
            </article>
          </div>

          <article className="mk-app-ui__card">
            <div className="mk-app-ui__card-head">
              <p className="mk-app-ui__card-title">Blueprint · Arquetipo Rey</p>
              <span className="mk-app-ui__card-tag">Activo</span>
            </div>
            <p className="mk-app-ui__card-body">Plan 90 días · 3 misiones pendientes hoy</p>
            <div className="mk-app-ui__progress">
              <span style={{ width: '68%' }} />
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}

function MobileAppScreen() {
  return (
    <div className="mk-app-ui mk-app-ui--mobile">
      <div className="mk-app-ui__mobile-status">
        <span>9:41</span>
        <span className="mk-app-ui__mobile-signal" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </div>

      <header className="mk-app-ui__mobile-header">
        <MkAppBrand variant="mobile" />
        <div>
          <p className="mk-app-ui__mobile-greeting">Buenos días</p>
          <p className="mk-app-ui__mobile-sub">Sincronizado · Móvil</p>
        </div>
      </header>

      <article className="mk-app-ui__stat mk-app-ui__stat--accent">
        <p className="mk-app-ui__stat-label">Índice de alineación</p>
        <p className="mk-app-ui__stat-value">78%</p>
      </article>

      <article className="mk-app-ui__card">
        <p className="mk-app-ui__card-title">Misiones de hoy</p>
        <p className="mk-app-ui__card-body">3 pendientes · Blueprint activo</p>
      </article>

      <nav className="mk-app-ui__mobile-nav">
        {MOBILE_NAV.map((item) => (
          <div
            key={item.label}
            className={`mk-app-ui__mobile-nav-item${item.active ? ' is-active' : ''}`}
          >
            <AppIcon name={item.icon} size={14} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function DeviceShowcase() {
  return (
    <div className="device-showcase" aria-hidden>
      <div className="device-showcase__ambient" />
      <div className="device-showcase__floor" />

      <div className="device-showcase__compose">
        <div className="device-frame device-frame--laptop">
          <div className="device-frame__rim">
            <div className="device-frame__viewport">
              <div className="device-frame__sheen" />
              <DesktopAppScreen />
            </div>
          </div>
          <div className="device-frame__lip" />
        </div>

        <div className="device-frame device-frame--phone">
          <div className="device-frame__rim device-frame__rim--phone">
            <div className="device-frame__island" />
            <div className="device-frame__viewport device-frame__viewport--phone">
              <div className="device-frame__sheen device-frame__sheen--phone" />
              <MobileAppScreen />
            </div>
            <div className="device-frame__home-indicator" />
          </div>
        </div>
      </div>
    </div>
  );
}
