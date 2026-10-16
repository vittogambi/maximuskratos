'use client';

import { FormEvent, useState } from 'react';
import { requestGuidance } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';

export function AdvisorsScreen() {
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setError('');
    try {
      await requestGuidance(token, 'alerta-de-ficha', note);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar.');
    }
  }

  return (
    <div className="mk-dashboard">
      <p className="mk-section-eyebrow">ASESORES</p>
      <h1 className="sys-header__title">Orientación, no un directorio.</h1>
      <p className="sys-header__method">
        No hay profesionales publicados. Si una ficha marcó algo que quieres que MK vea, la solicitud
        queda en tu cuenta. No se comparte sola.
      </p>
      <form onSubmit={onSubmit} className="mk-form">
        <label>
          Qué quieres que miremos
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} required />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        {sent ? <p>Solicitud enviada.</p> : <button className="mk-btn-primary" type="submit">Enviar solicitud</button>}
      </form>
    </div>
  );
}
