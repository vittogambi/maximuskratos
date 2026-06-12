'use client';

import { FormEvent, useState } from 'react';
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
};

export function ContactForm({
  className,
  submitClassName = 'btn btn--primary',
  showReason = false,
}: ContactFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState<ContactReason>(CONTACT_REASONS[0].value);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setReason(CONTACT_REASONS[0].value);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu mensaje.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className="form-success" role="status">
        Gracias. Recibimos tu mensaje y te contactaremos pronto.
      </p>
    );
  }

  return (
    <form className={cn('contact-form', className)} onSubmit={onSubmit}>
      <label>
        Nombre
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
        />
      </label>
      <label>
        Correo electrónico
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
        />
      </label>
      {showReason ? (
        <label>
          Motivo
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ContactReason)}
          >
            {CONTACT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        Mensaje
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="¿En qué podemos ayudarte?"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className={submitClassName} disabled={loading}>
        {loading ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
