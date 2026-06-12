'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect } from 'react';
import { AppIcon } from '@/components/app-icon';
import { useAuthSession } from '@/components/auth-session-provider';
import { PublicNav } from '@/components/public-nav';
import { LANDING_IMAGES } from '@/lib/assets';
import { PANEL_MODULES, PLATFORM_STATUS_LABELS } from '@/lib/platform-status';

const ROADMAP_MODULES = PANEL_MODULES.filter((module) => module.id !== 'mi-cuenta');

function roadmapStatusLabel(estado: (typeof PANEL_MODULES)[number]['estado']): string {
  if (estado === 'proximamente') return 'Próximo';
  if (estado === 'en-desarrollo') return 'En construcción';
  return PLATFORM_STATUS_LABELS[estado];
}

export function PanelContent() {
  const router = useRouter();
  const { status, user } = useAuthSession();

  useLayoutEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'guest') return;
    if (user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [status, user, router]);

  const ready = status === 'authenticated' && user?.role !== 'ADMIN';

  if (status === 'guest') {
    return null;
  }

  if (!ready) {
    return (
      <div
        className="ag-landing flex min-h-screen flex-col antialiased"
        style={{ background: '#0e0e0e', color: '#e5e2e1' }}
      >
        <PublicNav />
        <main className="flex grow items-center justify-center">
          <div className="auth-loading">
            <span className="auth-spinner" aria-hidden />
            <p>Verificando acceso…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="ag-landing flex min-h-screen flex-col antialiased"
      style={{ background: '#0e0e0e', color: '#e5e2e1' }}
    >
      <PublicNav />

      <main className="ag-panel-page relative flex grow flex-col">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueSovereign}
          alt=""
          aria-hidden
          className="ag-panel-page__bg"
        />
        <div className="ag-panel-page__scrim" aria-hidden />

        <div className="ag-panel-page__inner">
          <div className="ag-panel-page__shell">
            <header className="ag-panel-page__welcome">
              <p className="hud-text text-action-red">Programa Fundador</p>
              <h1 className="font-display-xl text-white ag-panel-page__title">Bienvenido</h1>
              <p className="ag-panel-page__email">{user?.email}</p>
              <p className="font-body-md ag-panel-page__lead">
                Tu lugar está reservado. El sistema se activa por etapas y serás de los primeros
                en acceder.
              </p>
            </header>

            <section className="ag-panel-roadmap" aria-label="Próximas etapas">
              <p className="ag-panel-roadmap__label hud-text">Próximas etapas</p>
              <ul className="ag-panel-roadmap__list">
                {ROADMAP_MODULES.map((module) => (
                  <li
                    key={module.id}
                    className={`ag-panel-roadmap__item ag-panel-roadmap__item--${module.estado}`}
                  >
                    <span className="ag-panel-roadmap__name">
                      <AppIcon name={module.icon} size={16} aria-hidden />
                      {module.nombre}
                    </span>
                    <span className="ag-panel-roadmap__status">
                      {roadmapStatusLabel(module.estado)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="ag-panel-page__footer">
              <Link href="/sistema" className="ag-btn-cta font-label-lg">
                Explorar el método
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
