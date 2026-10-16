'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import { ContractSections, SHEET_ANCHORS } from './ContractSections';
import styles from './RoadmapContract.module.css';
import { confirmPurpose, journeyContract, savePurpose, type HdrpContract } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function civilDate(iso?: string | null): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(iso ? new Date(iso) : new Date());
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const year = parts.find((part) => part.type === 'year')?.value;
  return `${day} ${MONTHS[month - 1] ?? ''} ${year ?? ''}`.trim();
}

export function RoadmapClose() {
  const reduced = useReducedMotion();
  const [contract, setContract] = useState<HdrpContract | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'signing' | 'signed'>('idle');
  const [savingName, setSavingName] = useState(false);

  function load() {
    const token = getAccessToken();
    if (!token) return;
    journeyContract(token)
      .then((row) => {
        setContract(row);
        setName(row.name ?? '');
        if (row.confirmed) setPhase('signed');
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => { load(); }, []);

  const signed = phase === 'signed' || Boolean(contract?.confirmed);
  const ratificationIcon = SHEET_ANCHORS.find((link) => link.href === '#ratificacion')?.icon ?? 'circle-check';

  async function persistName() {
    const token = getAccessToken();
    if (!token || signed) return;
    const trimmed = name.trim();
    if (trimmed === (contract?.name ?? '')) return;
    setSavingName(true);
    try {
      await savePurpose(token, { name: trimmed });
      setContract((current) => current ? { ...current, name: trimmed } : current);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el nombre.');
    } finally {
      setSavingName(false);
    }
  }

  async function onConfirm() {
    const token = getAccessToken();
    if (!token || phase === 'signing') return;
    if (!name.trim()) {
      setError('Escribe tu nombre para firmar.');
      return;
    }
    setError('');
    setPhase('signing');
    try {
      await new Promise((resolve) => window.setTimeout(resolve, reduced ? 0 : 700));
      await savePurpose(token, { name: name.trim() });
      await confirmPurpose(token);
      const next = await journeyContract(token);
      setContract(next);
      setName(next.name ?? name.trim());
      setPhase('signed');
    } catch (err) {
      setPhase('idle');
      setError(err instanceof Error ? err.message : 'No se pudo firmar.');
    }
  }

  return (
    <div className={styles.page}>
      <article className={styles.sheet}>
        <header className={styles.mast}>
          <h1 className={styles.title}>Hoja de ruta de propósito</h1>
          <p className={styles.subtitle}>Contrato de compromiso soberano y propósito de vida</p>
        </header>
        {!contract ? <p className={styles.status} role="status">Leyendo la hoja.</p> : null}
        {contract ? (
          <>
            <nav className={styles.toc} aria-label="Contenido">
              {SHEET_ANCHORS.map((link) => (
                <a key={link.href} href={link.href}>
                  <AppIcon name={link.icon} size={16} />
                  {link.label}
                </a>
              ))}
            </nav>
            <p className={styles.opening}>
              Yo,{' '}
              {signed ? <span className={styles.signedName}>{name.trim()}</span> : (
                <input
                  className={styles.name}
                  value={name}
                  placeholder="Tu nombre"
                  aria-label="Tu nombre"
                  disabled={savingName}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => { void persistName(); }}
                />
              )}
              {', consciente de mi historia, dueño de mi presente y arquitecto de mi destino, declaro solemnemente los pilares que rigen y regirán mi existencia a partir de este momento.'}
            </p>
            <ContractSections articles={contract.articles} />
            <section id="ratificacion" className={styles.chapter} aria-labelledby="hdrp-ratification-title">
              <h2 id="hdrp-ratification-title" className={styles.chapterTitle}>
                <AppIcon name={ratificationIcon} size={22} />
                <span>Ratificación del compromiso</span>
              </h2>
              <p className={styles.copy}>{contract.closing}</p>
              <div className={styles.metadata}>
                <p className={styles.meta}>Fecha: {civilDate(signed ? contract.confirmedAt : null)}</p>
                <p className={styles.meta}>{signed ? `Firmado por ${name.trim()}.` : 'Firma pendiente.'}</p>
              </div>
              {signed ? null : (
                <button type="button" className={styles.sign} onClick={() => void onConfirm()} disabled={phase === 'signing'}>
                  {phase === 'signing' ? 'Firmando' : 'Firmar'}
                </button>
              )}
            </section>
          </>
        ) : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </article>
    </div>
  );
}
