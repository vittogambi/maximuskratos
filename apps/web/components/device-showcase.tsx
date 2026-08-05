'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { AppIcon } from '@/components/app-icon';
import {
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_VIEWPORT,
} from '@/components/motion/tokens';

export type DeviceShowcaseFocus =
  | 'overview'
  | 'diagnostico'
  | 'ruta'
  | 'perfil'
  | 'proposito';

/** Marketing stills: desktop product shots only. */
const PRODUCT_SHOTS: Record<DeviceShowcaseFocus, string> = {
  overview: '/images/landing/dashboard-panel-desktop.png',
  perfil: '/images/landing/dashboard-alineacion-desktop.png',
  diagnostico: '/images/landing/dashboard-diagnostico-desktop.png',
  ruta: '/images/landing/dashboard-ruta-desktop.png',
  proposito: '/images/landing/dashboard-proposito-desktop.png',
};

function ProductShot({ src }: { src: string }) {
  return (
    <div className="mk-app-ui__dashboard-shot">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" draggable={false} />
    </div>
  );
}

function DesktopAppScreen({ focus }: { focus: DeviceShowcaseFocus }) {
  return (
    <div className="mk-app-ui mk-app-ui--desktop mk-app-ui--dashboard">
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
      <ProductShot src={PRODUCT_SHOTS[focus]} />
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
        className={`device-showcase device-showcase--dashboard device-showcase--desktop-only${
          isExperience ? ' device-showcase--experience' : ''
        }`}
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
        </div>
      </div>
    </div>
  );
}
