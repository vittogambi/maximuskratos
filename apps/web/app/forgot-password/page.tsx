'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { useRequireGuest } from '@/lib/use-require-guest';
import { AuthSubmitButton } from '@/components/auth-submit-button';
import { apiForgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
  const status = useRequireGuest();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'authenticated') {
    return (
      <AuthShell title="Redirigiendo" description="Un momento…">
        <div className="auth-loading">
          <span className="auth-spinner" aria-hidden />
          <p>Preparando tu sesión</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      showNav
      title="Recuperar contraseña"
      description={
        sent
          ? 'Si el correo electrónico existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.'
          : 'Ingresa tu correo electrónico y te enviaremos un enlace de recuperación.'
      }
      footer={
        <p className="auth-footer-text">
          <Link href="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </p>
      }
    >
      {sent ? (
        <p className="form-success auth-success" style={{ margin: 0 }}>
          Revisa tu bandeja de entrada (y spam). El enlace expira en 1 hora.
        </p>
      ) : (
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-form__fields">
            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </label>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <AuthSubmitButton loading={loading} loadingLabel="Enviando…">
              Enviar enlace
            </AuthSubmitButton>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
