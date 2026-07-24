'use client';

import { useEffect, useState } from 'react';
import { apiBillingPlans } from '@/lib/api';

/** Coincide con el default de BillingSettings en la base de datos. */
export const DEFAULT_TRIAL_DAYS = 30;

/** Días de prueba vigentes, leídos del API en vivo (sin número hardcodeado). */
export function useTrialDays(): number {
  const [days, setDays] = useState(DEFAULT_TRIAL_DAYS);

  useEffect(() => {
    apiBillingPlans()
      .then((res) => setDays(res.trialDays))
      .catch(() => {});
  }, []);

  return days;
}
