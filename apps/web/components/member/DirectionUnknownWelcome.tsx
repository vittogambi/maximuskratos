'use client';

import { AppIcon } from '@/components/app-icon';

type Props = {
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryLabel?: string;
  busy?: boolean;
  /** compact = pantalla Propósito; wizard = intro del wizard si hace falta */
  variant?: 'compact' | 'wizard';
};

export function DirectionUnknownWelcome({
  onPrimary,
  onSecondary,
  primaryLabel = 'Empezar a explorar',
  busy = false,
  variant = 'compact',
}: Props) {
  if (variant === 'compact') {
    return (
      <section className="mk-dir-welcome mk-dir-welcome--compact" aria-labelledby="dir-unknown-title">
        <p className="mk-dir-welcome__eyebrow">Exploración</p>
        <h2 id="dir-unknown-title" className="mk-dir-welcome__title">
          Explora lo que es importante para ti
        </h2>
        <p className="mk-dir-welcome__lead">
          No necesitas tener tu propósito definido. Empecemos por experiencias que puedan ayudarte a reconocer qué
          valoras y qué te mueve.
        </p>
        <div className="mk-dir-welcome__actions mk-dir-welcome__actions--single">
          <button
            type="button"
            className="mk-mx__action mk-mx__action--primary mk-dir-welcome__cta"
            disabled={busy}
            onClick={onPrimary}
          >
            {primaryLabel}
            <AppIcon name="arrow-right" size={16} className="mk-dir-welcome__cta-icon" aria-hidden />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mk-dir-welcome" aria-labelledby="dir-unknown-title">
      <p className="mk-dir-welcome__eyebrow">Aún no tengo claro mi propósito</p>
      <h2 id="dir-unknown-title" className="mk-dir-welcome__title">
        Explora lo que es importante para ti
      </h2>
      <p className="mk-dir-welcome__lead">
        No necesitas tener tu propósito definido para empezar. Puedes ir descubriendo qué valoras y qué dirección te
        gustaría darle a tu vida.
      </p>
      <div className="mk-dir-welcome__block">
        <h3 className="mk-dir-welcome__block-title">Empecemos por tus experiencias</h3>
        <p className="mk-dir-welcome__block-body">
          Algunas preguntas te ayudarán a reconocer qué te importa, qué te mueve y qué te gustaría construir.
        </p>
        <p className="mk-dir-welcome__reassurance">
          No hay respuestas correctas ni necesitas llegar hoy a una conclusión definitiva.
        </p>
      </div>
      <div className="mk-dir-welcome__actions">
        <button
          type="button"
          className="mk-mx__action mk-mx__action--primary mk-dir-welcome__cta"
          disabled={busy}
          onClick={onPrimary}
        >
          {primaryLabel}
          <AppIcon name="arrow-right" size={16} className="mk-dir-welcome__cta-icon" aria-hidden />
        </button>
        {onSecondary ? (
          <button type="button" className="mk-mx__textlink mk-dir-welcome__secondary" onClick={onSecondary}>
            Elegir otra forma de empezar
          </button>
        ) : null}
      </div>
    </section>
  );
}
