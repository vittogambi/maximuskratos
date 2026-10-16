'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RecorridoView } from '@/components/admin/recorrido-view';
import { apartadoFrom, patchRecorridoQuery, vistaFrom, type Apartado, type Vista } from '@/components/admin/recorrido-reading';
import { apiAdminJourney, apiAdminResponses, type AdminJourney, type AdminResponsePage } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';

type Load<T> = { key: string; data: T | null; error: string; loading: boolean };

export function RecorridoScreen() {
  const params = useParams<{ userId: string }>();
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const userId = params.userId;
  const vista = vistaFrom(search.get('vista'));
  const apartado = apartadoFrom(search.get('apartado'));
  const modulo = search.get('modulo');
  const rawPage = Number(search.get('pagina'));
  const pagina = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const journeyKey = JSON.stringify([userId]);
  const [journeyLoad, setJourneyLoad] = useState<Load<AdminJourney> | null>(null);
  const [responseLoad, setResponseLoad] = useState<Load<AdminResponsePage> | null>(null);
  const [journeyTick, setJourneyTick] = useState(0);
  const [responseTick, setResponseTick] = useState(0);
  const journey = journeyLoad?.key === journeyKey ? journeyLoad.data : null;
  const current = journey?.selectedSessionId;
  const responseKey = JSON.stringify([userId, current, modulo, pagina]);
  const responses = responseLoad?.key === responseKey ? responseLoad : null;

  function replace(patch: Record<string, string | null>) {
    router.replace(`${pathname}${patchRecorridoQuery(new URLSearchParams(search.toString()), patch)}`, { scroll: false });
  }

  useEffect(() => {
    const token = getAccessToken();
    let cancel = false;
    setJourneyLoad({ key: journeyKey, data: null, error: '', loading: true });
    setResponseLoad(null);
    if (!token || !userId) {
      setJourneyLoad({ key: journeyKey, data: null, error: 'Vuelve a iniciar sesión para consultar esta cuenta.', loading: false });
      return;
    }
    apiAdminJourney(token, userId)
      .then((data) => { if (!cancel) setJourneyLoad({ key: journeyKey, data, error: '', loading: false }); })
      .catch(() => { if (!cancel) setJourneyLoad({ key: journeyKey, data: null, error: 'No se pudo leer el recorrido.', loading: false }); });
    return () => { cancel = true; };
  }, [userId, journeyKey, journeyTick]);

  useEffect(() => {
    if (!search.get('sessionId')) return;
    replace({ sessionId: null });
  }, [pathname, search]);

  useEffect(() => {
    const token = getAccessToken();
    if (!userId || !current || !modulo || vista !== 'respuestas') return;
    let cancel = false;
    setResponseLoad({ key: responseKey, data: null, error: '', loading: true });
    if (!token) {
      setResponseLoad({ key: responseKey, data: null, error: 'Vuelve a iniciar sesión para consultar las respuestas.', loading: false });
      return;
    }
    apiAdminResponses(token, userId, current, modulo, pagina)
      .then((data) => { if (!cancel) setResponseLoad({ key: responseKey, data, error: '', loading: false }); })
      .catch(() => { if (!cancel) setResponseLoad({ key: responseKey, data: null, error: 'No se pudo leer el módulo.', loading: false }); });
    return () => { cancel = true; };
  }, [userId, current, modulo, pagina, vista, responseKey, responseTick]);

  return (
    <RecorridoView
      journey={journey}
      responses={responses?.data ?? null}
      alerts={null}
      error={journeyLoad?.key === journeyKey ? journeyLoad.error : ''}
      responsesError={responses?.error ?? ''}
      responsesLoading={Boolean(current && modulo && (!responses || responses.loading))}
      vista={vista}
      apartado={apartado}
      modulo={modulo}
      pagina={pagina}
      onVista={(next: Vista) => replace({ vista: next })}
      onApartado={(next: Apartado) => replace({ apartado: next, vista: 'proposito' })}
      onModule={(slug) => replace({ modulo: slug, pagina: '1', vista: 'respuestas' })}
      onPage={(page) => replace({ pagina: String(page), modulo, vista: 'respuestas' })}
      onRetryResponses={() => setResponseTick((value) => value + 1)}
      onRetryJourney={() => setJourneyTick((value) => value + 1)}
    />
  );
}
