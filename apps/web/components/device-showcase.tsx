'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import {
  MkDiagnosticoScreen,
  MkOverviewScreen,
  MkPerfilScreen,
  MkRutaScreen,
} from '@/components/mk-product-mock-screens';
import {
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_VIEWPORT,
} from '@/components/motion/tokens';

const SHIELD_ASPECT = 131 / 123;

export type DeviceShowcaseFocus = 'overview' | 'diagnostico' | 'ruta' | 'perfil';

// Mirrors the real bottom-tab navigation (Inicio / Perfil / Ruta / Cuenta) —
// the actual app shell has no sidebar, on desktop or mobile.
const NAV_TABS: ReadonlyArray<{ icon: AppIconName; label: string; focus: DeviceShowcaseFocus | 'cuenta' }> = [
  { icon: 'layout-dashboard', label: 'Inicio', focus: 'overview' },
  { icon: 'user-check', label: 'Perfil', focus: 'perfil' },
  { icon: 'map', label: 'Ruta', focus: 'ruta' },
  { icon: 'shield', label: 'Cuenta', focus: 'cuenta' },
];

function pageTitle(focus: DeviceShowcaseFocus): string {
  if (focus === 'perfil') return 'Mi Perfil';
  if (focus === 'ruta') return 'Ruta MK';
  return 'Inicio';
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
    </div>
  );
}

function MkAppTopBar({ title }: { title: string }) {
  return (
    <div className="mk-app-ui__realtopbar">
      <MkAppBrand variant="mobile" />
      <span className="mk-app-ui__realtopbar-title">{title}</span>
      <span className="mk-app-ui__realtopbar-avatar" aria-hidden>
        M
      </span>
    </div>
  );
}

function MkAppTabBar({ active }: { active: DeviceShowcaseFocus | 'cuenta' }) {
  return (
    <nav className="mk-app-ui__tabbar" aria-hidden>
      {NAV_TABS.map((tab) => (
        <div
          key={tab.label}
          className={`mk-app-ui__tabbar-item${tab.focus === active ? ' is-active' : ''}`}
        >
          <AppIcon name={tab.icon} size={13} />
          <span>{tab.label}</span>
        </div>
      ))}
    </nav>
  );
}

function MkMainContent({ focus }: { focus: DeviceShowcaseFocus }) {
  if (focus === 'diagnostico') return <MkDiagnosticoScreen />;
  if (focus === 'ruta') return <MkRutaScreen />;
  if (focus === 'perfil') return <MkPerfilScreen />;
  return <MkOverviewScreen />;
}

// The real diagnostic flow (/diagnostico) is chrome-less — no top or bottom bar.
function MkAppScreen({ focus }: { focus: DeviceShowcaseFocus }) {
  const chromeless = focus === 'diagnostico';
  return (
    <>
      {!chromeless && <MkAppTopBar title={pageTitle(focus)} />}
      <main className="mk-app-ui__main">
        <MkMainContent focus={focus} />
      </main>
      {!chromeless && <MkAppTabBar active={focus} />}
    </>
  );
}

function DesktopAppScreen({ focus }: { focus: DeviceShowcaseFocus }) {
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
          <span>app.maximus-kratos.com</span>
        </div>
        <div className="mk-app-ui__titlebar-spacer" />
      </header>
      <MkAppScreen focus={focus} />
    </div>
  );
}

function MobileAppScreen({ focus }: { focus: DeviceShowcaseFocus }) {
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
      <MkAppScreen focus={focus} />
    </div>
  );
}

type DeviceShowcaseProps = {
  focus?: DeviceShowcaseFocus;
  layout?: 'hero' | 'experience';
};

export function DeviceShowcase({
  focus = 'overview',
  layout = 'hero',
}: DeviceShowcaseProps) {
  const isExperience = layout === 'experience';
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.25,
    margin: MOTION_VIEWPORT.margin,
  });

  return (
    <div
      ref={ref}
      className={`device-showcase-wrap${isExperience ? ' device-showcase-wrap--experience' : ''}`}
    >
      <div
        className={`device-showcase${isExperience ? ' device-showcase--experience' : ''}`}
        aria-hidden
      >
        <div className="device-showcase__ambient" />
        {!isExperience ? <div className="device-showcase__floor" /> : null}

        <div className="device-showcase__compose">
          <motion.div
            className="device-frame device-frame--laptop"
            initial={reduced ? false : { opacity: 0, y: MOTION_DISTANCE.sm, scale: 1.02 }}
            animate={
              inView || reduced
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: MOTION_DISTANCE.sm, scale: 1.02 }
            }
            transition={{
              type: 'tween',
              duration: MOTION_DURATION.reveal,
              ease: MOTION_EASE.enter,
            }}
          >
            <div className="device-frame__rim">
              <motion.div
                className="device-frame__viewport"
                initial={reduced ? false : { opacity: 0 }}
                animate={inView || reduced ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                  type: 'tween',
                  duration: MOTION_DURATION.interaction,
                  ease: MOTION_EASE.enter,
                  delay: reduced ? 0 : 0.12,
                }}
              >
                <div className="device-frame__sheen" />
                <DesktopAppScreen focus={focus} />
              </motion.div>
            </div>
            {!isExperience ? <div className="device-frame__lip" /> : null}
          </motion.div>

          <motion.div
            className={`device-frame device-frame--phone${isExperience ? ' device-frame--phone-experience' : ''}`}
            initial={reduced ? false : { opacity: 0, y: MOTION_DISTANCE.md, scale: 1.02 }}
            animate={
              inView || reduced
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: MOTION_DISTANCE.md, scale: 1.02 }
            }
            transition={{
              type: 'tween',
              duration: MOTION_DURATION.reveal,
              ease: MOTION_EASE.enter,
              delay: reduced ? 0 : 0.1,
            }}
          >
            <div className="device-frame__rim device-frame__rim--phone">
              <div className="device-frame__island" />
              <div className="device-frame__viewport device-frame__viewport--phone">
                <div className="device-frame__sheen device-frame__sheen--phone" />
                <MobileAppScreen focus={focus} />
              </div>
              <div className="device-frame__home-indicator" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
