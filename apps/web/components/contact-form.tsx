'use client';

import { FormEvent, useState } from 'react';
import { apiCreateLead } from '@/lib/api';
import { cn } from '@/lib/cn';

type ContactFormProps = {
  className?: string;
  submitClassName?: string;
};

export function ContactForm({ className, submitClassName = 'btn btn--primary' }: ContactFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
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
      await apiCreateLead({ email, name: name || undefined, message: message || undefined });
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
      <p className="form-success" role="status">
        Gracias. Recibimos tu mensaje y te contactaremos pronto.
      </p>
    );
  }

  return (
    <form className={cn('contact-form', className)} onSubmit={onSubmit}>
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
      <label>
        Nombre (opcional)
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
        />
      </label>
      <label>
        Mensaje (opcional)
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
