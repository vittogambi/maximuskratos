'use client';

import { FormEvent, useState } from 'react';
import { AppIcon } from '@/components/app-icon';
import { apiCreateLead } from '@/lib/api';
import { cn } from '@/lib/cn';

export const CONTACT_REASONS = [
  { value: 'consulta-general', label: 'Consulta general' },
  { value: 'empresas', label: 'Empresas y alianzas' },
  { value: 'feedback', label: 'Feedback del producto' },
  { value: 'seguimiento', label: 'Seguimiento del proyecto' },
] as const;

export type ContactReason = (typeof CONTACT_REASONS)[number]['value'];

type ContactFormProps = {
  className?: string;
  submitClassName?: string;
  showReason?: boolean;
  /** Motivo controlado desde fuera (p. ej. cards de intención en /contacto). */
  reason?: ContactReason;
  onReasonChange?: (reason: ContactReason) => void;
};

export function ContactForm({
  className,
  submitClassName = 'btn btn--primary',
  showReason = false,
  reason: reasonProp,
  onReasonChange,
}: ContactFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [internalReason, setInternalReason] = useState<ContactReason>(CONTACT_REASONS[0].value);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const reason = reasonProp ?? internalReason;

  function setReason(next: ContactReason) {
    if (onReasonChange) {
      onReasonChange(next);
    } else {
      setInternalReason(next);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await apiCreateLead({
        email,
        name: name || undefined,
        message: message || undefined,
        source: showReason ? reason : 'contact',
      });
      setSuccess(true);
      setEmail('');
      setName('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu mensaje.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="ag-form-done" role="status">
        <span className="ag-form-done__icon" aria-hidden>
          <AppIcon name="circle-check" size={26} />
        </span>
        <p className="ag-form-done__title font-headline-sm">Mensaje recibido.</p>
        <p className="ag-form-done__body font-body-md">
          Gracias por escribirnos. Lo leemos con atención y te respondemos al correo que dejaste.
        </p>
        <button
          type="button"
          className="ag-form-done__again font-label-lg"
          onClick={() => setSuccess(false)}
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form className={cn('contact-form', className)} onSubmit={onSubmit}>
      <div className="contact-form__field">
        <label htmlFor="contact-name">Nombre</label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
        />
      </div>
      <div className="contact-form__field">
        <label htmlFor="contact-email">
          Correo electrónico <span className="contact-form__required" aria-hidden>*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
        />
      </div>
      {showReason ? (
        <div className="contact-form__field">
          <label htmlFor="contact-reason">Motivo</label>
          <select
            id="contact-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ContactReason)}
          >
            {CONTACT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="contact-form__field">
        <label htmlFor="contact-message">Mensaje</label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="¿En qué podemos ayudarte?"
        />
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={submitClassName} disabled={loading}>
        {loading ? 'Enviando…' : 'Enviar mensaje'}
      </button>
      <p className="contact-form__hint">Respondemos en 24 a 48 horas hábiles.</p>
    </form>
  );
}
