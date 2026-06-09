'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { AuthFooterLink, AuthShell } from '@/components/auth-shell';
import { AuthSubmitButton } from '@/components/auth-submit-button';
import { PasswordInput } from '@/components/password-input';
import { StaggerContainer, StaggerItem } from '@/components/motion';
import { LOGIN_INVALID_CREDENTIALS } from '@/lib/auth-errors';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { apiLogin } from '@/lib/api';
import { useRequireGuest } from '@/lib/use-require-guest';
import { setAccessToken } from '@/lib/auth-storage';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuthSession();
  const status = useRequireGuest();
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
      router.replace(getPostAuthPath(data.user.role));
      void refresh({ force: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : LOGIN_INVALID_CREDENTIALS;
      setError(message || LOGIN_INVALID_CREDENTIALS);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
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
      description="Accede con tu correo electrónico y contraseña."
      footer={
        <AuthFooterLink
          text="¿Primera vez aquí?"
          linkText="Crear cuenta"
          href="/register"
        />
      }
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <StaggerContainer className="auth-form__fields" stagger={0.06}>
          <StaggerItem>
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
          </StaggerItem>
          <StaggerItem>
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
          </StaggerItem>
          <StaggerItem>
            <p className="auth-footer-text" style={{ margin: 0, textAlign: 'right' }}>
              <Link href="/forgot-password" className="auth-link">
                Olvidé mi contraseña
              </Link>
            </p>
          </StaggerItem>
          {error ? (
            <StaggerItem>
              <p className="auth-error" role="alert">
                {error}
              </p>
            </StaggerItem>
          ) : null}
          <StaggerItem>
            <AuthSubmitButton loading={loading} loadingLabel="Entrando…">
              Entrar
            </AuthSubmitButton>
          </StaggerItem>
        </StaggerContainer>
      </form>
    </AuthShell>
  );
}
