'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { AuthSubmitButton } from '@/components/auth-submit-button';
import { PasswordInput } from '@/components/password-input';
import { apiResetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Enlace inválido. Solicita uno nuevo.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiResetPassword(token, password);
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="auth-error">
        Enlace inválido o incompleto.{' '}
        <Link href="/forgot-password" className="auth-link">
          Solicitar nuevo enlace
        </Link>
      </p>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="auth-form__fields">
        <label>
          Nueva contraseña
          <PasswordInput
            value={password}
            onChange={setPassword}
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            disabled={loading}
          />
        </label>
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        <AuthSubmitButton loading={loading} loadingLabel="Guardando…">
          Restablecer contraseña
        </AuthSubmitButton>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Nueva contraseña"
      description="Elige una contraseña segura para retomar el control de tu cuenta."
      footer={
        <p className="auth-footer-text">
          <Link href="/login" className="auth-link">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="auth-loading">Cargando…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
