'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { AuthFormError } from '@/components/auth-form-error';
import { AuthFooterLink, AuthShell } from '@/components/auth-shell';
import { AuthSubmitButton } from '@/components/auth-submit-button';
import { PasswordInput } from '@/components/password-input';
import { StaggerContainer, StaggerItem } from '@/components/motion';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { apiRegister } from '@/lib/api';
import { useRequireGuest } from '@/lib/use-require-guest';
import { setAccessToken } from '@/lib/auth-storage';

export default function RegisterPage() {
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
      const data = await apiRegister(email, password);
      setAccessToken(data.accessToken);
      await refresh({ force: true });
      router.replace(getPostAuthPath(data.user.role));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
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
      atmosphere="register"
      title="Crea tu cuenta de fundador"
      description="Cuenta gratis, estatus de fundador y acceso a tu panel desde hoy."
      footer={
        <AuthFooterLink
          text="¿Ya tienes cuenta?"
          linkText="Iniciar sesión"
          href="/login"
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
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
              />
            </label>
          </StaggerItem>
          <StaggerItem>
            <AuthFormError message={error} context="register" />
          </StaggerItem>
          <StaggerItem>
            <AuthSubmitButton loading={loading} loadingLabel="Creando cuenta…">
              Crear cuenta de fundador
            </AuthSubmitButton>
          </StaggerItem>
        </StaggerContainer>
      </form>
    </AuthShell>
  );
}
