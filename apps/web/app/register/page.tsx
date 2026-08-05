'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuthSession } from '@/components/auth-session-provider';
import { AuthFormError } from '@/components/auth-form-error';
import { AuthFooterLink, AuthShell } from '@/components/auth-shell';
import { AuthSubmitButton } from '@/components/auth-submit-button';
import { PasswordInput } from '@/components/password-input';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { apiMe, apiRegister } from '@/lib/api';
import { useRequireGuest } from '@/lib/use-require-guest';
import { setAccessToken } from '@/lib/auth-storage';

function RegisterDescription() {
  return (
    <>
      Crea tu cuenta sin tarjeta. Acceso a tu panel desde hoy, con identificación de fundador
      y prioridad en las primeras versiones. El diagnóstico y la plataforma completa se
      activan en el lanzamiento.
    </>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { refresh, status: authStatus, user } = useAuthSession();
  const status = useRequireGuest();

  // Safety valve: if the hook's effect is late (user arrived after status),
  // redirect from here too.
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
      const data = await apiRegister(email, password);
      setAccessToken(data.accessToken);
      const [me] = await Promise.all([apiMe(data.accessToken), refresh({ force: true })]);
      router.replace(getPostAuthPath(me.role, me.onboardingStep));
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  if (status === 'authenticated' && user) {
    return (
      <AuthShell title="Cuenta lista" description="Entrando a tu panel de fundador.">
        <div className="auth-loading">
          <div className="auth-success-mark" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mk-mark.svg" alt="" width={40} height={40} />
            <span className="auth-success-mark__line" />
          </div>
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
      description={<RegisterDescription />}
      footer={
        <AuthFooterLink
          text="¿Ya tienes cuenta?"
          linkText="Iniciar sesión"
          href="/login"
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
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              disabled={loading}
            />
          </label>
          <div className="auth-form__error-slot">
            <AuthFormError message={error} context="register" />
          </div>
          <AuthSubmitButton loading={loading} loadingLabel="Creando cuenta…">
            Crear cuenta de fundador
          </AuthSubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}
