'use client';

import { useTrialDays } from '@/lib/use-trial-days';
import { isEarlyAccessMode } from '@/lib/product-phase';

type Props = {
  className?: string;
};

/** Menciona el período de prueba vigente, leído del API en vivo (sin número hardcodeado). */
export function TrialBadge({ className }: Props) {
  const days = useTrialDays();

  return (
    <p className={className}>
      {isEarlyAccessMode()
        ? `Sin cobro hoy. La prueba de ${days} días se activa cuando abra la plataforma.`
        : `Incluye ${days} días de prueba gratuita, sin cobro hasta que decidas continuar.`}
    </p>
  );
}
