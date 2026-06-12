'use client';

import { FormEvent, useState } from 'react';
import { apiCreateLead } from '@/lib/api';
import { cn } from '@/lib/cn';

type EarlyAccessFormProps = {
  submitLabel?: string;
  successMessage?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
};

export function EarlyAccessForm({
  submitLabel = 'Recibir aviso',
  successMessage = 'Listo. Te avisamos cuando el diagnóstico abra.',
  variant = 'primary',
  className,
}: EarlyAccessFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiCreateLead({ email });
      setDone(true);
    } catch {
      setError('No pudimos registrar tu correo. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="font-body-md text-white/80" role="status">
        {successMessage}
      </p>
    );
  }

  return (
    <form
      className={cn(
        'ag-early-access__form',
        variant === 'secondary' && 'ag-early-access__form--founder',
        className,
      )}
      onSubmit={onSubmit}
    >
      <label className="sr-only" htmlFor="ea-email">
        Correo electrónico
      </label>
      <input
        id="ea-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="tu@email.com"
        disabled={loading}
        className="ag-early-access__input"
      />
      <button
        type="submit"
        className={
          variant === 'secondary'
            ? 'ag-btn-founder-notify font-label-lg'
            : 'ag-btn-cta font-label-lg'
        }
        disabled={loading}
      >
        {loading ? 'Enviando…' : submitLabel}
      </button>
      {error ? <p className="form-error mt-3">{error}</p> : null}
    </form>
  );
}
