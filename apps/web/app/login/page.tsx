'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { AuthFooterLink, AuthShell } from '@/components/auth-shell';
import { AuthSubmitButton } from '@/components/auth-submit-button';
import { PasswordInput } from '@/components/password-input';
import { LOGIN_INVALID_CREDENTIALS } from '@/lib/auth-errors';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { apiLogin, apiMe } from '@/lib/api';
import { useRequireGuest } from '@/lib/use-require-guest';
import { setAccessToken } from '@/lib/auth-storage';

export default function LoginPage() {
  const router = useRouter();
  const { refresh, status: authStatus, user } = useAuthSession();
  const status = useRequireGuest();

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      router.replace(getPostAuthPath(user.role, user.onboardingStep));
    }
  }, [authStatus, user, router]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setAccessToken(data.accessToken);
      const [me] = await Promise.all([apiMe(data.accessToken), refresh({ force: true })]);
      router.replace(getPostAuthPath(me.role, me.onboardingStep));
      return;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : LOGIN_INVALID_CREDENTIALS;
      setError(message || LOGIN_INVALID_CREDENTIALS);
      setLoading(false);
    }
  }

  if (status === 'authenticated' && user) {
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
      atmosphere="login"
      title="Iniciar sesión"
      description="Retoma tu proceso donde lo dejaste."
      footer={
        <AuthFooterLink
          text="¿Primera vez aquí?"
          linkText="Crear cuenta"
          href="/register"
        />
      }
    >
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
          <label>
            Contraseña
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={8}
              autoComplete="current-password"
              placeholder="Mínimo 8 caracteres"
              disabled={loading}
            />
          </label>
          <p className="auth-footer-text" style={{ margin: 0, textAlign: 'right' }}>
            <Link href="/forgot-password" className="auth-link">
              Olvidé mi contraseña
            </Link>
          </p>
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <AuthSubmitButton loading={loading} loadingLabel="Entrando…">
            Entrar
          </AuthSubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}
