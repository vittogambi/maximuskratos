'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthFormError } from '@/components/auth-form-error';
import { AuthFooterLink, AuthShell } from '@/components/auth-shell';
import { PasswordInput } from '@/components/password-input';
import { toAuthUserMessage } from '@/lib/auth-errors';
import { apiRegister } from '@/lib/api';
import { setAccessToken } from '@/lib/auth-storage';

export default function RegisterPage() {
  const router = useRouter();
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
      router.push('/app');
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      setError(toAuthUserMessage(raw, 0, 'register'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      description="Regístrate para acceder a la plataforma."
      footer={
        <AuthFooterLink
          text="¿Ya tienes cuenta?"
          linkText="Iniciar sesión"
          href="/login"
        />
      }
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tu@email.com"
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
          />
        </label>
        <AuthFormError message={error} context="register" />
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
