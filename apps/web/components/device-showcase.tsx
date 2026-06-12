import { AppIcon } from '@/components/app-icon';
import {
  MkBlueprintScreen,
  MkDiagnosticoScreen,
  MkEjecucionScreen,
  MkOverviewScreen,
  MkProfileProgress,
  MkRadarChart,
  MkRealmSidebar,
} from '@/components/mk-product-mock-screens';

const SHIELD_ASPECT = 131 / 123;

export type DeviceShowcaseFocus = 'overview' | 'diagnostico' | 'blueprint' | 'ejecucion';

type NavItem = {
  icon: 'layout-dashboard' | 'scan-line' | 'map' | 'calendar-check';
  label: string;
  id: DeviceShowcaseFocus | 'panel';
};

const DESKTOP_NAV: NavItem[] = [
  { icon: 'layout-dashboard', label: 'Panel', id: 'panel' },
  { icon: 'scan-line', label: 'Diagnóstico', id: 'diagnostico' },
  { icon: 'map', label: 'Blueprint', id: 'blueprint' },
  { icon: 'calendar-check', label: 'Misiones', id: 'ejecucion' },
];

const MOBILE_NAV = [
  { icon: 'layout-dashboard' as const, label: 'Inicio', active: true },
  { icon: 'calendar-check' as const, label: 'Hoy', active: false },
  { icon: 'map' as const, label: 'Plan', active: false },
  { icon: 'user-check' as const, label: 'Perfil', active: false },
] as const;

function navActive(item: NavItem, focus: DeviceShowcaseFocus): boolean {
  if (focus === 'overview') return item.id === 'panel';
  return item.id === focus;
}

function usesRealmSidebar(focus: DeviceShowcaseFocus): boolean {
  return focus !== 'overview';
}

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

function DesktopMainContent({ focus }: { focus: DeviceShowcaseFocus }) {
  if (focus === 'diagnostico') return <MkDiagnosticoScreen />;
  if (focus === 'blueprint') return <MkBlueprintScreen />;
  if (focus === 'ejecucion') return <MkEjecucionScreen />;
  return <MkOverviewScreen />;
}

function DesktopAppScreen({ focus }: { focus: DeviceShowcaseFocus }) {
  const realmLayout = usesRealmSidebar(focus);

  return (
    <div className={`mk-app-ui mk-app-ui--desktop${realmLayout ? ' mk-app-ui--pdf' : ''}`}>
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
        <aside className={`mk-app-ui__sidebar${realmLayout ? ' mk-app-ui__sidebar--realms' : ''}`}>
          {realmLayout ? (
            <MkRealmSidebar activeRealm="espiritu" />
          ) : (
            <>
              <MkAppBrand variant="sidebar" />
              <nav className="mk-app-ui__nav">
                {DESKTOP_NAV.map((item) => (
                  <div
                    key={item.label}
                    className={`mk-app-ui__nav-item${navActive(item, focus) ? ' is-active' : ''}`}
                  >
                    <AppIcon name={item.icon} size={14} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </nav>
            </>
          )}
        </aside>

        <main className={`mk-app-ui__main${realmLayout ? ' mk-app-ui__main--pdf' : ''}`}>
          <DesktopMainContent focus={focus} />
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

      <div className="mk-mock-overview__preview mk-mock-overview__preview--mobile">
        <MkRadarChart />
        <MkProfileProgress label="Perfil 68%" filled={3} />
      </div>

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

type DeviceShowcaseProps = {
  previewBadge?: boolean;
  focus?: DeviceShowcaseFocus;
  layout?: 'hero' | 'experience';
};

export function DeviceShowcase({
  previewBadge = false,
  focus = 'overview',
  layout = 'hero',
}: DeviceShowcaseProps) {
  const isExperience = layout === 'experience';

  return (
    <div className={`device-showcase-wrap${isExperience ? ' device-showcase-wrap--experience' : ''}`}>
      {previewBadge ? (
        <p className="device-showcase__preview-badge hud-text">Vista previa del diseño</p>
      ) : null}
      <div
        className={`device-showcase${isExperience ? ' device-showcase--experience' : ''}`}
        aria-hidden
      >
        <div className="device-showcase__ambient" />
        {!isExperience ? <div className="device-showcase__floor" /> : null}

        <div className="device-showcase__compose">
          <div className="device-frame device-frame--laptop">
            <div className="device-frame__rim">
              <div className="device-frame__viewport">
                <div className="device-frame__sheen" />
                <DesktopAppScreen focus={focus} />
              </div>
            </div>
            {!isExperience ? <div className="device-frame__lip" /> : null}
          </div>

          {!isExperience ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
